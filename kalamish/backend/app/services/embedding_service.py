import uuid
from typing import List, Optional, Dict, Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.repositories.embedding_repository import EmbeddingRepository
from app.utils.logging import logger


class EmbeddingService:
    VECTOR_DIMENSIONS = 768

    def __init__(self, embedding_repo: Optional[EmbeddingRepository] = None):
        self.embedding_repo = embedding_repo or EmbeddingRepository()
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_EMBEDDING_MODEL or "text-embedding-3-small"
        self.base_url = "https://api.openai.com/v1/embeddings"

    async def generate_vector(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.VECTOR_DIMENSIONS
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "input": text,
            "dimensions": self.VECTOR_DIMENSIONS,
            "encoding_format": "float",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json().get("data", [])
            vector = data[0].get("embedding", []) if data else []
            if len(vector) != self.VECTOR_DIMENSIONS:
                raise RuntimeError(
                    f"OpenAI returned {len(vector)} embedding dimensions; "
                    f"expected {self.VECTOR_DIMENSIONS}."
                )
            return vector
        except Exception as exc:
            logger.error("[EmbeddingService] OpenAI embedding request failed: %s", exc)
            raise

    async def store_entity_embedding(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        entity_type: str,
        entity_id: uuid.UUID,
        content: str,
    ):
        vector = await self.generate_vector(content)
        return await self.embedding_repo.create(
            session=session,
            novel_id=novel_id,
            entity_type=entity_type,
            entity_id=entity_id,
            content=content,
            vector=vector,
        )

    async def search_relevant_scenes(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        query: str,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        query_vector = await self.generate_vector(query)
        return await self.embedding_repo.search_similar(
            session, novel_id, query_vector, limit
        )
