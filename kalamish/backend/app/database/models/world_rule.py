import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel


class WorldRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "world_rules"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="general", nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="world_rules")
