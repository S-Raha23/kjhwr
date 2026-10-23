import pandas as pd
import pytest

from app.core.errors import IngestValidationError
from app.data.snapshot_store import Snapshot
from app.data.validation import validate_snapshot
from tests.conftest import make_actuals, make_forecasts


def _full_actuals() -> pd.DataFrame:
    times = pd.date_range("2026-01-02T00:00Z", "2026-02-01T23:30Z", freq="30min")
    return pd.DataFrame({"startTime": times, "generation": 5000.0})


def _early_forecasts() -> pd.DataFrame:
    return make_forecasts([("2026-01-01T02:30:00Z", "2026-01-02T00:00:00Z", 5000)])


def test_valid_snapshot_passes() -> None:
    validate_snapshot(_full_actuals(), _early_forecasts())


def test_real_snapshot_passes(real_snapshot: Snapshot) -> None:
    validate_snapshot(real_snapshot.actuals, real_snapshot.forecasts)


def test_sparse_actuals_fail() -> None:
    sparse = make_actuals([("2026-01-02T00:00:00Z", 5000)])
    with pytest.raises(IngestValidationError, match="expected half-hours"):
        validate_snapshot(sparse, _early_forecasts())


def test_missing_cutoff_run_fails() -> None:
    late = make_forecasts([("2026-01-20T02:30:00Z", "2026-01-21T00:00:00Z", 5000)])
    with pytest.raises(IngestValidationError, match="no run before the cutoff"):
        validate_snapshot(_full_actuals(), late)


def test_null_and_out_of_range_values_fail() -> None:
    actuals = _full_actuals()
    actuals.loc[0, "generation"] = None
    forecasts = _early_forecasts()
    forecasts.loc[0, "generation"] = 99_999.0
    with pytest.raises(IngestValidationError) as error:
        validate_snapshot(actuals, forecasts)
    assert "null" in str(error.value) and "outside" in str(error.value)
