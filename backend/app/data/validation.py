"""Snapshot validation rules: fail the ingest (and keep the old snapshot) on bad data."""

import logging

import pandas as pd

from app.analytics.period import decision_cutoff_utc, delivery_days, window_utc
from app.core.config import (
    MAX_PLAUSIBLE_GENERATION_MW,
    MIN_ACTUALS_COVERAGE,
    PERIOD_END,
    PERIOD_START,
)
from app.core.errors import IngestValidationError

logger = logging.getLogger(__name__)

HALF_HOUR = pd.Timedelta(minutes=30)


def validate_snapshot(actuals: pd.DataFrame, forecasts: pd.DataFrame) -> None:
    """Raise ``IngestValidationError`` if the frames break any hard rule; log soft warnings."""
    errors = [
        *_value_errors("actuals", actuals),
        *_value_errors("forecasts", forecasts),
        *_actuals_coverage_errors(actuals),
        *_cutoff_run_errors(forecasts),
    ]
    if errors:
        raise IngestValidationError("; ".join(errors))
    _warn_unexpected_minutes(actuals, forecasts)


def _value_errors(name: str, frame: pd.DataFrame) -> list[str]:
    generation = frame["generation"]
    errors = []
    if generation.isna().any():
        errors.append(f"{name}: {int(generation.isna().sum())} null generation values")
    if ((generation < 0) | (generation > MAX_PLAUSIBLE_GENERATION_MW)).any():
        errors.append(f"{name}: generation outside 0..{MAX_PLAUSIBLE_GENERATION_MW} MW")
    return errors


def _actuals_coverage_errors(actuals: pd.DataFrame) -> list[str]:
    first, after = window_utc(PERIOD_START, PERIOD_END)
    expected = (after - first) // HALF_HOUR
    in_period = actuals["startTime"].between(first, after, inclusive="left").sum()
    if in_period < MIN_ACTUALS_COVERAGE * expected:
        return [f"actuals: {in_period} of {expected} expected half-hours in period"]
    return []


def _cutoff_run_errors(forecasts: pd.DataFrame) -> list[str]:
    first_publish = forecasts["publishTime"].min() if len(forecasts) else None
    missing = [
        day.isoformat()
        for day in delivery_days(PERIOD_START, PERIOD_END)
        if first_publish is None or first_publish > decision_cutoff_utc(day)
    ]
    return [f"forecasts: no run before the cutoff for {', '.join(missing)}"] if missing else []


def _warn_unexpected_minutes(actuals: pd.DataFrame, forecasts: pd.DataFrame) -> None:
    odd_actuals = int((~actuals["startTime"].dt.minute.isin([0, 30])).sum())
    odd_forecasts = int((forecasts["startTime"].dt.minute != 0).sum())
    if odd_actuals or odd_forecasts:
        logger.warning(
            "Unexpected minutes: %d actual rows, %d forecast rows", odd_actuals, odd_forecasts
        )
