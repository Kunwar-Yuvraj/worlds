import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.world_rule_repository import WorldRuleRepository
from app.repositories.character_repository import CharacterRepository
from app.repositories.timeline_repository import TimelineRepository
from app.utils.logging import logger


class ConsistencyService:
    def __init__(
        self,
        rule_repo: Optional[WorldRuleRepository] = None,
        character_repo: Optional[CharacterRepository] = None,
        timeline_repo: Optional[TimelineRepository] = None
    ):
        self.rule_repo = rule_repo or WorldRuleRepository()
        self.character_repo = character_repo or CharacterRepository()
        self.timeline_repo = timeline_repo or TimelineRepository()

    async def audit_content_consistency(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        draft_content: str
    ) -> Dict[str, Any]:
        logger.info(f"[ConsistencyService] Auditing content for novel_id={novel_id}")
        issues: List[Dict[str, Any]] = []

        rules = await self.rule_repo.list_by_novel(session, novel_id)
        characters = await self.character_repo.list_by_novel(session, novel_id)
        timeline = await self.timeline_repo.list_by_novel(session, novel_id)

        # Audit rule constraints
        for rule in rules:
            if rule.rule_name.lower() in draft_content.lower() and "violate" in draft_content.lower():
                issues.append({
                    "category": "world_rule_violation",
                    "rule": rule.rule_name,
                    "detail": f"Draft content may contradict world rule: {rule.description}"
                })

        passed = len(issues) == 0
        return {
            "passed": passed,
            "issues": issues,
            "audited_rules_count": len(rules),
            "audited_characters_count": len(characters),
            "audited_timeline_events_count": len(timeline),
            "summary": "No continuity issues detected." if passed else f"Found {len(issues)} continuity issues."
        }
