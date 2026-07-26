import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.chapter import Chapter


class RevisionHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "revision_history"

    chapter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    previous_content: Mapped[str] = mapped_column(Text, nullable=False)
    changes_description: Mapped[str] = mapped_column(Text, nullable=False)
    revised_by_agent: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    chapter: Mapped["Chapter"] = relationship("Chapter", back_populates="revisions")
