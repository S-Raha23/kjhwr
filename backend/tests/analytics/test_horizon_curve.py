from datetime import date

from app.analytics.horizon_curve import horizon_curve
from tests.conftest import make_actuals, make_forecasts

DAY = date(2026, 1, 15)


def test_curve_covers_0_to_48_and_reports_coverage() -> None:
    forecasts = make_forecasts([("2026-01-14T09:00:00Z", "2026-01-15T12:00:00Z", 1100)])
    actuals = make_actuals([("2026-01-15T12:00:00Z", 1000)])
    points = horizon_curve(forecasts, actuals, DAY, DAY)
    assert [p.horizon_h for p in points] == list(range(49))
    # lead time is 27 h: eligible for h <= 27, absent beyond
    assert points[27].summary.n == 1 and points[27].summary.mae == 100.0
    assert points[27].coverage_pct == 100 / 24
    assert points[28].summary.n == 0 and points[28].coverage_pct == 0.0
