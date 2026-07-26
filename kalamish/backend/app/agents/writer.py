from pathlib import Path
from typing import Dict, Any, Optional
from app.schemas.context_package import ContextPackage
from app.services.llm_service import LLMService
from app.utils.logging import logger

PROMPT_FILE = Path(__file__).resolve().parent.parent / "prompts" / "writer.md"


class WriterAgent:
    """Generates chapter prose using OpenAI based on ContextPackage with strict story continuity."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()

    def _load_system_prompt(self) -> str:
        if PROMPT_FILE.exists():
            return PROMPT_FILE.read_text(encoding="utf-8")
        return "You are a professional novel writer. Write engaging, vivid chapter prose."

    async def execute_async(self, context_package: ContextPackage) -> Dict[str, Any]:
        logger.info("[WriterAgent] Connecting to OpenAI to generate chapter content with story continuity")
        system_prompt = self._load_system_prompt()

        novel_info = context_package.novel
        chap_info = context_package.chapter
        preceding_chap = context_package.preceding_chapter
        previous_chaps = context_package.previous_chapters
        outline_info = context_package.outline

        preceding_text_block = "None (This is Chapter 1)"
        if preceding_chap:
            preceding_text_block = (
                f"Chapter {preceding_chap.get('chapter_number')}: {preceding_chap.get('title')}\n"
                f"Summary: {preceding_chap.get('summary')}\n"
                f"Ending Scene Snippet:\n{preceding_chap.get('content_snippet')}"
            )

        prompt = f"""
Novel Information:
- Title: {novel_info.get('title', 'Untitled')}
- Genre: {novel_info.get('genre', 'General Fiction')}
- Tone: {novel_info.get('tone', 'Standard')}
- Style: {novel_info.get('style', 'Descriptive')}
- POV: {novel_info.get('pov', 'Third Person')}

Target Chapter To Write:
- Chapter Number: {chap_info.get('chapter_number', preceding_chap.get('chapter_number', 0) + 1 if preceding_chap else 1)}
- Title: {chap_info.get('title', outline_info.get('title', 'Chapter Scene'))}

Preceding Chapter Context (STORY CONTINUITY ANCHOR):
{preceding_text_block}

Chapter Outline & Planned Scene Beats:
{outline_info.get('synopsis', 'Continue story directly from preceding chapter events.')}
Key Beats: {outline_info.get('key_events', [])}

Story World Characters (Incorporate them into the scene):
{context_package.characters}

Locations & World Setting:
{context_package.locations}

Chronological Timeline Events So Far:
{context_package.timeline}

World Rules & Constraints:
{context_package.world_rules}

User Instructions for This Scene:
{context_package.user_instruction or 'Write a complete, vivid chapter scene continuing directly from preceding events.'}

CRITICAL CONTINUITY DIRECTIVES:
1. You MUST seamlessly build directly upon the preceding chapter events provided above.
2. Preserve character continuity, ongoing relationships, recent discoveries, and established settings.
3. Integrate any newly requested characters or user instructions naturally into the existing narrative world without resetting or disconnecting the storyline.
4. Do NOT restart a standalone new story. Maintain complete narrative flow.
5. Start with exactly: "# Chapter {chap_info.get('chapter_number', preceding_chap.get('chapter_number', 0) + 1 if preceding_chap else 1)}: <concise original title>".
6. Generate a specific title from this chapter's actual events, then begin prose on the next line.
"""
        generated_prose = await self.llm_service.generate_text(
            prompt=prompt,
            system_instruction=system_prompt,
            temperature=0.75
        )

        word_cnt = len(generated_prose.split())
        return {
            "draft_content": generated_prose,
            "word_count": word_cnt
        }

    def execute(self, context_package: ContextPackage) -> Dict[str, Any]:
        """Synchronous wrapper for graph compatibility if called synchronously."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import nest_asyncio
                nest_asyncio.apply()
                return loop.run_until_complete(self.execute_async(context_package))
            return loop.run_until_complete(self.execute_async(context_package))
        except Exception:
            return asyncio.run(self.execute_async(context_package))
