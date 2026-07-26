import pytest
import uuid
import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from app.database.session import Base
from app.repositories import (
    UserRepository,
    NovelRepository,
    ChapterRepository,
    WorldRuleRepository,
    AgentMemoryRepository,
    RevisionRepository,
    CharacterRepository,
    LocationRepository,
    TimelineRepository,
    OutlineRepository,
    CharacterRelationshipRepository,
    PlotThreadRepository
)
from app.schemas.user import UserCreate
from app.schemas.novel import NovelCreate
from app.schemas.chapter import ChapterCreate
from app.schemas.world_rule import WorldRuleCreate
from app.schemas.character import CharacterCreate
from app.schemas.location import LocationCreate
from app.schemas.timeline import TimelineCreate
from app.schemas.outline import OutlineCreate
from app.agents import MemoryAgent, ConsistencyAgent, RevisionAgent
from app.services.memory_service import MemoryService
from app.services.revision_service import RevisionService

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)
TestingSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_memory_agent_db_integration():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        user_repo = UserRepository()
        novel_repo = NovelRepository()
        chap_repo = ChapterRepository()
        mem_repo = AgentMemoryRepository()

        user = await user_repo.create(session, UserCreate(email="mem_agent@example.com", password="Password123!"), "hashed")
        novel = await novel_repo.create(session, user.id, NovelCreate(title="Memory Test Novel"))
        chap = await chap_repo.create(session, novel.id, ChapterCreate(chapter_number=1, title="Chapter One", content="Initial story prose."))

        memory_agent = MemoryAgent()
        res = await memory_agent.execute_async(
            session=session,
            novel_id=novel.id,
            content="In this chapter, Kaiden acquired the neural decryptor.",
            agent_name="MemoryAgent",
            chapter_id=chap.id
        )

        assert res["status"] == "persisted"
        assert "memory_id" in res
        assert len(res["facts"]) > 0

        # Verify record in database
        memories = await mem_repo.list_by_novel(session, novel.id)
        assert len(memories) == 1
        assert memories[0].agent_name == "MemoryAgent"

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_consistency_agent_db_integration():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        user_repo = UserRepository()
        novel_repo = NovelRepository()
        rule_repo = WorldRuleRepository()

        user = await user_repo.create(session, UserCreate(email="cons_agent@example.com", password="Password123!"), "hashed")
        novel = await novel_repo.create(session, user.id, NovelCreate(title="Consistency Test Novel"))
        await rule_repo.create(session, novel.id, WorldRuleCreate(rule_name="Magic Limits", category="rules", description="Do not exceed 100 mana."))

        consistency_agent = ConsistencyAgent()

        # Test clean draft
        clean_res = await consistency_agent.execute_async(session, novel.id, "The wizard cast a light spell using 10 mana.")
        assert clean_res["passed"] is True

        # Test draft with rule violation keywords
        flagged_res = await consistency_agent.execute_async(session, novel.id, "The wizard attempted to violate the magic limits.")
        assert flagged_res["passed"] is False
        assert len(flagged_res["issues"]) == 1
        assert flagged_res["issues"][0]["rule"] == "Magic Limits"

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_revision_agent_db_integration():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        user_repo = UserRepository()
        novel_repo = NovelRepository()
        chap_repo = ChapterRepository()
        rev_repo = RevisionRepository()

        user = await user_repo.create(session, UserCreate(email="rev_agent@example.com", password="Password123!"), "hashed")
        novel = await novel_repo.create(session, user.id, NovelCreate(title="Revision Test Novel"))
        chap = await chap_repo.create(session, novel.id, ChapterCreate(chapter_number=1, title="Chapter One", content="Original draft content text."))

        revision_agent = RevisionAgent()

        # Version 1 revision
        rev_res_1 = await revision_agent.execute_async(
            session=session,
            chapter_id=chap.id,
            new_content="Revised text for Chapter 1 with improved tone.",
            changes_description="Enhanced tone and pacing.",
            revised_by_agent="RevisionAgent"
        )
        assert rev_res_1["status"] == "revision_completed"
        assert rev_res_1["version_number"] == 1

        # Version 2 revision
        rev_res_2 = await revision_agent.execute_async(
            session=session,
            chapter_id=chap.id,
            new_content="Second revision text with plot twist added.",
            changes_description="Added plot twist.",
            revised_by_agent="RevisionAgent"
        )
        assert rev_res_2["version_number"] == 2

        # Verify revision history records in DB
        revisions = await rev_repo.list_by_chapter(session, chap.id)
        assert len(revisions) == 2
        assert revisions[0].version_number == 2
        assert revisions[1].version_number == 1

        # Verify updated chapter text in DB
        updated_chap = await chap_repo.get_by_id(session, chap.id)
        assert updated_chap.content == "Second revision text with plot twist added."

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_story_revision_persists_chapter_and_reconciles_world_context():
    class RevisionLLMStub:
        async def generate_text(self, prompt, **kwargs):
            if "Respond ONLY in raw JSON" in prompt:
                return json.dumps({
                    "characters": [{
                        "existing_character_id": None,
                        "previous_name": "Leo",
                        "name": "Leon",
                        "role": "protagonist",
                        "description": "A 32-year-old captain with an injured arm.",
                        "personality_traits": {"resilient": True},
                        "backstory": "Veteran of the outer colonies."
                    }],
                    "removed_characters": [{
                        "existing_character_id": None,
                        "name": "Dax",
                        "reason": "Removed from the revised story."
                    }],
                    "locations": [{
                        "name": "Bridge",
                        "description": "The damaged command bridge.",
                        "significance": "Site of the mutiny."
                    }],
                    "timeline_events": [{
                        "title": "Bridge Mutiny",
                        "description": "Leo survives a mutiny on the bridge.",
                        "impact": "The crew splits into rival factions."
                    }],
                    "world_rules": [{
                        "rule_name": "Artificial Gravity",
                        "category": "technology",
                        "description": "Gravity fails whenever the reactor is damaged."
                    }],
                    "outlines": [{
                        "chapter_number": 1,
                        "title": "The Mutiny",
                        "synopsis": "Leo faces a mutiny after the reactor fails.",
                        "key_events": ["Reactor failure", "Bridge mutiny"]
                    }],
                    "relationships": [{
                        "character_a": "Leon",
                        "character_b": "Mira",
                        "relationship_type": "rivals",
                        "description": "Their alliance ends during the mutiny."
                    }],
                    "plot_threads": [{
                        "name": "Hidden Traitor",
                        "status": "resolved",
                        "description": "The traitor is exposed as Mira.",
                        "resolution": "Mira leads the bridge mutiny."
                    }]
                })
            return "Leon, age 32, survives the bridge mutiny despite his injured arm."

    class EmbeddingStub:
        async def store_entity_embedding(self, **kwargs):
            return None

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        user = await UserRepository().create(
            session,
            UserCreate(email="revision_context@example.com", password="Password123!"),
            "hashed"
        )
        novel = await NovelRepository().create(
            session, user.id, NovelCreate(title="Context Revision")
        )
        chapter = await ChapterRepository().create(
            session,
            novel.id,
            ChapterCreate(
                chapter_number=1,
                title="Old Chapter",
                content="Leo, age 30, walks across the quiet bridge."
            )
        )

        leo = await CharacterRepository().create(
            session,
            novel.id,
            CharacterCreate(name="Leo", role="protagonist", description="A 30-year-old captain.")
        )
        mira = await CharacterRepository().create(
            session,
            novel.id,
            CharacterCreate(name="Mira", role="supporting", description="Leo's ally.")
        )
        await CharacterRepository().create(
            session,
            novel.id,
            CharacterCreate(name="Dax", role="supporting", description="A removed side character.")
        )
        await LocationRepository().create(
            session,
            novel.id,
            LocationCreate(name="Bridge", description="A quiet command bridge.")
        )
        await TimelineRepository().create(
            session,
            novel.id,
            TimelineCreate(
                event_order=1,
                title="Quiet Watch",
                description="Nothing happens.",
                chapter_id=chapter.id
            )
        )
        await WorldRuleRepository().create(
            session,
            novel.id,
            WorldRuleCreate(
                rule_name="Artificial Gravity",
                category="technology",
                description="Gravity is always stable."
            )
        )
        await OutlineRepository().create(
            session,
            novel.id,
            OutlineCreate(
                chapter_number=1,
                title="Quiet Watch",
                synopsis="Leo completes a quiet watch.",
                key_events=["Quiet watch"]
            )
        )
        await CharacterRelationshipRepository().create(
            session, novel.id, leo.id, mira.id, "allies", "They trust each other."
        )
        await PlotThreadRepository().create(
            session, novel.id, "Hidden Traitor", "The traitor remains unknown."
        )

        memory_service = MemoryService(
            llm_service=RevisionLLMStub(),
            embedding_service=EmbeddingStub()
        )
        revision_service = RevisionService(memory_service=memory_service)
        result = await revision_service.revise_chapter(
            session=session,
            chapter_id=chapter.id,
            new_content="Leon, age 32, survives the bridge mutiny despite his injured arm.",
            changes_description="Rename Leo to Leon, make him 32, remove Dax, and add a bridge mutiny.",
            reconcile_story_context=True
        )

        revised_chapter = await ChapterRepository().get_by_id(session, chapter.id)
        assert revised_chapter.content.startswith("Leon, age 32")
        assert revised_chapter.summary

        characters = await CharacterRepository().list_by_novel(session, novel.id)
        assert {character.name for character in characters} == {"Leon", "Mira"}
        renamed_leo = next(c for c in characters if c.name == "Leon")
        assert renamed_leo.id == leo.id
        assert renamed_leo.description.startswith("A 32-year-old")

        locations = await LocationRepository().list_by_novel(session, novel.id)
        assert locations[0].significance == "Site of the mutiny."

        timeline = await TimelineRepository().list_by_novel(session, novel.id)
        assert [event.title for event in timeline] == ["Bridge Mutiny"]

        rules = await WorldRuleRepository().list_by_novel(session, novel.id)
        assert "reactor is damaged" in rules[0].description

        outlines = await OutlineRepository().list_by_novel(session, novel.id)
        assert outlines[0].title == "The Mutiny"

        relationships = await CharacterRelationshipRepository().list_by_novel(session, novel.id)
        assert relationships[0].relationship_type == "rivals"
        assert leo.id in {
            relationships[0].character_a_id,
            relationships[0].character_b_id
        }

        plot_threads = await PlotThreadRepository().list_by_novel(session, novel.id)
        assert plot_threads[0].status == "resolved"

        assert result["context_updates"]["status"] == "persisted"
        assert result["context_updates"]["changes"]["updated"] >= 6
        assert result["context_updates"]["changes"]["deleted"] == 2

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
