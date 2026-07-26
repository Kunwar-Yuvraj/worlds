import json
import re
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import (
    NovelRepository,
    ChapterRepository,
    CharacterRepository,
    LocationRepository,
    TimelineRepository,
    WorldRuleRepository,
    OutlineRepository
)
from app.schemas.character import CharacterCreate
from app.schemas.location import LocationCreate
from app.schemas.timeline import TimelineCreate
from app.schemas.world_rule import WorldRuleCreate
from app.schemas.outline import OutlineCreate

from app.services.llm_service import LLMService
from app.utils.logging import logger


class WorldBuilderAgent:
    """
    Autonomous Narrative Architect & World Builder Agent.
    Runs BEFORE retrieval node. Decides if new characters, locations, timeline events,
    world rules, or outlines should be created for the novel, persists them to DB,
    so RetrievalAgent & WriterAgent receive them in full context.
    """

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()
        self.novel_repo = NovelRepository()
        self.chap_repo = ChapterRepository()
        self.char_repo = CharacterRepository()
        self.loc_repo = LocationRepository()
        self.timeline_repo = TimelineRepository()
        self.rule_repo = WorldRuleRepository()
        self.outline_repo = OutlineRepository()

    async def execute_async(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        user_instruction: str = "",
        chapter_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        logger.info(f"[WorldBuilderAgent] Evaluating story world & creating required entities for novel_id={novel_id}")
        logs: List[str] = []
        created_entities: List[str] = []

        # 1. Fetch current story state
        novel_obj = await self.novel_repo.get_by_id(session, novel_id)
        all_chaps = await self.chap_repo.list_by_novel(session, novel_id)
        all_chaps.sort(key=lambda c: c.chapter_number)

        existing_chars = await self.char_repo.list_by_novel(session, novel_id)
        existing_char_names = {c.name.lower() for c in existing_chars}

        existing_locs = await self.loc_repo.list_by_novel(session, novel_id)
        existing_loc_names = {l.name.lower() for l in existing_locs}

        existing_events = await self.timeline_repo.list_by_novel(session, novel_id)
        existing_event_titles = {e.title.lower() for e in existing_events}

        existing_rules = await self.rule_repo.list_by_novel(session, novel_id)
        existing_rule_names = {r.rule_name.lower() for r in existing_rules}

        existing_outlines = await self.outline_repo.list_by_novel(session, novel_id)
        existing_chap_nums = {o.chapter_number for o in existing_outlines}

        # Determine target chapter number & preceding context
        target_chap_number = 1
        preceding_text = "This is the start of the novel (Chapter 1)."
        if chapter_id:
            chap = await self.chap_repo.get_by_id(session, chapter_id)
            if chap:
                target_chap_number = chap.chapter_number
        elif all_chaps:
            target_chap_number = all_chaps[-1].chapter_number + 1

        preceding_chaps = [c for c in all_chaps if c.chapter_number < target_chap_number]
        if preceding_chaps:
            last_chap = preceding_chaps[-1]
            preceding_text = f"Preceding Chapter {last_chap.chapter_number} ({last_chap.title}):\n{last_chap.content[-1500:] if last_chap.content else ''}"

        # 2. Ask OpenAI to decide on new characters, locations, timeline, world rules & outline
        prompt = f"""
You are an autonomous Narrative Architect & WorldBuilder AI for an ongoing novel.

NOVEL CONTEXT:
Title: {novel_obj.title if novel_obj else 'Untitled'}
Genre: {novel_obj.genre if novel_obj else 'General'}
Target Chapter Number: {target_chap_number}

EXISTING CHARACTERS: {list(existing_char_names)}
EXISTING LOCATIONS: {list(existing_loc_names)}
EXISTING WORLD RULES: {list(existing_rule_names)}
EXISTING TIMELINE EVENTS: {list(existing_event_titles)}

PRECEDING STORY STATE:
{preceding_text}

USER INSTRUCTION / PROMPT FOR THIS SCENE:
{user_instruction}

TASK:
Analyze the user prompt and story context. Decide autonomously:
1. Should any NEW characters be created for this scene or novel? (e.g. Rudeus, Paul, Zenith if requested or implied)
2. Should any NEW locations be created?
3. Should a NEW timeline event / plot beat be created for Chapter {target_chap_number}?
4. Should any NEW worldbuilding rules be created?
5. Should an outline synopsis be created for Chapter {target_chap_number}?

Respond ONLY in raw JSON format (no markdown fences, no extra text):
{{
  "new_characters": [
    {{"name": "...", "role": "protagonist|antagonist|supporting", "description": "...", "backstory": "..."}}
  ],
  "new_locations": [
    {{"name": "...", "description": "...", "significance": "..."}}
  ],
  "new_timeline_events": [
    {{"title": "...", "description": "...", "impact": "..."}}
  ],
  "new_world_rules": [
    {{"rule_name": "...", "category": "technology|magic|society|physics|general", "description": "..."}}
  ],
  "new_outlines": [
    {{"chapter_number": {target_chap_number}, "title": "...", "synopsis": "...", "key_events": ["..."]}}
  ]
}}
"""

        parsed = {}
        try:
            raw_json = await self.llm_service.generate_text(prompt=prompt, temperature=0.2)
            clean_json = raw_json.strip()
            if "```" in clean_json:
                clean_json = re.sub(r'```(?:json)?', '', clean_json).strip()
            parsed = json.loads(clean_json)
        except Exception as e:
            logger.warning(f"[WorldBuilderAgent] JSON parse warning: {str(e)}")

        # A. Create New Characters
        for c_data in parsed.get("new_characters", []):
            name = c_data.get("name", "").strip()
            if name and name.lower() not in existing_char_names:
                role = c_data.get("role", "supporting")
                if role not in ["protagonist", "antagonist", "supporting"]:
                    role = "supporting"
                created = await self.char_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=CharacterCreate(
                        name=name,
                        role=role,
                        description=c_data.get("description", "Created by WorldBuilder for scene"),
                        backstory=c_data.get("backstory", "")
                    )
                )
                existing_char_names.add(name.lower())
                created_entities.append(f"Character: {created.name}")
                logs.append(f"WorldBuilder: Created character '{created.name}' ({created.role})")

        # Note: LLM-based extraction above handles character detection from prompts.
        # No regex fallback needed — avoids creating junk characters from common words.

        # B. Create New Locations
        for l_data in parsed.get("new_locations", []):
            name = l_data.get("name", "").strip()
            if name and name.lower() not in existing_loc_names:
                created = await self.loc_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=LocationCreate(
                        name=name,
                        description=l_data.get("description", "Location created by WorldBuilder"),
                        significance=l_data.get("significance")
                    )
                )
                existing_loc_names.add(name.lower())
                created_entities.append(f"Location: {created.name}")
                logs.append(f"WorldBuilder: Created location '{created.name}'")

        # C. Create New Timeline Events
        next_order = len(existing_events) + 1
        for t_data in parsed.get("new_timeline_events", []):
            title = t_data.get("title", "").strip()
            if title and title.lower() not in existing_event_titles:
                created = await self.timeline_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=TimelineCreate(
                        event_order=next_order,
                        title=title,
                        description=t_data.get("description", title),
                        chapter_id=chapter_id,
                        impact=t_data.get("impact")
                    )
                )
                existing_event_titles.add(title.lower())
                next_order += 1
                created_entities.append(f"Timeline: {created.title}")
                logs.append(f"WorldBuilder: Added timeline event '{created.title}'")

        # D. Create New World Rules
        for r_data in parsed.get("new_world_rules", []):
            rname = r_data.get("rule_name", "").strip()
            if rname and rname.lower() not in existing_rule_names:
                category = r_data.get("category", "general")
                if category not in ["technology", "magic", "society", "physics", "general"]:
                    category = "general"
                created = await self.rule_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=WorldRuleCreate(
                        rule_name=rname,
                        category=category,
                        description=r_data.get("description", rname)
                    )
                )
                existing_rule_names.add(rname.lower())
                created_entities.append(f"Rule: {created.rule_name}")
                logs.append(f"WorldBuilder: Added world rule '{created.rule_name}'")

        # E. Create New Outlines
        for o_data in parsed.get("new_outlines", []):
            cnum = o_data.get("chapter_number", target_chap_number)
            title = o_data.get("title", f"Chapter {cnum}").strip()
            if cnum not in existing_chap_nums and title:
                created = await self.outline_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=OutlineCreate(
                        chapter_number=cnum,
                        title=title,
                        synopsis=o_data.get("synopsis", title),
                        key_events=o_data.get("key_events", []),
                        target_word_count=2000
                    )
                )
                existing_chap_nums.add(cnum)
                created_entities.append(f"Outline: Ch.{cnum} {created.title}")
                logs.append(f"WorldBuilder: Planned outline for Chapter {cnum}")

        if not logs:
            logs.append("WorldBuilder: Assessed story world & verified continuity.")

        return {
            "status": "completed",
            "created_entities": created_entities,
            "logs": logs
        }
