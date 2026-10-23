import pandas as pd
import pytest

from app.analytics.metrics import by_day, by_hour, histogram, summarise
from tests.conftest import utc


def _aligned() -> pd.DataFrame:
    """Four points over two London days: errors +100, -50, +300, +50 against actual 1000."""
    return pd.DataFrame(
        {
            "startTime": [
                utc("2026-01-15T10:00:00Z"),
                utc("2026-01-15T11:00:00Z"),
                utc("2026-01-16T10:00:00Z"),
                utc("2026-01-16T11:00:00Z"),
            ],
            "forecast": [1100.0, 950.0, 1300.0, 1050.0],
            "forecast_published": utc("2026-01-14T09:30:00Z"),
            "horizon_h": 24.0,
            "actual": [1000.0] * 4,
            "error": [100.0, -50.0, 300.0, 50.0],
        }
    )


def test_summary_matches_hand_computation() -> None:
    summary = summarise(_aligned())
    assert summary.n == 4
    assert summary.mae == 125.0
    assert summary.bias == 100.0
    assert summary.rmse == pytest.approx(((100**2 + 50**2 + 300**2 + 50**2) / 4) ** 0.5)
    assert summary.wape_pct == pytest.approx(100 * 500 / 4000)
    assert summary.max_abs == 300.0
    assert summary.share_over_forecast_pct == 75.0
    assert summary.p50_abs == 75.0
    assert summary.p90_abs == pytest.approx(240.0)
    assert summary.mean_actual == 1000.0


def test_empty_summary_is_all_none_but_n() -> None:
    summary = summarise(_aligned().iloc[0:0])
    assert summary.n == 0 and summary.mae is None and summary.p90_signed is None


def test_by_hour_groups_by_london_hour() -> None:
    rows = {row["hour_local"]: row for row in by_hour(_aligned())}
    assert rows[10]["mae"] == 200.0 and rows[10]["bias"] == 200.0 and rows[10]["n"] == 2
    assert rows[11]["mae"] == 50.0 and rows[11]["bias"] == 0.0


def test_by_day_groups_by_london_day_with_energy_totals() -> None:
    first, second = by_day(_aligned())
    assert first["day"].isoformat() == "2026-01-15"
    assert first["mae"] == 75.0 and first["bias"] == 25.0
    assert first["wape_pct"] == pytest.approx(100 * 150 / 2000)
    assert first["actual_mwh"] == 2000.0 and first["forecast_mwh"] == 2050.0
    assert second["mae"] == 175.0


def test_histogram_uses_fixed_500_mw_bins_covering_the_range() -> None:
    result = histogram(_aligned())
    assert result.bin_edges == [-500.0, 0.0, 500.0]
    assert result.counts == [1, 3]


def test_histogram_of_single_value_still_has_one_bin() -> None:
    single = _aligned().iloc[:1].assign(error=0.0)
    assert histogram(single).counts == [1]
