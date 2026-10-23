"""Accuracy as a function of forecast lead time."""

from dataclasses import dataclass
from datetime import date

import pandas as pd

from app.analytics.alignment import align
from app.analytics.metrics import Summary, summarise
from app.analytics.selection import hourly_targets, select_at_horizon
from app.core.config import HORIZON_RANGE_H

PERCENT = 100.0


@dataclass(frozen=True)
class HorizonPoint:
    horizon_h: int
    summary: Summary
    coverage_pct: float


def horizon_curve(
    forecasts: pd.DataFrame, actuals: pd.DataFrame, start: date, end: date
) -> list[HorizonPoint]:
    """Horizon-mode metrics for every lead time h = 0 ... 48 over the window.

    ``coverage_pct`` is the share of hourly targets that had an eligible forecast and an
    actual, so a drop in ``n`` at long horizons is not misread as better accuracy.
    """
    n_targets = len(hourly_targets(start, end))
    low, high = HORIZON_RANGE_H
    points = []
    for horizon_h in range(low, high + 1):
        aligned = align(select_at_horizon(forecasts, start, end, horizon_h), actuals)
        summary = summarise(aligned)
        points.append(HorizonPoint(horizon_h, summary, PERCENT * summary.n / n_targets))
    return points
