from datetime import date

import pandas as pd

from app.analytics.alignment import align, series
from tests.conftest import make_actuals, utc

DAY = date(2026, 1, 15)


def _selected() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "startTime": [utc("2026-01-15T00:00:00Z"), utc("2026-01-15T01:00:00Z")],
            "forecast": [120.0, None],
            "forecast_published": [utc("2026-01-14T09:30:00Z"), pd.NaT],
            "horizon_h": [14.5, None],
        }
    )


def _actuals() -> pd.DataFrame:
    return make_actuals(
        [
            ("2026-01-15T00:00:00Z", 100),
            ("2026-01-15T00:30:00Z", 110),
            ("2026-01-15T01:00:00Z", 130),
        ]
    )


def test_align_error_is_forecast_minus_actual_and_skips_missing_forecasts() -> None:
    aligned = align(_selected(), _actuals())
    assert len(aligned) == 1
    assert aligned.loc[0, "error"] == 20.0


def test_series_keeps_half_hourly_actuals_with_null_forecast_off_the_hour() -> None:
    result = series(_selected(), _actuals(), DAY, DAY)
    assert len(result) == 3
    half_hour = result[result["startTime"] == utc("2026-01-15T00:30:00Z")].iloc[0]
    assert pd.isna(half_hour["forecast"]) and pd.isna(half_hour["error"])
