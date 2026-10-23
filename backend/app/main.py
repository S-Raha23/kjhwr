"""Application factory: lifespan (snapshot load), routers, error mapping, CORS, SPA serving."""

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import admin, analysis, health
from app.core.config import CACHE_MAX_AGE_S, get_settings
from app.core.errors import DataUnavailableError, IngestValidationError
from app.core.logging import setup_logging
from app.data.snapshot_store import SnapshotStore
from app.services.analysis_service import AnalysisService

API_PREFIX = "/api"
BAD_GATEWAY = 502
STATIC_DIR = Path(__file__).resolve().parent / "static"


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


def mount_spa(app: FastAPI, static_dir: Path) -> None:
    """Serve the built React app; any non-API GET falls back to ``index.html``."""
    index = static_dir / "index.html"
    if not index.is_file():
        return
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        if path == API_PREFIX.lstrip("/") or path.startswith(API_PREFIX.lstrip("/") + "/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (static_dir / path).resolve()
        if path and candidate.is_file() and candidate.is_relative_to(static_dir.resolve()):
            return FileResponse(candidate)
        return FileResponse(index)


def create_app(static_dir: Path = STATIC_DIR) -> FastAPI:
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
    mount_spa(app, static_dir)
    return app


app = create_app()
