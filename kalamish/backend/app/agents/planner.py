from typing import Dict, Any
from app.utils.logging import logger


class PlannerAgent:
    """Detects request type and routes workflow. Never writes content directly."""

    def execute(self, user_instruction: str, request_type: str = "GENERATE_CHAPTER") -> Dict[str, Any]:
        logger.info(f"[PlannerAgent] Planning workflow for request_type={request_type}")
        return {
            "request_type": request_type,
            "plan_summary": f"Execution plan formulated for instruction: '{user_instruction}'",
            "routing": ["retrieval", "writer", "consistency", "editor", "memory"]
        }
