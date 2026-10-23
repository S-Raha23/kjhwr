"""Delivery-day windows and the D-1 decision cutoff, all computed in Europe/London."""

from datetime import date, datetime, timedelta

import pandas as pd

from app.core.config import DECISION_CUTOFF_LOCAL, LONDON


def delivery_days(start: date, end: date) -> list[date]:
    """Every London delivery day from ``start`` to ``end`` inclusive."""
    return [start + timedelta(days=i) for i in range((end - start).days + 1)]


def window_utc(start: date, end: date) -> tuple[pd.Timestamp, pd.Timestamp]:
    """Target-time window ``[start 00:00 London, (end + 1 day) 00:00 London)`` in UTC."""
    first = pd.Timestamp(datetime.combine(start, datetime.min.time()), tz=LONDON)
    after = pd.Timestamp(datetime.combine(end + timedelta(days=1), datetime.min.time()), tz=LONDON)
    return first.tz_convert("UTC"), after.tz_convert("UTC")


def decision_cutoff_utc(delivery_day: date) -> pd.Timestamp:
    """Day-ahead gate closure for ``delivery_day``: 11:00 London on the previous day, in UTC."""
    local = datetime.combine(delivery_day - timedelta(days=1), DECISION_CUTOFF_LOCAL)
    return pd.Timestamp(local, tz=LONDON).tz_convert("UTC")
