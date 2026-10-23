"""Forecast selection: which published forecast was available for each target time.

The one rule that matters (no look-ahead leakage): a forecast may only be used for a
target time if ``publishTime <= decision time``.
"""

from datetime import date

import pandas as pd

from app.analytics.period import decision_cutoff_utc, window_utc
from app.core.config import LONDON

SELECTED_COLUMNS = ["startTime", "forecast", "forecast_published", "horizon_h"]
SECONDS_PER_HOUR = 3600.0


def hourly_targets(start: date, end: date) -> pd.DatetimeIndex:
    """Every hourly target time (UTC) in the delivery window ``[start, end]``."""
    first, after = window_utc(start, end)
    return pd.date_range(first, after, freq="1h", inclusive="left")


def select_at_cutoff(forecasts: pd.DataFrame, start: date, end: date) -> pd.DataFrame:
    """Latest forecast published at or before 11:00 London on D-1, per hourly target of day D.

    All hours of one delivery day share the same cutoff and so the same forecast run.
    Targets with no eligible forecast are kept with null forecast fields.
    """
    targets = pd.DataFrame({"startTime": hourly_targets(start, end)})
    local_day = targets["startTime"].dt.tz_convert(LONDON).dt.date
    cutoffs = {day: decision_cutoff_utc(day) for day in local_day.unique()}
    targets["cutoff"] = pd.to_datetime(local_day.map(cutoffs), utc=True)
    return _latest_published(forecasts, targets)


def select_at_horizon(
    forecasts: pd.DataFrame, start: date, end: date, horizon_h: int
) -> pd.DataFrame:
    """Latest forecast published at or before ``startTime - horizon_h`` per hourly target."""
    targets = pd.DataFrame({"startTime": hourly_targets(start, end)})
    targets["cutoff"] = targets["startTime"] - pd.Timedelta(hours=horizon_h)
    return _latest_published(forecasts, targets)


def _latest_published(forecasts: pd.DataFrame, targets: pd.DataFrame) -> pd.DataFrame:
    """For each target keep the forecast with the max ``publishTime`` not after its cutoff."""
    usable = forecasts[forecasts["startTime"] >= forecasts["publishTime"]]
    candidates = targets.merge(usable, on="startTime")
    candidates = candidates[candidates["publishTime"] <= candidates["cutoff"]]
    latest = candidates.sort_values("publishTime").groupby("startTime").tail(1)
    selected = targets[["startTime"]].merge(latest, on="startTime", how="left")
    selected = selected.rename(
        columns={"generation": "forecast", "publishTime": "forecast_published"}
    )
    lead = selected["startTime"] - selected["forecast_published"]
    selected["horizon_h"] = lead.dt.total_seconds() / SECONDS_PER_HOUR
    return selected[SELECTED_COLUMNS].reset_index(drop=True)
