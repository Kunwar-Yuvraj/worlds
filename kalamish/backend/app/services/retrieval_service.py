import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.context_package import ContextPackage
from app.repositories import (
    NovelRepository,
    ChapterRepository,
    CharacterRepository,
    LocationRepository,
    TimelineRepository,
    OutlineRepository,
    WorldRuleRepository,
    CharacterRelationshipRepository,
    PlotThreadRepository
)
from app.services.embedding_service import EmbeddingService
from app.utils.logging import logger


class RetrievalService:
    def __init__(
        self,
        novel_repo: Optional[NovelRepository] = None,
        chapter_repo: Optional[ChapterRepository] = None,
        character_repo: Optional[CharacterRepository] = None,
        location_repo: Optional[LocationRepository] = None,
        timeline_repo: Optional[TimelineRepository] = None,
        outline_repo: Optional[OutlineRepository] = None,
        world_rule_repo: Optional[WorldRuleRepository] = None,
        relationship_repo: Optional[CharacterRelationshipRepository] = None,
        plot_thread_repo: Optional[PlotThreadRepository] = None,
        embedding_service: Optional[EmbeddingService] = None
    ):
        self.novel_repo = novel_repo or NovelRepository()
        self.chapter_repo = chapter_repo or ChapterRepository()
        self.character_repo = character_repo or CharacterRepository()
        self.location_repo = location_repo or LocationRepository()
        self.timeline_repo = timeline_repo or TimelineRepository()
        self.outline_repo = outline_repo or OutlineRepository()
        self.world_rule_repo = world_rule_repo or WorldRuleRepository()
        self.relationship_repo = relationship_repo or CharacterRelationshipRepository()
        self.plot_thread_repo = plot_thread_repo or PlotThreadRepository()
        self.embedding_service = embedding_service or EmbeddingService()

    async def build_context_package(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        user_instruction: str = "",
        chapter_id: Optional[uuid.UUID] = None
    ) -> ContextPackage:
        logger.info(f"[RetrievalService] Assembling Context Package for novel_id={novel_id}")

        # 1. Novel details
        novel_obj = await self.novel_repo.get_by_id(session, novel_id)
        novel_dict: Dict[str, Any] = {}
        if novel_obj:
            novel_dict = {
                "id": str(novel_obj.id),
                "title": novel_obj.title,
                "genre": novel_obj.genre,
                "language": novel_obj.language,
                "tone": novel_obj.tone,
                "style": novel_obj.style,
                "pov": novel_obj.pov,
                "estimated_chapters": novel_obj.estimated_chapters,
                "status": novel_obj.status
            }

        # 2. All Chapters & Preceding Chapter Retrieval
        all_chapters = await self.chapter_repo.list_by_novel(session, novel_id)
        all_chapters.sort(key=lambda c: c.chapter_number)

        chapter_dict: Dict[str, Any] = {}
        preceding_dict: Dict[str, Any] = {}
        previous_chapters_list: List[Dict[str, Any]] = []

        target_chap_number = 1
        if chapter_id:
            chap_obj = await self.chapter_repo.get_by_id(session, chapter_id)
            if chap_obj:
                target_chap_number = chap_obj.chapter_number
                chapter_dict = {
                    "id": str(chap_obj.id),
                    "chapter_number": chap_obj.chapter_number,
                    "title": chap_obj.title,
                    "content": chap_obj.content,
                    "summary": chap_obj.summary,
                    "word_count": chap_obj.word_count,
                    "status": chap_obj.status
                }
        elif all_chapters:
            target_chap_number = all_chapters[-1].chapter_number + 1

        # Fetch preceding chapter(s) for narrative continuity
        preceding_chaps = [c for c in all_chapters if c.chapter_number < target_chap_number]
        if preceding_chaps:
            last_chap = preceding_chaps[-1]
            content_snippet = last_chap.content or ""
            if len(content_snippet) > 2500:
                content_snippet = "..." + content_snippet[-2500:]

            preceding_dict = {
                "id": str(last_chap.id),
                "chapter_number": last_chap.chapter_number,
                "title": last_chap.title,
                "summary": last_chap.summary or f"Chapter {last_chap.chapter_number}",
                "content_snippet": content_snippet
            }

            for p_chap in preceding_chaps:
                p_snippet = p_chap.content or ""
                if len(p_snippet) > 1000:
                    p_snippet = "..." + p_snippet[-1000:]
                previous_chapters_list.append({
                    "chapter_number": p_chap.chapter_number,
                    "title": p_chap.title,
                    "summary": p_chap.summary or f"Chapter {p_chap.chapter_number}",
                    "content_snippet": p_snippet
                })

        # 3. Outline item
        outlines = await self.outline_repo.list_by_novel(session, novel_id)
        outline_dict: Dict[str, Any] = {}
        if target_chap_number:
            match = next((o for o in outlines if o.chapter_number == target_chap_number), None)
            if match:
                outline_dict = {
                    "id": str(match.id),
                    "chapter_number": match.chapter_number,
                    "title": match.title,
                    "synopsis": match.synopsis,
                    "key_events": match.key_events,
                    "target_word_count": match.target_word_count
                }
        elif outlines:
            match = outlines[0]
            outline_dict = {
                "id": str(match.id),
                "chapter_number": match.chapter_number,
                "title": match.title,
                "synopsis": match.synopsis,
                "key_events": match.key_events,
                "target_word_count": match.target_word_count
            }

        # 4. Characters
        characters = await self.character_repo.list_by_novel(session, novel_id)
        characters_list = [
            {
                "id": str(c.id),
                "name": c.name,
                "role": c.role,
                "description": c.description,
                "personality_traits": c.personality_traits,
                "backstory": c.backstory
            }
            for c in characters
        ]

        # 5. Relationships
        relationships = await self.relationship_repo.list_by_novel(session, novel_id)
        relationships_list = [
            {
                "id": str(r.id),
                "character_a_id": str(r.character_a_id),
                "character_b_id": str(r.character_b_id),
                "relationship_type": r.relationship_type,
                "description": r.description
            }
            for r in relationships
        ]

        # 6. Timeline
        timeline_events = await self.timeline_repo.list_by_novel(session, novel_id)
        timeline_list = [
            {
                "id": str(t.id),
                "event_order": t.event_order,
                "title": t.title,
                "description": t.description,
                "chapter_id": str(t.chapter_id) if t.chapter_id else None,
                "impact": t.impact
            }
            for t in timeline_events
        ]

        # 7. World Rules
        rules = await self.world_rule_repo.list_by_novel(session, novel_id)
        rules_list = [
            {
                "id": str(w.id),
                "rule_name": w.rule_name,
                "category": w.category,
                "description": w.description
            }
            for w in rules
        ]

        # 8. Locations
        locations = await self.location_repo.list_by_novel(session, novel_id)
        locations_list = [
            {
                "id": str(l.id),
                "name": l.name,
                "description": l.description,
                "significance": l.significance
            }
            for l in locations
        ]

        # 9. Plot Threads
        threads = await self.plot_thread_repo.list_by_novel(session, novel_id)
        threads_list = [
            {
                "id": str(p.id),
                "name": p.name,
                "status": p.status,
                "description": p.description,
                "resolution": p.resolution
            }
            for p in threads
        ]

        # 10. Relevant Scenes via vector search
        relevant_scenes = []
        if user_instruction:
            relevant_scenes = await self.embedding_service.search_relevant_scenes(
                session=session,
                novel_id=novel_id,
                query=user_instruction,
                limit=5
            )

        return ContextPackage(
            novel=novel_dict,
            chapter=chapter_dict,
            preceding_chapter=preceding_dict,
            previous_chapters=previous_chapters_list,
            outline=outline_dict,
            characters=characters_list,
            relationships=relationships_list,
            timeline=timeline_list,
            world_rules=rules_list,
            locations=locations_list,
            plot_threads=threads_list,
            relevant_scenes=relevant_scenes,
            user_instruction=user_instruction
        )
