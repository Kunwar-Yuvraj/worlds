from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.novels import router as novels_router
from app.api.chapters import router as chapters_router
from app.api.characters import router as characters_router
from app.api.locations import router as locations_router
from app.api.timeline import router as timeline_router
from app.api.outlines import router as outlines_router
from app.api.world_rules import router as world_rules_router
from app.api.ai import router as ai_router
from app.api.search import router as search_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(novels_router)
api_router.include_router(chapters_router)
api_router.include_router(characters_router)
api_router.include_router(locations_router)
api_router.include_router(timeline_router)
api_router.include_router(outlines_router)
api_router.include_router(world_rules_router)
api_router.include_router(ai_router)
api_router.include_router(search_router)
