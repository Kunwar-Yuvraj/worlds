import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel
    from app.database.models.chapter import Chapter


class TimelineEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "timeline_events"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    event_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="timeline_events")
    chapter: Mapped[Optional["Chapter"]] = relationship("Chapter", back_populates="timeline_events")
