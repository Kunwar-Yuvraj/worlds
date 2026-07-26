import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel

VectorType = Vector(768).with_variant(JSON, "sqlite")


class Embedding(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "embeddings"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    vector = mapped_column(VectorType, nullable=True)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="embeddings")
