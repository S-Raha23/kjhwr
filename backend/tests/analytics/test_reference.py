"""Acceptance test: reproduce the independently computed reference numbers (docs/04 §6)."""

from datetime import date

import pandas as pd
import pytest

from app.analytics.alignment import align
from app.analytics.metrics import summarise
from app.analytics.selection import select_at_cutoff, select_at_horizon
from app.data.snapshot_store import Snapshot

PERIOD = (date(2026, 1, 2), date(2026, 2, 1))
MW_TOLERANCE = 0.5
PCT_TOLERANCE = 0.05

CUTOFF_REFERENCE = {
    "mae": 1995.6,
    "rmse": 2498.8,
    "bias": 1728.0,
    "p90_abs": 4183.9,
    "p10_signed": -502.7,
    "p90_signed": 4183.9,
    "max_abs": 6857.0,
}
CUTOFF_WAPE_PCT = 17.68

HORIZON_REFERENCE = {
    0: (744, 1679.9, 2141.1, 1471.1, 14.89),
    4: (744, 1719.4, 2199.7, 1524.4, 15.24),
    12: (744, 1791.2, 2263.6, 1595.1, 15.87),
    24: (744, 1932.2, 2399.4, 1736.2, 17.12),
    36: (744, 2142.5, 2647.8, 1833.7, 18.98),
    48: (589, 2301.2, 2871.5, 1800.5, 20.50),
}


def test_cutoff_mode_reproduces_reference(real_snapshot: Snapshot) -> None:
    selected = select_at_cutoff(real_snapshot.forecasts, *PERIOD)
    aligned = align(selected, real_snapshot.actuals)
    summary = summarise(aligned)
    assert summary.n == 744
    for name, expected in CUTOFF_REFERENCE.items():
        assert getattr(summary, name) == pytest.approx(expected, abs=MW_TOLERANCE), name
    assert summary.wape_pct == pytest.approx(CUTOFF_WAPE_PCT, abs=PCT_TOLERANCE)


def test_cutoff_mode_always_uses_the_0930_run_with_14_to_38_hour_leads(
    real_snapshot: Snapshot,
) -> None:
    selected = select_at_cutoff(real_snapshot.forecasts, *PERIOD)
    published = pd.to_datetime(selected["forecast_published"], utc=True)
    assert set(published.dt.strftime("%H:%M")) == {"09:30"}
    assert selected["horizon_h"].min() == 14.5 and selected["horizon_h"].max() == 37.5


@pytest.mark.parametrize("horizon_h", sorted(HORIZON_REFERENCE))
def test_horizon_mode_reproduces_reference(real_snapshot: Snapshot, horizon_h: int) -> None:
    n, mae, rmse, bias, wape = HORIZON_REFERENCE[horizon_h]
    aligned = align(
        select_at_horizon(real_snapshot.forecasts, *PERIOD, horizon_h), real_snapshot.actuals
    )
    summary = summarise(aligned)
    assert summary.n == n
    assert summary.mae == pytest.approx(mae, abs=MW_TOLERANCE)
    assert summary.rmse == pytest.approx(rmse, abs=MW_TOLERANCE)
    assert summary.bias == pytest.approx(bias, abs=MW_TOLERANCE)
    assert summary.wape_pct == pytest.approx(wape, abs=PCT_TOLERANCE)
