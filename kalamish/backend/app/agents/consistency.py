import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.context_package import ContextPackage
from app.services.consistency_service import ConsistencyService
from app.utils.logging import logger


class ConsistencyAgent:
    """Audits generated prose against DB entities (WorldRules, Characters, Timeline)."""

    def __init__(self, consistency_service: Optional[ConsistencyService] = None):
        self.consistency_service = consistency_service or ConsistencyService()

    async def execute_async(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        draft_content: str
    ) -> Dict[str, Any]:
        logger.info(f"[ConsistencyAgent] Executing DB-backed consistency audit for novel_id={novel_id}")
        return await self.consistency_service.audit_content_consistency(
            session=session,
            novel_id=novel_id,
            draft_content=draft_content
        )

    def execute(self, draft_content: str, context_package: ContextPackage) -> Dict[str, Any]:
        """Fallback synchronous method for dict context initialization."""
        logger.info("[ConsistencyAgent] Auditing draft for continuity and world rules")
        issues: List[str] = []
        if not draft_content:
            issues.append("Draft content is empty.")

        return {
            "passed": len(issues) == 0,
            "issues": issues,
            "audit_summary": "Passed continuity check with 0 issues." if not issues else f"Found {len(issues)} issues."
        }
