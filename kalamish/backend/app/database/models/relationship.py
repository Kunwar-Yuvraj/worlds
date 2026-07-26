import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel
    from app.database.models.character import Character


class CharacterRelationship(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "character_relationships"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    character_a_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    character_b_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="relationships")
    character_a: Mapped["Character"] = relationship("Character", foreign_keys=[character_a_id], back_populates="relationships_as_a")
    character_b: Mapped["Character"] = relationship("Character", foreign_keys=[character_b_id], back_populates="relationships_as_b")
