import pandas as pd

from app.analytics.bands import add_bands

LEADS = [15.0, 16.0, 17.0, 18.0, 19.0]
ERRORS = [-100.0, 0.0, 100.0, 200.0, 300.0]


def _errors() -> pd.DataFrame:
    return pd.DataFrame({"horizon_h": LEADS, "error": ERRORS})


def test_band_is_forecast_minus_error_quantiles() -> None:
    points = pd.DataFrame({"horizon_h": [15.0], "forecast": [1000.0]})
    banded = add_bands(points, _errors())
    # P10(e) = -60, P90(e) = 260 (linear interpolation) -> actual in [forecast-260, forecast+60]
    assert banded.loc[0, "band_p10"] == 1000.0 - 260.0
    assert banded.loc[0, "band_p90"] == 1000.0 + 60.0


def test_band_is_clipped_at_zero() -> None:
    points = pd.DataFrame({"horizon_h": [15.0], "forecast": [100.0]})
    assert add_bands(points, _errors()).loc[0, "band_p10"] == 0.0


def test_lead_bucket_edges_are_lower_inclusive_and_last_upper_inclusive() -> None:
    errors = pd.DataFrame({"horizon_h": [14.0, 20.0, 38.0], "error": [10.0, 20.0, 30.0]})
    points = pd.DataFrame({"horizon_h": [14.0, 20.0, 38.0], "forecast": [500.0] * 3})
    banded = add_bands(points, errors)
    assert banded["band_p10"].tolist() == [490.0, 480.0, 470.0]


def test_point_outside_all_buckets_has_null_band() -> None:
    points = pd.DataFrame({"horizon_h": [5.0], "forecast": [500.0]})
    assert add_bands(points, _errors())["band_p10"].isna().all()
