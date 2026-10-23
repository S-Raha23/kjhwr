"""Pydantic request/response models for the HTTP layer."""

from datetime import date, datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    data_loaded: bool
    snapshot_fetched_at: datetime


class PeriodInfo(BaseModel):
    start: date
    end: date
    timezone: str


class SnapshotCounts(BaseModel):
    actual_rows: int
    forecast_rows: int
    forecast_runs: int


class MetaResponse(BaseModel):
    period: PeriodInfo
    decision_cutoff_local: str
    horizon_range_h: tuple[int, int]
    counts: SnapshotCounts
    snapshot_fetched_at: datetime
    source: str
