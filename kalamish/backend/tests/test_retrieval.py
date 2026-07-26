import pytest
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from app.database.session import Base
from app.repositories import (
    UserRepository,
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
from app.schemas.user import UserCreate
from app.schemas.novel import NovelCreate
from app.schemas.chapter import ChapterCreate
from app.schemas.character import CharacterCreate
from app.schemas.location import LocationCreate
from app.schemas.timeline import TimelineCreate
from app.schemas.outline import OutlineCreate
from app.schemas.world_rule import WorldRuleCreate
from app.services.retrieval_service import RetrievalService
from app.services.embedding_service import EmbeddingService
from app.agents.retrieval import RetrievalAgent
from app.schemas.context_package import ContextPackage

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)
TestingSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_retrieval_service_and_context_package():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        user_repo = UserRepository()
        novel_repo = NovelRepository()
        chap_repo = ChapterRepository()
        char_repo = CharacterRepository()
        loc_repo = LocationRepository()
        time_repo = TimelineRepository()
        out_repo = OutlineRepository()
        rule_repo = WorldRuleRepository()
        rel_repo = CharacterRelationshipRepository()
        thread_repo = PlotThreadRepository()
        emb_service = EmbeddingService()

        # 1. Populate DB entities
        user = await user_repo.create(session, UserCreate(email="retrieval_test@example.com", password="Password123!"), "hashed")
        novel = await novel_repo.create(session, user.id, NovelCreate(title="Retrieval Saga", genre="Fantasy"))
        chap = await chap_repo.create(session, novel.id, ChapterCreate(chapter_number=1, title="The Beginning", content="Once upon a time..."))
        char_a = await char_repo.create(session, novel.id, CharacterCreate(name="Hero A", role="protagonist"))
        char_b = await char_repo.create(session, novel.id, CharacterCreate(name="Villain B", role="antagonist"))
        await rel_repo.create(session, novel.id, char_a.id, char_b.id, "arch-rivals", "Sworn enemies")
        await loc_repo.create(session, novel.id, LocationCreate(name="Crystal Citadel"))
        await time_repo.create(session, novel.id, TimelineCreate(event_order=1, title="Fall of Citadel", description="Citadel destroyed.", chapter_id=chap.id))
        await out_repo.create(session, novel.id, OutlineCreate(chapter_number=1, title="Beginning", synopsis="The Citadel falls."))
        await rule_repo.create(session, novel.id, WorldRuleCreate(rule_name="Magic Cooldown", category="magic", description="Spells require 10s cooldown."))
        await thread_repo.create(session, novel.id, name="Citadel Mystery", description="Uncover the saboteur.")

        # Embed a scene
        await emb_service.store_entity_embedding(
            session=session,
            novel_id=novel.id,
            entity_type="chapter",
            entity_id=chap.id,
            content="The crystal spire crumbled as the dark magic surged through the gate."
        )

        # 2. Build Context Package via RetrievalService
        retrieval_service = RetrievalService()
        package = await retrieval_service.build_context_package(
            session=session,
            novel_id=novel.id,
            user_instruction="Describe the destruction of the Citadel spire.",
            chapter_id=chap.id
        )

        # 3. Assert Exact Schema Fields
        assert isinstance(package, ContextPackage)
        assert package.novel["title"] == "Retrieval Saga"
        assert package.chapter["title"] == "The Beginning"
        assert package.outline["synopsis"] == "The Citadel falls."
        assert len(package.characters) == 2
        assert len(package.relationships) == 1
        assert len(package.timeline) == 1
        assert len(package.world_rules) == 1
        assert len(package.locations) == 1
        assert len(package.plot_threads) == 1
        assert len(package.relevant_scenes) == 1
        assert package.user_instruction == "Describe the destruction of the Citadel spire."

        # 4. Test RetrievalAgent integration
        agent = RetrievalAgent()
        agent_package = await agent.execute_async(
            session=session,
            novel_id=novel.id,
            user_instruction="Describe the destruction of the Citadel spire.",
            chapter_id=chap.id
        )
        assert agent_package.novel["id"] == str(novel.id)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
