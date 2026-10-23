"""Joining selected forecasts with actuals; error = forecast - actual."""

from datetime import date

import pandas as pd

from app.analytics.period import window_utc

ALIGNED_COLUMNS = ["startTime", "forecast", "forecast_published", "horizon_h", "actual", "error"]


def align(selected: pd.DataFrame, actuals: pd.DataFrame) -> pd.DataFrame:
    """Inner-join selected forecasts to actuals at the forecast's hourly timestamps.

    Targets without a forecast are excluded (never zero-filled). ``error`` is
    ``forecast - actual``: positive means the forecast was too high.
    """
    matched = selected.dropna(subset=["forecast"]).merge(
        actuals.rename(columns={"generation": "actual"}), on="startTime"
    )
    matched["error"] = matched["forecast"] - matched["actual"]
    return matched[ALIGNED_COLUMNS].reset_index(drop=True)


def series(selected: pd.DataFrame, actuals: pd.DataFrame, start: date, end: date) -> pd.DataFrame:
    """Every half-hourly actual in the window, with forecast fields null where none applies."""
    first, after = window_utc(start, end)
    in_window = actuals[actuals["startTime"].between(first, after, inclusive="left")]
    joined = in_window.rename(columns={"generation": "actual"}).merge(
        selected, on="startTime", how="left"
    )
    joined["error"] = joined["forecast"] - joined["actual"]
    return joined[ALIGNED_COLUMNS].sort_values("startTime").reset_index(drop=True)
