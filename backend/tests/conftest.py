import pandas as pd
import pytest

from app.core.config import get_settings
from app.data.snapshot_store import Snapshot, SnapshotStore


def utc(text: str) -> pd.Timestamp:
    return pd.Timestamp(text, tz="UTC")


def make_forecasts(rows: list[tuple[str, str, float]]) -> pd.DataFrame:
    """Rows of (publishTime, startTime, generation) as a typed forecasts frame."""
    return pd.DataFrame(
        {
            "publishTime": [utc(p) for p, _, _ in rows],
            "startTime": [utc(s) for _, s, _ in rows],
            "generation": [float(g) for _, _, g in rows],
        }
    )


def make_actuals(rows: list[tuple[str, float]]) -> pd.DataFrame:
    """Rows of (startTime, generation) as a typed actuals frame."""
    return pd.DataFrame(
        {"startTime": [utc(s) for s, _ in rows], "generation": [float(g) for _, g in rows]}
    )


@pytest.fixture(scope="session")
def real_snapshot() -> Snapshot:
    return SnapshotStore.load(get_settings().snapshot_dir).snapshot
