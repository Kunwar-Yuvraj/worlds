import json
import re
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.agent_memory_repository import AgentMemoryRepository
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.character_repository import CharacterRepository
from app.repositories.location_repository import LocationRepository
from app.repositories.timeline_repository import TimelineRepository
from app.repositories.world_rule_repository import WorldRuleRepository
from app.repositories.outline_repository import OutlineRepository
from app.repositories.relationship_repository import CharacterRelationshipRepository
from app.repositories.plot_thread_repository import PlotThreadRepository

from app.schemas.chapter import ChapterUpdate
from app.schemas.character import CharacterCreate, CharacterUpdate
from app.schemas.location import LocationCreate, LocationUpdate
from app.schemas.timeline import TimelineCreate, TimelineUpdate
from app.schemas.world_rule import WorldRuleCreate, WorldRuleUpdate
from app.schemas.outline import OutlineCreate, OutlineUpdate

from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.utils.logging import logger


class MemoryService:
    def __init__(
        self,
        memory_repo: Optional[AgentMemoryRepository] = None,
        embedding_service: Optional[EmbeddingService] = None,
        llm_service: Optional[LLMService] = None
    ):
        self.memory_repo = memory_repo or AgentMemoryRepository()
        self.embedding_service = embedding_service or EmbeddingService()
        self.llm_service = llm_service or LLMService()

        self.char_repo = CharacterRepository()
        self.loc_repo = LocationRepository()
        self.timeline_repo = TimelineRepository()
        self.rule_repo = WorldRuleRepository()
        self.outline_repo = OutlineRepository()
        self.relationship_repo = CharacterRelationshipRepository()
        self.plot_thread_repo = PlotThreadRepository()
        self.chapter_repo = ChapterRepository()

    async def _merge_character_records(
        self,
        session: AsyncSession,
        source_character,
        target_character
    ) -> None:
        """Move relationships to the surviving character, then remove the duplicate."""
        relationships = await self.relationship_repo.list_by_novel(
            session, source_character.novel_id
        )
        for relationship in relationships:
            if (
                relationship.character_a_id != source_character.id
                and relationship.character_b_id != source_character.id
            ):
                continue

            character_a_id = (
                target_character.id
                if relationship.character_a_id == source_character.id
                else relationship.character_a_id
            )
            character_b_id = (
                target_character.id
                if relationship.character_b_id == source_character.id
                else relationship.character_b_id
            )

            if character_a_id == character_b_id:
                await self.relationship_repo.delete(session, relationship)
                continue

            duplicate = next(
                (
                    candidate
                    for candidate in relationships
                    if candidate.id != relationship.id
                    and frozenset((candidate.character_a_id, candidate.character_b_id))
                    == frozenset((character_a_id, character_b_id))
                ),
                None
            )
            if duplicate:
                await self.relationship_repo.update(
                    session,
                    duplicate,
                    relationship.relationship_type,
                    relationship.description
                )
                await self.relationship_repo.delete(session, relationship)
            else:
                await self.relationship_repo.reassign_characters(
                    session,
                    relationship,
                    character_a_id,
                    character_b_id
                )

        await self.char_repo.delete(session, source_character)

    async def process_and_store_memory(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        agent_name: str,
        content: str,
        chapter_id: Optional[uuid.UUID] = None,
        reconcile_existing: bool = False,
        revision_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        logger.info(f"[MemoryService] Extracting & persisting story entities for novel_id={novel_id}")

        memory_key = f"extraction_{uuid.uuid4().hex[:8]}"
        extracted_summary: List[str] = []

        existing_chars = await self.char_repo.list_by_novel(session, novel_id)
        existing_chars_by_name = {c.name.lower(): c for c in existing_chars}
        existing_chars_by_id = {str(c.id): c for c in existing_chars}

        existing_locs = await self.loc_repo.list_by_novel(session, novel_id)
        existing_locs_by_name = {l.name.lower(): l for l in existing_locs}

        existing_events = await self.timeline_repo.list_by_novel(session, novel_id)
        existing_events_by_title = {e.title.lower(): e for e in existing_events}
        next_order = len(existing_events) + 1

        existing_rules = await self.rule_repo.list_by_novel(session, novel_id)
        existing_rules_by_name = {r.rule_name.lower(): r for r in existing_rules}

        existing_outlines = await self.outline_repo.list_by_novel(session, novel_id)
        existing_outlines_by_chapter = {o.chapter_number: o for o in existing_outlines}

        existing_relationships = await self.relationship_repo.list_by_novel(session, novel_id)

        existing_plot_threads = await self.plot_thread_repo.list_by_novel(session, novel_id)
        existing_plot_threads_by_name = {p.name.lower(): p for p in existing_plot_threads}

        parsed = {}
        parsed_successfully = False
        changes = {"created": 0, "updated": 0, "deleted": 0}

        # 1. Ask OpenAI to extract structured entities
        extraction_prompt = f"""
Analyze the following novel chapter prose and extract the complete current structured story state
represented by this chapter. This is a story revision, so include existing entities whose details
changed as well as newly introduced entities.

REVISION INSTRUCTION:
{revision_instruction or "None (normal memory extraction)"}

EXISTING CHARACTERS (use the ID or previous_name when a revision changes an existing identity):
{json.dumps([{"id": str(c.id), "name": c.name} for c in existing_chars])}

PROSE:
{content[:4000]}

Respond ONLY in raw JSON format (no markdown fences, no extra text) matching this exact schema:
{{
  "characters": [
    {{"existing_character_id": "existing UUID or null", "previous_name": "old name or null", "name": "...", "role": "protagonist|antagonist|supporting", "description": "...", "personality_traits": {{}}, "backstory": "..."}}
  ],
  "removed_characters": [
    {{"existing_character_id": "existing UUID or null", "name": "character explicitly removed by the revision", "reason": "..."}}
  ],
  "locations": [
    {{"name": "...", "description": "...", "significance": "..."}}
  ],
  "timeline_events": [
    {{"title": "...", "description": "...", "impact": "..."}}
  ],
  "world_rules": [
    {{"rule_name": "...", "category": "technology|magic|society|physics|general", "description": "..."}}
  ],
  "outlines": [
    {{"chapter_number": 1, "title": "...", "synopsis": "...", "key_events": ["..."]}}
  ],
  "relationships": [
    {{"character_a": "...", "character_b": "...", "relationship_type": "...", "description": "..."}}
  ],
  "plot_threads": [
    {{"name": "...", "status": "open|resolved|abandoned", "description": "...", "resolution": null}}
  ]
}}
"""

        try:
            raw_llm_json = await self.llm_service.generate_text(
                prompt=extraction_prompt,
                temperature=0.2
            )

            # Clean JSON if returned inside markdown code blocks
            clean_json = raw_llm_json.strip()
            if "```" in clean_json:
                clean_json = re.sub(r'```(?:json)?', '', clean_json).strip()

            parsed = json.loads(clean_json)
            parsed_successfully = isinstance(parsed, dict)
        except Exception as e:
            logger.warning(f"[MemoryService] JSON LLM extraction parse warning: {str(e)}")

        # A. Persist Characters from LLM parsed JSON
        retained_character_ids = set()
        for c_data in parsed.get("characters", []):
            name = c_data.get("name", "").strip()
            character_id = str(c_data.get("existing_character_id") or "").strip()
            previous_name = str(c_data.get("previous_name") or "").strip()
            existing_character = None
            if reconcile_existing:
                existing_character = (
                    existing_chars_by_id.get(character_id)
                    or existing_chars_by_name.get(previous_name.lower())
                    or existing_chars_by_name.get(name.lower())
                )
            else:
                existing_character = existing_chars_by_name.get(name.lower())

            if name and existing_character and reconcile_existing:
                # If a previous run already created the renamed character, merge
                # the old record into it instead of leaving duplicate identities.
                name_collision = existing_chars_by_name.get(name.lower())
                if name_collision and name_collision.id != existing_character.id:
                    old_character = existing_character
                    await self._merge_character_records(
                        session, old_character, name_collision
                    )
                    existing_chars_by_id.pop(str(old_character.id), None)
                    existing_chars_by_name.pop(old_character.name.lower(), None)
                    existing_character = name_collision
                    changes["deleted"] += 1
                    extracted_summary.append(
                        f"Merged replaced character: {old_character.name} -> {name}"
                    )

                old_name = existing_character.name
                role = c_data.get("role")
                if role not in ["protagonist", "antagonist", "supporting"]:
                    role = existing_character.role
                await self.char_repo.update(
                    session,
                    existing_character,
                    CharacterUpdate(
                        name=name,
                        role=role,
                        description=c_data.get("description", existing_character.description),
                        personality_traits=c_data.get(
                            "personality_traits", existing_character.personality_traits
                        ),
                        backstory=c_data.get("backstory", existing_character.backstory)
                    )
                )
                if old_name.lower() != name.lower():
                    existing_chars_by_name.pop(old_name.lower(), None)
                existing_chars_by_name[name.lower()] = existing_character
                existing_chars_by_id[str(existing_character.id)] = existing_character
                retained_character_ids.add(existing_character.id)
                changes["updated"] += 1
                extracted_summary.append(
                    f"Updated character: {old_name} -> {name}"
                    if old_name != name
                    else f"Updated character: {name}"
                )
            elif name and not existing_character:
                role = c_data.get("role", "supporting")
                if role not in ["protagonist", "antagonist", "supporting"]:
                    role = "supporting"
                character = await self.char_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=CharacterCreate(
                        name=name,
                        role=role,
                        description=c_data.get("description", "Introduced in story prose"),
                        personality_traits=c_data.get("personality_traits") or {},
                        backstory=c_data.get("backstory", "")
                    )
                )
                existing_chars_by_name[name.lower()] = character
                existing_chars_by_id[str(character.id)] = character
                retained_character_ids.add(character.id)
                changes["created"] += 1
                extracted_summary.append(f"Character: {name}")

        # Note: WorldBuilderAgent handles pre-generation character creation.
        # LLM extraction above catches any remaining characters from prose.

        # C. Persist Locations from LLM
        for l_data in parsed.get("locations", []):
            name = l_data.get("name", "").strip()
            existing_location = existing_locs_by_name.get(name.lower())
            if name and existing_location and reconcile_existing:
                await self.loc_repo.update(
                    session,
                    existing_location,
                    LocationUpdate(
                        description=l_data.get("description"),
                        significance=l_data.get("significance")
                    )
                )
                changes["updated"] += 1
                extracted_summary.append(f"Updated location: {name}")
            elif name and not existing_location:
                location = await self.loc_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=LocationCreate(
                        name=name,
                        description=l_data.get("description"),
                        significance=l_data.get("significance")
                    )
                )
                existing_locs_by_name[name.lower()] = location
                changes["created"] += 1
                extracted_summary.append(f"Location: {name}")

        # D. Persist Timeline Events from LLM
        returned_timeline_titles = {
            item.get("title", "").strip().lower()
            for item in parsed.get("timeline_events", [])
            if item.get("title", "").strip()
        }
        for t_data in parsed.get("timeline_events", []):
            title = t_data.get("title", "").strip()
            existing_event = existing_events_by_title.get(title.lower())
            if title and existing_event and reconcile_existing:
                await self.timeline_repo.update(
                    session,
                    existing_event,
                    TimelineUpdate(
                        description=t_data.get("description", title),
                        chapter_id=chapter_id,
                        impact=t_data.get("impact")
                    )
                )
                changes["updated"] += 1
                extracted_summary.append(f"Updated timeline: {title}")
            elif title and not existing_event:
                event = await self.timeline_repo.create(
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
                existing_events_by_title[title.lower()] = event
                next_order += 1
                changes["created"] += 1
                extracted_summary.append(f"Timeline: {title}")

        # A revision's extracted timeline is a complete snapshot for that chapter.
        # Remove chapter-scoped events that no longer exist in the revised prose.
        if reconcile_existing and chapter_id and parsed_successfully and "timeline_events" in parsed:
            for event in existing_events:
                if event.chapter_id == chapter_id and event.title.lower() not in returned_timeline_titles:
                    await self.timeline_repo.delete(session, event)
                    changes["deleted"] += 1
                    extracted_summary.append(f"Removed timeline: {event.title}")

        # E. Persist World Rules from LLM
        for r_data in parsed.get("world_rules", []):
            rname = r_data.get("rule_name", "").strip()
            existing_rule = existing_rules_by_name.get(rname.lower())
            if rname and existing_rule and reconcile_existing:
                category = r_data.get("category", existing_rule.category)
                if category not in ["technology", "magic", "society", "physics", "general"]:
                    category = existing_rule.category
                await self.rule_repo.update(
                    session,
                    existing_rule,
                    WorldRuleUpdate(
                        category=category,
                        description=r_data.get("description", existing_rule.description)
                    )
                )
                changes["updated"] += 1
                extracted_summary.append(f"Updated rule: {rname}")
            elif rname and not existing_rule:
                category = r_data.get("category", "general")
                if category not in ["technology", "magic", "society", "physics", "general"]:
                    category = "general"
                rule = await self.rule_repo.create(
                    session=session,
                    novel_id=novel_id,
                    data=WorldRuleCreate(
                        rule_name=rname,
                        category=category,
                        description=r_data.get("description", rname)
                    )
                )
                existing_rules_by_name[rname.lower()] = rule
                changes["created"] += 1
                extracted_summary.append(f"Rule: {rname}")

        # F. Persist Outlines from LLM
        for o_data in parsed.get("outlines", []):
            cnum = o_data.get("chapter_number", 1)
            title = o_data.get("title", f"Chapter {cnum}").strip()
            existing_outline = existing_outlines_by_chapter.get(cnum)
            if title and existing_outline and reconcile_existing:
                await self.outline_repo.update(
                    session,
                    existing_outline,
                    OutlineUpdate(
                        title=title,
                        synopsis=o_data.get("synopsis", title),
                        key_events=o_data.get("key_events", [])
                    )
                )
                changes["updated"] += 1
                extracted_summary.append(f"Updated outline: Ch.{cnum} {title}")
            elif title and not existing_outline:
                outline = await self.outline_repo.create(
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
                existing_outlines_by_chapter[cnum] = outline
                changes["created"] += 1
                extracted_summary.append(f"Outline: Ch.{cnum} {title}")

        # G. Persist character relationships using character names from the extraction.
        existing_relationships = await self.relationship_repo.list_by_novel(session, novel_id)
        existing_relationships_by_pair = {
            frozenset((r.character_a_id, r.character_b_id)): r for r in existing_relationships
        }
        for rel_data in parsed.get("relationships", []):
            char_a = existing_chars_by_name.get(rel_data.get("character_a", "").strip().lower())
            char_b = existing_chars_by_name.get(rel_data.get("character_b", "").strip().lower())
            if not char_a or not char_b or char_a.id == char_b.id:
                continue
            pair = frozenset((char_a.id, char_b.id))
            existing_relationship = existing_relationships_by_pair.get(pair)
            if existing_relationship and reconcile_existing:
                await self.relationship_repo.update(
                    session,
                    existing_relationship,
                    relationship_type=rel_data.get("relationship_type", existing_relationship.relationship_type),
                    description=rel_data.get("description")
                )
                changes["updated"] += 1
                extracted_summary.append(
                    f"Updated relationship: {char_a.name} / {char_b.name}"
                )
            elif not existing_relationship:
                relationship = await self.relationship_repo.create(
                    session,
                    novel_id,
                    char_a.id,
                    char_b.id,
                    rel_data.get("relationship_type", "associated"),
                    rel_data.get("description")
                )
                existing_relationships_by_pair[pair] = relationship
                changes["created"] += 1
                extracted_summary.append(f"Relationship: {char_a.name} / {char_b.name}")

        # Delete only characters explicitly marked as removed. Never infer deletion
        # merely because a character was absent from one revised chapter.
        if reconcile_existing:
            for removed_data in parsed.get("removed_characters", []):
                if isinstance(removed_data, str):
                    removed_id = ""
                    removed_name = removed_data.strip()
                else:
                    removed_id = str(
                        removed_data.get("existing_character_id") or ""
                    ).strip()
                    removed_name = str(removed_data.get("name") or "").strip()
                character_to_remove = (
                    existing_chars_by_id.get(removed_id)
                    or existing_chars_by_name.get(removed_name.lower())
                )
                if (
                    character_to_remove
                    and character_to_remove.id not in retained_character_ids
                ):
                    await self.char_repo.delete(session, character_to_remove)
                    existing_chars_by_id.pop(str(character_to_remove.id), None)
                    existing_chars_by_name.pop(character_to_remove.name.lower(), None)
                    changes["deleted"] += 1
                    extracted_summary.append(
                        f"Removed character: {character_to_remove.name}"
                    )

        # H. Persist plot-thread state changes.
        for thread_data in parsed.get("plot_threads", []):
            name = thread_data.get("name", "").strip()
            existing_thread = existing_plot_threads_by_name.get(name.lower())
            status_value = thread_data.get("status", "open")
            if status_value not in ["open", "resolved", "abandoned"]:
                status_value = "open"
            if name and existing_thread and reconcile_existing:
                await self.plot_thread_repo.update(
                    session,
                    existing_thread,
                    description=thread_data.get("description", existing_thread.description),
                    status=status_value,
                    resolution=thread_data.get("resolution")
                )
                changes["updated"] += 1
                extracted_summary.append(f"Updated plot thread: {name}")
            elif name and not existing_thread:
                thread = await self.plot_thread_repo.create(
                    session,
                    novel_id,
                    name,
                    thread_data.get("description", name),
                    status_value,
                    thread_data.get("resolution")
                )
                existing_plot_threads_by_name[name.lower()] = thread
                changes["created"] += 1
                extracted_summary.append(f"Plot thread: {name}")

        fact_payload = {
            "source_text_snippet": content[:200],
            "extracted_entities": extracted_summary,
            "extracted_facts": [{"fact": s} for s in extracted_summary] or [{"fact": "Analyzed chapter prose"}]
        }

        # Save in AgentMemory table
        memory_entry = await self.memory_repo.create(
            session=session,
            novel_id=novel_id,
            agent_name=agent_name,
            memory_key=memory_key,
            memory_value=fact_payload
        )

        # Store vector embedding & generate automatic chapter summary
        if chapter_id:
            try:
                chap_obj = await self.chapter_repo.get_by_id(session, chapter_id)
                if chap_obj and (reconcile_existing or not chap_obj.summary):
                    summary_prompt = f"Provide a concise 2-sentence story summary of what occurs in this chapter:\n\n{content[:2500]}"
                    generated_summary = await self.llm_service.generate_text(prompt=summary_prompt, temperature=0.3)
                    if generated_summary and not generated_summary.startswith("[Simulated"):
                        await self.chapter_repo.update(
                            session=session,
                            chapter=chap_obj,
                            data=ChapterUpdate(summary=generated_summary.strip())
                        )
            except Exception as e:
                logger.warning(f"[MemoryService] Automatic chapter summary creation error: {str(e)}")

            await self.embedding_service.store_entity_embedding(
                session=session,
                novel_id=novel_id,
                entity_type="chapter",
                entity_id=chapter_id,
                content=content
            )

        return {
            "memory_id": str(memory_entry.id),
            "memory_key": memory_entry.memory_key,
            "facts": fact_payload["extracted_facts"],
            "extracted_entities": extracted_summary,
            "changes": changes,
            "reconciled": reconcile_existing,
            "status": "persisted"
        }
