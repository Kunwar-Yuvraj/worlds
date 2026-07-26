import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel
    from app.database.models.revision import RevisionHistory
    from app.database.models.timeline import TimelineEvent


class Chapter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chapters"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="chapters")
    revisions: Mapped[List["RevisionHistory"]] = relationship("RevisionHistory", back_populates="chapter", cascade="all, delete-orphan")
    timeline_events: Mapped[List["TimelineEvent"]] = relationship("TimelineEvent", back_populates="chapter", cascade="all, delete-orphan")
