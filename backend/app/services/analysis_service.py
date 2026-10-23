"""Combines the snapshot store with the pure analytics functions; owns result caching."""

from collections.abc import Callable
from dataclasses import asdict, dataclass
from datetime import date
from functools import lru_cache
from typing import Any, Literal

import pandas as pd

from app.analytics.alignment import align, series
from app.analytics.bands import add_bands
from app.analytics.horizon_curve import horizon_curve
from app.analytics.metrics import by_day, by_hour, histogram, summarise
from app.analytics.period import decision_cutoff_utc
from app.analytics.selection import select_at_cutoff, select_at_horizon
from app.core.config import ANALYSIS_CACHE_SIZE
from app.data.snapshot_store import SnapshotStore
from app.services.records import datetime_or_none, frame_records

Mode = Literal["cutoff", "horizon"]
Result = dict[str, Any]

SERIES_COLUMNS = ["t", "actual", "forecast", "forecast_published", "horizon_h", "error"]
DAY_POINT_COLUMNS = ["t", "forecast", "actual", "band_p10", "band_p90"]


@dataclass(frozen=True)
class AnalysisParams:
    """Effective (already clamped) query: hashable so it can key the cache."""

    start: date
    end: date
    mode: Mode
    horizon_h: int

    def meta(self) -> Result:
        return {
            "start": self.start,
            "end": self.end,
            "mode": self.mode,
            "horizon_h": self.horizon_h if self.mode == "horizon" else None,
        }


class AnalysisService:
    """Every result is a pure function of (params, snapshot version) and is cached on both."""

    def __init__(self, store: SnapshotStore) -> None:
        self._store = store
        self._series = self._memoise(self._compute_series)
        self._metrics = self._memoise(self._compute_metrics)
        self._curve = self._memoise(self._compute_horizon_curve)
        self._day = self._memoise(self._compute_day)

    def series(self, params: AnalysisParams) -> Result:
        return self._series(params, self._store.version)

    def metrics(self, params: AnalysisParams) -> Result:
        return self._metrics(params, self._store.version)

    def horizon_curve(self, start: date, end: date) -> Result:
        return self._curve(start, end, self._store.version)

    def day(self, day: date, start: date, end: date) -> Result:
        """Decision panel for one delivery day; bands are calibrated on errors over start..end."""
        return self._day(day, start, end, self._store.version)

    @staticmethod
    def _memoise(compute: Callable[..., Result]) -> Callable[..., Result]:
        return lru_cache(maxsize=ANALYSIS_CACHE_SIZE)(compute)

    def _selected(self, params: AnalysisParams) -> pd.DataFrame:
        forecasts = self._store.snapshot.forecasts
        if params.mode == "cutoff":
            return select_at_cutoff(forecasts, params.start, params.end)
        return select_at_horizon(forecasts, params.start, params.end, params.horizon_h)

    def _compute_series(self, params: AnalysisParams, _version: int) -> Result:
        frame = series(
            self._selected(params), self._store.snapshot.actuals, params.start, params.end
        )
        frame = frame.rename(columns={"startTime": "t"})
        return {"meta": params.meta(), "points": frame_records(frame, SERIES_COLUMNS)}

    def _compute_metrics(self, params: AnalysisParams, _version: int) -> Result:
        aligned = align(self._selected(params), self._store.snapshot.actuals)
        return {
            "meta": params.meta(),
            "summary": asdict(summarise(aligned)),
            "by_hour": by_hour(aligned),
            "by_day": by_day(aligned),
            "histogram": asdict(histogram(aligned)),
        }

    def _compute_horizon_curve(self, start: date, end: date, _version: int) -> Result:
        snapshot = self._store.snapshot
        points = [
            {"horizon_h": p.horizon_h, **asdict(p.summary), "coverage_pct": p.coverage_pct}
            for p in horizon_curve(snapshot.forecasts, snapshot.actuals, start, end)
        ]
        return {"points": points}

    def _compute_day(self, day: date, start: date, end: date, _version: int) -> Result:
        snapshot = self._store.snapshot
        aligned_day = align(select_at_cutoff(snapshot.forecasts, day, day), snapshot.actuals)
        errors = align(select_at_cutoff(snapshot.forecasts, start, end), snapshot.actuals)
        points = add_bands(aligned_day, errors).rename(columns={"startTime": "t"})
        forecast_mwh, actual_mwh = float(points["forecast"].sum()), float(points["actual"].sum())
        return {
            "date": day,
            "decision_time": decision_cutoff_utc(day).to_pydatetime(),
            "forecast_published": datetime_or_none(points["forecast_published"].max()),
            "points": frame_records(points, DAY_POINT_COLUMNS),
            "totals": {
                "forecast_mwh": forecast_mwh,
                "actual_mwh": actual_mwh,
                "error_mwh": forecast_mwh - actual_mwh,
                "error_pct": 100 * (forecast_mwh - actual_mwh) / actual_mwh if actual_mwh else None,
            },
        }
