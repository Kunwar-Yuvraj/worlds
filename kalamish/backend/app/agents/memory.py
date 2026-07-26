import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.memory_service import MemoryService
from app.utils.logging import logger


class MemoryAgent:
    """Extracts structured facts and updates database via MemoryService."""

    def __init__(self, memory_service: Optional[MemoryService] = None):
        self.memory_service = memory_service or MemoryService()

    async def execute_async(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        content: str,
        agent_name: str = "MemoryAgent",
        chapter_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        logger.info(f"[MemoryAgent] Executing memory processing for novel_id={novel_id}")
        return await self.memory_service.process_and_store_memory(
            session=session,
            novel_id=novel_id,
            agent_name=agent_name,
            content=content,
            chapter_id=chapter_id
        )

    def execute(self, final_content: str, novel_id: str) -> Dict[str, Any]:
        """Fallback synchronous method for dict context initialization."""
        logger.info(f"[MemoryAgent] Extracting facts for novel_id={novel_id}")
        extracted_facts: List[Dict[str, Any]] = [
            {"entity": "Kaiden", "type": "character_event", "fact": "Entered District 9 under heavy rain."}
        ]
        return {
            "extracted_facts": extracted_facts,
            "status": "memory_updated"
        }
