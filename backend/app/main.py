"""Application factory: lifespan (snapshot load), routers, CORS."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.data.snapshot_store import SnapshotStore


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings.log_level)
    app.state.store = SnapshotStore.load(settings.snapshot_dir)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Wind Forecast Decision Portal", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET"])
    app.include_router(health.router, prefix="/api")
    return app


app = create_app()
