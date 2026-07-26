import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.chapter import Chapter
    from app.database.models.character import Character
    from app.database.models.relationship import CharacterRelationship
    from app.database.models.location import Location
    from app.database.models.timeline import TimelineEvent
    from app.database.models.world_rule import WorldRule
    from app.database.models.outline import Outline
    from app.database.models.plot_thread import PlotThread
    from app.database.models.agent_memory import AgentMemory
    from app.database.models.embedding import Embedding


class Novel(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "novels"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    genre: Mapped[str] = mapped_column(String(100), nullable=True)
    language: Mapped[str] = mapped_column(String(50), default="English", nullable=False)
    tone: Mapped[str] = mapped_column(String(100), nullable=True)
    style: Mapped[str] = mapped_column(String(100), nullable=True)
    pov: Mapped[str] = mapped_column(String(50), nullable=True)
    estimated_chapters: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="novels")
    chapters: Mapped[List["Chapter"]] = relationship("Chapter", back_populates="novel", cascade="all, delete-orphan")
    characters: Mapped[List["Character"]] = relationship("Character", back_populates="novel", cascade="all, delete-orphan")
    relationships: Mapped[List["CharacterRelationship"]] = relationship("CharacterRelationship", back_populates="novel", cascade="all, delete-orphan")
    locations: Mapped[List["Location"]] = relationship("Location", back_populates="novel", cascade="all, delete-orphan")
    timeline_events: Mapped[List["TimelineEvent"]] = relationship("TimelineEvent", back_populates="novel", cascade="all, delete-orphan")
    world_rules: Mapped[List["WorldRule"]] = relationship("WorldRule", back_populates="novel", cascade="all, delete-orphan")
    outlines: Mapped[List["Outline"]] = relationship("Outline", back_populates="novel", cascade="all, delete-orphan")
    plot_threads: Mapped[List["PlotThread"]] = relationship("PlotThread", back_populates="novel", cascade="all, delete-orphan")
    agent_memories: Mapped[List["AgentMemory"]] = relationship("AgentMemory", back_populates="novel", cascade="all, delete-orphan")
    embeddings: Mapped[List["Embedding"]] = relationship("Embedding", back_populates="novel", cascade="all, delete-orphan")
