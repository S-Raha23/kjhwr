"""Pydantic request/response models for the HTTP layer."""

from datetime import date, datetime
from typing import Literal

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


class AnalysisMeta(BaseModel):
    start: date
    end: date
    mode: Literal["cutoff", "horizon"]
    horizon_h: int | None


class SeriesPoint(BaseModel):
    t: datetime
    actual: float
    forecast: float | None
    forecast_published: datetime | None
    horizon_h: float | None
    error: float | None


class SeriesResponse(BaseModel):
    meta: AnalysisMeta
    points: list[SeriesPoint]


class Summary(BaseModel):
    n: int
    mae: float | None
    rmse: float | None
    bias: float | None
    wape_pct: float | None
    p50_abs: float | None
    p90_abs: float | None
    max_abs: float | None
    p10_signed: float | None
    p90_signed: float | None
    mean_actual: float | None
    share_over_forecast_pct: float | None


class ByHourRow(BaseModel):
    hour_local: int
    mae: float
    bias: float
    n: int


class ByDayRow(BaseModel):
    day: date
    mae: float
    bias: float
    wape_pct: float
    forecast_published: datetime
    actual_mwh: float
    forecast_mwh: float


class Histogram(BaseModel):
    bin_edges: list[float]
    counts: list[int]


class MetricsResponse(BaseModel):
    meta: AnalysisMeta
    summary: Summary
    by_hour: list[ByHourRow]
    by_day: list[ByDayRow]
    histogram: Histogram


class HorizonPoint(BaseModel):
    horizon_h: int
    n: int
    mae: float | None
    rmse: float | None
    bias: float | None
    wape_pct: float | None
    coverage_pct: float


class HorizonCurveResponse(BaseModel):
    points: list[HorizonPoint]


class DayPoint(BaseModel):
    t: datetime
    forecast: float
    actual: float
    band_p10: float | None
    band_p90: float | None


class DayTotals(BaseModel):
    forecast_mwh: float
    actual_mwh: float
    error_mwh: float
    error_pct: float | None


class DayResponse(BaseModel):
    date: date
    decision_time: datetime
    forecast_published: datetime | None
    points: list[DayPoint]
    totals: DayTotals


class RefreshResponse(BaseModel):
    counts: SnapshotCounts
    snapshot_fetched_at: datetime
