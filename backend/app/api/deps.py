"""FastAPI dependencies: services, query parsing and admin authentication."""

import secrets
from datetime import date
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field, model_validator

from app.core.config import (
    DEFAULT_HORIZON_H,
    HORIZON_RANGE_H,
    PERIOD_END,
    PERIOD_START,
    get_settings,
)
from app.data.elexon_client import ElexonClient
from app.data.snapshot_store import SnapshotStore
from app.services.analysis_service import AnalysisParams, AnalysisService, Mode


def get_store(request: Request) -> SnapshotStore:
    store: SnapshotStore = request.app.state.store
    return store


StoreDep = Annotated[SnapshotStore, Depends(get_store)]


def get_service(request: Request) -> AnalysisService:
    service: AnalysisService = request.app.state.service
    return service


ServiceDep = Annotated[AnalysisService, Depends(get_service)]


def get_elexon_client() -> ElexonClient:
    return ElexonClient()


ElexonClientDep = Annotated[ElexonClient, Depends(get_elexon_client)]


def clamp_to_period(value: date) -> date:
    return min(max(value, PERIOD_START), PERIOD_END)


class AnalysisQuery(BaseModel):
    """Common query parameters. Dates are clamped silently to the pilot period."""

    start: date = PERIOD_START
    end: date = PERIOD_END
    mode: Mode = "cutoff"
    horizon_h: int = Field(DEFAULT_HORIZON_H, ge=HORIZON_RANGE_H[0], le=HORIZON_RANGE_H[1])

    @model_validator(mode="after")
    def _start_not_after_end(self) -> "AnalysisQuery":
        if self.start > self.end:
            raise ValueError("start must not be after end")
        return self

    def to_params(self) -> AnalysisParams:
        return AnalysisParams(
            clamp_to_period(self.start), clamp_to_period(self.end), self.mode, self.horizon_h
        )


AnalysisQueryDep = Annotated[AnalysisQuery, Query()]


def require_admin(x_admin_token: Annotated[str | None, Header()] = None) -> None:
    """404 when the refresh endpoint is disabled (no ADMIN_TOKEN), 401 on a wrong token."""
    expected = get_settings().admin_token
    if not expected:
        raise HTTPException(status_code=404, detail="Not found")
    if x_admin_token is None or not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(status_code=401, detail="Invalid admin token")
