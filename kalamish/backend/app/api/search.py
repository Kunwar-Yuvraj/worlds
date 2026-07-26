from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.database.models.user import User
from app.services.novel_service import NovelService
from app.services.embedding_service import EmbeddingService
from app.schemas.ai import SearchRequest, SearchResponse

router = APIRouter(tags=["Search"])
novel_service = NovelService()
embedding_service = EmbeddingService()


@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    req: SearchRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Execute semantic search across novel vector embeddings using pgvector."""
    # Verify novel ownership
    await novel_service.get_novel(db, current_user.id, req.novel_id)

    results = await embedding_service.search_relevant_scenes(
        session=db,
        novel_id=req.novel_id,
        query=req.query,
        limit=req.limit
    )

    return SearchResponse(
        novel_id=req.novel_id,
        query=req.query,
        results=results
    )
