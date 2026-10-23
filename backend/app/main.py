"""Application factory: lifespan (snapshot load), routers, error mapping, CORS."""

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, analysis, health
from app.core.config import CACHE_MAX_AGE_S, get_settings
from app.core.errors import DataUnavailableError, IngestValidationError
from app.core.logging import setup_logging
from app.data.snapshot_store import SnapshotStore
from app.services.analysis_service import AnalysisService

API_PREFIX = "/api"
BAD_GATEWAY = 502


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings.log_level)
    app.state.store = SnapshotStore.load(settings.snapshot_dir)
    app.state.service = AnalysisService(app.state.store)
    yield


async def upstream_error_handler(_: Request, error: Exception) -> JSONResponse:
    return JSONResponse(status_code=BAD_GATEWAY, content={"detail": str(error)})


async def cache_api_gets(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    if request.method == "GET" and request.url.path.startswith(API_PREFIX):
        response.headers["Cache-Control"] = f"public, max-age={CACHE_MAX_AGE_S}"
    return response


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Wind Forecast Decision Portal", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST"]
    )
    app.middleware("http")(cache_api_gets)
    app.add_exception_handler(DataUnavailableError, upstream_error_handler)
    app.add_exception_handler(IngestValidationError, upstream_error_handler)
    for router in (health.router, analysis.router, admin.router):
        app.include_router(router, prefix=API_PREFIX)
    return app


app = create_app()
