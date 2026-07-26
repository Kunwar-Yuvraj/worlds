import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel
    from app.database.models.relationship import CharacterRelationship


class Character(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "characters"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(100), default="supporting", nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    personality_traits: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    backstory: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="characters")
    relationships_as_a: Mapped[List["CharacterRelationship"]] = relationship(
        "CharacterRelationship",
        foreign_keys="CharacterRelationship.character_a_id",
        back_populates="character_a",
        cascade="all, delete-orphan"
    )
    relationships_as_b: Mapped[List["CharacterRelationship"]] = relationship(
        "CharacterRelationship",
        foreign_keys="CharacterRelationship.character_b_id",
        back_populates="character_b",
        cascade="all, delete-orphan"
    )
