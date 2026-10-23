"""Forecast accuracy metrics over aligned (forecast, actual, error) frames."""

from dataclasses import dataclass, fields
from typing import Any

import numpy as np
import pandas as pd

from app.core.config import HISTOGRAM_BIN_MW, LONDON

P10, P50, P90 = 0.1, 0.5, 0.9
PERCENT = 100.0


@dataclass(frozen=True)
class Summary:
    """Accuracy over a set of errors. Every metric but ``n`` is ``None`` when ``n == 0``."""

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


@dataclass(frozen=True)
class Histogram:
    bin_edges: list[float]
    counts: list[int]


def summarise(aligned: pd.DataFrame) -> Summary:
    """MAE, RMSE, bias (mean error), WAPE (sum abs error / sum actual) and error quantiles."""
    if aligned.empty:
        return Summary(n=0, **{f.name: None for f in fields(Summary) if f.name != "n"})
    error = aligned["error"].to_numpy(dtype=float)
    actual = aligned["actual"].to_numpy(dtype=float)
    absolute = np.abs(error)
    return Summary(
        n=len(error),
        mae=float(absolute.mean()),
        rmse=float(np.sqrt((error**2).mean())),
        bias=float(error.mean()),
        wape_pct=float(PERCENT * absolute.sum() / actual.sum()),
        p50_abs=float(np.quantile(absolute, P50)),
        p90_abs=float(np.quantile(absolute, P90)),
        max_abs=float(absolute.max()),
        p10_signed=float(np.quantile(error, P10)),
        p90_signed=float(np.quantile(error, P90)),
        mean_actual=float(actual.mean()),
        share_over_forecast_pct=float(PERCENT * (error > 0).mean()),
    )


def by_hour(aligned: pd.DataFrame) -> list[dict[str, Any]]:
    """MAE, bias and count per London hour of day (0-23)."""
    hour = aligned["startTime"].dt.tz_convert(LONDON).dt.hour
    grouped = aligned.assign(abs_error=aligned["error"].abs(), hour_local=hour).groupby(
        "hour_local"
    )
    table = grouped.agg(mae=("abs_error", "mean"), bias=("error", "mean"), n=("error", "size"))
    return [
        {"hour_local": int(str(h)), "mae": float(r.mae), "bias": float(r.bias), "n": int(r.n)}
        for h, r in table.iterrows()
    ]


def by_day(aligned: pd.DataFrame) -> list[dict[str, Any]]:
    """Per London delivery day: MAE, bias, WAPE, latest forecast run used and energy totals.

    Energy is approximated from the hourly points (sum of MW x 1 h).
    """
    day = aligned["startTime"].dt.tz_convert(LONDON).dt.date
    frame = aligned.assign(abs_error=aligned["error"].abs(), day=day)
    rows = []
    for current, group in frame.groupby("day"):
        actual_mwh = float(group["actual"].sum())
        rows.append(
            {
                "day": current,
                "mae": float(group["abs_error"].mean()),
                "bias": float(group["error"].mean()),
                "wape_pct": float(PERCENT * group["abs_error"].sum() / actual_mwh),
                "forecast_published": group["forecast_published"].max(),
                "actual_mwh": actual_mwh,
                "forecast_mwh": float(group["forecast"].sum()),
            }
        )
    return rows


def histogram(aligned: pd.DataFrame) -> Histogram:
    """Signed-error histogram in fixed ``HISTOGRAM_BIN_MW`` bins covering the observed range."""
    if aligned.empty:
        return Histogram(bin_edges=[], counts=[])
    error = aligned["error"].to_numpy(dtype=float)
    low = np.floor(error.min() / HISTOGRAM_BIN_MW) * HISTOGRAM_BIN_MW
    high = max(np.ceil(error.max() / HISTOGRAM_BIN_MW) * HISTOGRAM_BIN_MW, low + HISTOGRAM_BIN_MW)
    edges = np.arange(low, high + HISTOGRAM_BIN_MW, HISTOGRAM_BIN_MW)
    counts, _ = np.histogram(error, bins=edges)
    return Histogram(bin_edges=[float(e) for e in edges], counts=[int(c) for c in counts])
