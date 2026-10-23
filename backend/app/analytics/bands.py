"""Empirical error bands: the plausible range of actual wind given a forecast.

The bands are in-sample: they are calibrated on the same errors they are drawn over.
"""

import pandas as pd

from app.core.config import BAND_COVERAGE_QUANTILES, BAND_LEAD_BUCKETS_H

BAND_COLUMNS = ["band_p10", "band_p90"]


def add_bands(points: pd.DataFrame, errors: pd.DataFrame) -> pd.DataFrame:
    """Add ``band_p10`` / ``band_p90`` (80 % range for the *actual*) to ``points``.

    Signed errors (forecast - actual) are bucketed by lead time. Per bucket the P10 and
    P90 of the error give ``band_p10 = forecast - P90(e)`` and ``band_p90 = forecast - P10(e)``,
    i.e. bias-corrected, clipped at zero. Points whose lead time falls in no bucket, or
    whose bucket has no errors, get null bands.
    """
    low_q, high_q = BAND_COVERAGE_QUANTILES
    result = points.copy()
    result[BAND_COLUMNS] = float("nan")
    last_bucket = len(BAND_LEAD_BUCKETS_H) - 1
    for index, (lower, upper) in enumerate(BAND_LEAD_BUCKETS_H):
        in_errors = _in_bucket(errors["horizon_h"], lower, upper, index == last_bucket)
        bucket_errors = errors.loc[in_errors, "error"]
        if bucket_errors.empty:
            continue
        p_low, p_high = bucket_errors.quantile(low_q), bucket_errors.quantile(high_q)
        in_points = _in_bucket(points["horizon_h"], lower, upper, index == last_bucket)
        result.loc[in_points, "band_p10"] = (points.loc[in_points, "forecast"] - p_high).clip(
            lower=0
        )
        result.loc[in_points, "band_p90"] = (points.loc[in_points, "forecast"] - p_low).clip(
            lower=0
        )
    return result


def _in_bucket(lead_h: pd.Series, lower: float, upper: float, inclusive_upper: bool) -> pd.Series:
    below_upper = lead_h <= upper if inclusive_upper else lead_h < upper
    return (lead_h >= lower) & below_upper
