"""Application factory: routers, static SPA mount, lifespan."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Wind Forecast Decision Portal")
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET"])
    app.include_router(health.router, prefix="/api")
    return app


app = create_app()
