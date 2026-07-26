import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.database.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.novel import Novel


class AgentMemory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "agent_memories"

    novel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    memory_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    memory_value: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    novel: Mapped["Novel"] = relationship("Novel", back_populates="agent_memories")
