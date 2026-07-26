import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel


class Outline(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "outlines"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    synopsis: Mapped[str] = mapped_column(Text, nullable=False)
    key_events: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    target_word_count: Mapped[int] = mapped_column(Integer, default=2000, nullable=False)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="outlines")
