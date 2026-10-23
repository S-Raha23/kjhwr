from datetime import date

import pandas as pd

from app.analytics.period import decision_cutoff_utc, delivery_days, window_utc


def test_delivery_days_inclusive() -> None:
    days = delivery_days(date(2026, 1, 2), date(2026, 2, 1))
    assert len(days) == 31
    assert days[0] == date(2026, 1, 2) and days[-1] == date(2026, 2, 1)


def test_window_covers_whole_period() -> None:
    first, after = window_utc(date(2026, 1, 2), date(2026, 2, 1))
    assert first == pd.Timestamp("2026-01-02T00:00Z")
    assert (after - first) // pd.Timedelta(minutes=30) == 1488


def test_cutoff_is_1100_london_previous_day_in_winter() -> None:
    assert decision_cutoff_utc(date(2026, 1, 15)) == pd.Timestamp("2026-01-14T11:00Z")


def test_cutoff_on_clock_change_day_is_still_gmt() -> None:
    assert decision_cutoff_utc(date(2026, 3, 29)) == pd.Timestamp("2026-03-28T11:00Z")


def test_cutoff_in_bst_is_1000_utc() -> None:
    assert decision_cutoff_utc(date(2026, 7, 10)) == pd.Timestamp("2026-07-09T10:00Z")
