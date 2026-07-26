import json
import asyncio
from typing import Annotated, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.database.models.user import User
from app.services.novel_service import NovelService
from app.services.chapter_service import ChapterService
from app.services.revision_service import RevisionService
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService
from app.schemas.chapter import ChapterUpdate
from app.graph import novel_workflow_app
from app.schemas.ai import (
    GenerateRequest, GenerateResponse,
    RewriteRequest,
    ReviseStoryRequest, ReviseStoryResponse,
    ChatRequest, ChatResponse
)

router = APIRouter(prefix="/ai", tags=["AI Engine"])

novel_service = NovelService()
chapter_service = ChapterService()
revision_service = RevisionService()
llm_service = LLMService()
retrieval_service = RetrievalService()


@router.post("/generate", response_model=GenerateResponse)
async def generate_content(
    req: GenerateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Trigger LangGraph AI workflow for chapter or outline generation."""
    # Verify novel ownership
    await novel_service.get_novel(db, current_user.id, req.novel_id)

    initial_state = {
        "user_instruction": req.user_instruction,
        "request_type": req.request_type,
        "novel_id": str(req.novel_id),
        "chapter_id": str(req.chapter_id) if req.chapter_id else None,
        "db_session": db
    }

    final_state = await novel_workflow_app.ainvoke(initial_state)

    edited_text = final_state.get("edited_content") or final_state.get("draft_content") or ""
    word_cnt = len(edited_text.split())

    return GenerateResponse(
        novel_id=req.novel_id,
        chapter_id=req.chapter_id,
        draft_content=final_state.get("draft_content", ""),
        edited_content=edited_text,
        word_count=word_cnt,
        consistency_results=final_state.get("consistency_results", {}),
        memory_results=final_state.get("memory_results", {}),
        logs=final_state.get("logs", [])
    )


@router.post("/rewrite")
async def rewrite_chapter(
    req: RewriteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Rewrite chapter prose with optional SSE streaming response."""
    chapter = await chapter_service.get_chapter(db, current_user.id, req.chapter_id)

    prompt = f"""
Existing Chapter Text:
{chapter.content}

Rewrite Instruction:
{req.user_instruction}

Please rewrite the chapter prose accordingly.
"""

    if req.stream:
        async def event_generator() -> AsyncGenerator[str, None]:
            # Generate full text from LLM service
            rewritten = await llm_service.generate_text(prompt=prompt)
            # Stream words/chunks with SSE format
            words = rewritten.split(" ")
            for i in range(0, len(words), 5):
                chunk = " ".join(words[i:i+5]) + " "
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                await asyncio.sleep(0.05)
            yield f"data: {json.dumps({'event': 'done'})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # Non-streaming response
    rewritten_text = await llm_service.generate_text(prompt=prompt)
    updated_chap = await chapter_service.update_chapter(
        db, current_user.id, req.chapter_id, ChapterUpdate(content=rewritten_text)
    )
    return {
        "chapter_id": str(updated_chap.id),
        "content": updated_chap.content,
        "word_count": updated_chap.word_count
    }


@router.post("/revise-story", response_model=ReviseStoryResponse)
async def revise_story(
    req: ReviseStoryRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Execute story-wide revisions across multiple chapters."""
    await novel_service.get_novel(db, current_user.id, req.novel_id)

    revision_details = []
    for chap_id in req.target_chapter_ids:
        # Verify ownership of chapter
        chap = await chapter_service.get_chapter(db, current_user.id, chap_id)

        context_package = await retrieval_service.build_context_package(
            session=db,
            novel_id=req.novel_id,
            user_instruction=req.revision_instruction,
            chapter_id=chap_id
        )
        serialized_context = context_package.model_dump_json(exclude={"relevant_scenes"})
        rewrite_prompt = f"""
You are revising one chapter as part of a multi-chapter story revision.

REVISION INSTRUCTION:
{req.revision_instruction}

STORY CONTEXT:
{serialized_context}

ORIGINAL CHAPTER:
{chap.content}

Return ONLY the complete revised chapter prose. Apply the instruction everywhere it is
relevant while preserving unaffected story details and continuity. Do not include notes,
analysis, markdown fences, or a summary of changes.
"""
        new_text = await llm_service.generate_text(prompt=rewrite_prompt)

        detail = await revision_service.revise_chapter(
            session=db,
            chapter_id=chap_id,
            new_content=new_text,
            changes_description=req.revision_instruction,
            revised_by_agent="RevisionAgent",
            reconcile_story_context=True
        )
        revision_details.append(detail)

    return ReviseStoryResponse(
        novel_id=req.novel_id,
        revised_chapters_count=len(revision_details),
        revision_details=revision_details
    )


@router.post("/chat", response_model=ChatResponse)
async def story_chat(
    req: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Conversational author assistant for brainstorming and feedback."""
    novel = await novel_service.get_novel(db, current_user.id, req.novel_id)

    system_instruction = f"""
You are an expert AI novel co-author and writing assistant for the novel:
Title: {novel.title}
Genre: {novel.genre or 'General'}
Tone: {novel.tone or 'Standard'}
Style: {novel.style or 'Descriptive'}

Answer the author's questions, provide constructive feedback, or brainstorm plot ideas.
"""
    chat_prompt = f"Author Message: {req.message}\nChat History: {req.history}"
    reply = await llm_service.generate_text(prompt=chat_prompt, system_instruction=system_instruction)

    return ChatResponse(
        novel_id=req.novel_id,
        reply=reply
    )
