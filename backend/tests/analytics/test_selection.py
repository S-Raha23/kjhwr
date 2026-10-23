from datetime import date

import pandas as pd
import pytest

from app.analytics.period import decision_cutoff_utc
from app.analytics.selection import select_at_cutoff, select_at_horizon
from app.data.snapshot_store import Snapshot
from tests.conftest import make_forecasts, utc

DAY = date(2026, 1, 15)
TARGET = "2026-01-15T12:00:00Z"
CUTOFF = "2026-01-14T11:00:00Z"
PERIOD = (date(2026, 1, 2), date(2026, 2, 1))


def _run(published: str, generation: float, target: str = TARGET) -> tuple[str, str, float]:
    return (published, target, generation)


def _selected_for(frame: pd.DataFrame, target: str = TARGET) -> pd.Series:
    return frame[frame["startTime"] == utc(target)].iloc[0]


def test_cutoff_mode_latest_run_before_cutoff_wins() -> None:
    forecasts = make_forecasts(
        [
            _run("2026-01-14T08:30:00Z", 100),
            _run("2026-01-14T09:30:00Z", 200),
            _run("2026-01-14T11:30:00Z", 300),
        ]
    )
    row = _selected_for(select_at_cutoff(forecasts, DAY, DAY))
    assert row["forecast"] == 200
    assert row["forecast_published"] == utc("2026-01-14T09:30:00Z")


def test_run_published_exactly_at_cutoff_is_included() -> None:
    forecasts = make_forecasts([_run("2026-01-14T09:30:00Z", 200), _run(CUTOFF, 250)])
    assert _selected_for(select_at_cutoff(forecasts, DAY, DAY))["forecast"] == 250


def test_cutoff_mode_uses_one_run_for_every_hour_of_a_day() -> None:
    hours = pd.date_range("2026-01-15T00:00Z", periods=24, freq="1h")
    rows = [("2026-01-14T09:30:00Z", t.strftime("%Y-%m-%dT%H:%M:%SZ"), 1.0) for t in hours]
    rows += [("2026-01-14T04:30:00Z", t.strftime("%Y-%m-%dT%H:%M:%SZ"), 2.0) for t in hours]
    selected = select_at_cutoff(make_forecasts(rows), DAY, DAY)
    assert len(selected) == 24
    assert selected["forecast_published"].nunique() == 1


def test_negative_horizon_rows_are_excluded() -> None:
    forecasts = make_forecasts(
        [("2026-01-15T13:00:00Z", TARGET, 999), ("2026-01-15T09:00:00Z", TARGET, 111)]
    )
    row = _selected_for(select_at_horizon(forecasts, DAY, DAY, horizon_h=0))
    assert row["forecast"] == 111 and row["horizon_h"] == 3.0


def test_missing_run_gives_null_forecast_not_zero() -> None:
    forecasts = make_forecasts([_run("2026-01-14T11:30:00Z", 300)])
    row = _selected_for(select_at_cutoff(forecasts, DAY, DAY))
    assert pd.isna(row["forecast"]) and pd.isna(row["forecast_published"])


def test_cutoff_is_gmt_on_clock_change_day_and_bst_after() -> None:
    assert decision_cutoff_utc(date(2026, 3, 29)) == utc("2026-03-28T11:00:00Z")
    assert decision_cutoff_utc(date(2026, 3, 30)) == utc("2026-03-29T10:00:00Z")
    forecasts = make_forecasts(
        [
            ("2026-03-29T09:59:00Z", "2026-03-30T08:00:00Z", 1),
            ("2026-03-29T10:30:00Z", "2026-03-30T08:00:00Z", 2),
        ]
    )
    bst_day = date(2026, 3, 30)
    selected = select_at_cutoff(forecasts, bst_day, bst_day)
    assert _selected_for(selected, "2026-03-30T08:00:00Z")["forecast"] == 1


def test_no_leakage_in_cutoff_mode_on_real_snapshot(real_snapshot: Snapshot) -> None:
    selected = select_at_cutoff(real_snapshot.forecasts, *PERIOD).dropna(subset=["forecast"])
    assert len(selected) == 744
    local_day = selected["startTime"].dt.tz_convert("Europe/London").dt.date
    cutoffs = pd.to_datetime(local_day.map(decision_cutoff_utc), utc=True)
    assert (selected["forecast_published"] <= cutoffs).all()


@pytest.mark.parametrize("horizon_h", [0, 1, 12, 24, 36, 48])
def test_no_leakage_in_horizon_mode_on_real_snapshot(
    real_snapshot: Snapshot, horizon_h: int
) -> None:
    selected = select_at_horizon(real_snapshot.forecasts, *PERIOD, horizon_h).dropna(
        subset=["forecast"]
    )
    assert not selected.empty
    latest_allowed = selected["startTime"] - pd.Timedelta(hours=horizon_h)
    assert (selected["forecast_published"] <= latest_allowed).all()
    assert (selected["horizon_h"] >= horizon_h).all()
