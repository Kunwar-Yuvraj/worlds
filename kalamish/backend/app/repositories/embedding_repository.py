import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.embedding import Embedding


class EmbeddingRepository:
    async def create(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        entity_type: str,
        entity_id: uuid.UUID,
        content: str,
        vector: List[float]
    ) -> Embedding:
        embedding = Embedding(
            novel_id=novel_id,
            entity_type=entity_type,
            entity_id=entity_id,
            content=content,
            vector=vector
        )
        session.add(embedding)
        await session.commit()
        await session.refresh(embedding)
        return embedding

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[Embedding]:
        stmt = select(Embedding).where(Embedding.novel_id == novel_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def search_similar(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        query_vector: List[float],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        # Handle PostgreSQL pgvector vs SQLite fallback safely
        try:
            stmt = select(Embedding).where(Embedding.novel_id == novel_id).order_by(
                Embedding.vector.cosine_distance(query_vector)
            ).limit(limit)
            result = await session.execute(stmt)
            embeddings = result.scalars().all()
        except Exception:
            # Fallback query for SQLite or non-pgvector backends
            stmt = select(Embedding).where(Embedding.novel_id == novel_id).limit(limit)
            result = await session.execute(stmt)
            embeddings = result.scalars().all()

        return [
            {
                "id": str(e.id),
                "entity_type": e.entity_type,
                "entity_id": str(e.entity_id),
                "content": e.content
            }
            for e in embeddings
        ]
