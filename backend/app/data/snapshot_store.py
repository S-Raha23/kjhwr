"""In-memory snapshot of actuals and forecasts, persisted as Parquet."""

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd

from app.core.errors import DataUnavailableError

ACTUALS_FILE = "actuals.parquet"
FORECASTS_FILE = "forecasts.parquet"
META_FILE = "snapshot_meta.json"


@dataclass(frozen=True)
class Snapshot:
    actuals: pd.DataFrame
    forecasts: pd.DataFrame
    fetched_at: datetime

    @property
    def counts(self) -> dict[str, int]:
        return {
            "actual_rows": len(self.actuals),
            "forecast_rows": len(self.forecasts),
            "forecast_runs": int(self.forecasts["publishTime"].nunique()),
        }


class SnapshotStore:
    """Holds the current snapshot; ``replace`` swaps it atomically and bumps ``version``."""

    def __init__(self, snapshot: Snapshot) -> None:
        self._snapshot = snapshot
        self._version = 1

    @classmethod
    def load(cls, directory: Path) -> "SnapshotStore":
        try:
            meta = json.loads((directory / META_FILE).read_text())
            snapshot = Snapshot(
                actuals=pd.read_parquet(directory / ACTUALS_FILE),
                forecasts=pd.read_parquet(directory / FORECASTS_FILE),
                fetched_at=datetime.fromisoformat(meta["fetched_at"]),
            )
        except (OSError, KeyError, ValueError) as error:
            raise DataUnavailableError(f"No readable snapshot in {directory}") from error
        return cls(snapshot)

    @property
    def snapshot(self) -> Snapshot:
        return self._snapshot

    @property
    def version(self) -> int:
        return self._version

    def replace(self, snapshot: Snapshot) -> None:
        self._snapshot = snapshot
        self._version += 1


def save_snapshot(snapshot: Snapshot, directory: Path) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    snapshot.actuals.to_parquet(directory / ACTUALS_FILE, index=False)
    snapshot.forecasts.to_parquet(directory / FORECASTS_FILE, index=False)
    meta = {
        "fetched_at": snapshot.fetched_at.astimezone(UTC).isoformat(),
        **snapshot.counts,
    }
    (directory / META_FILE).write_text(json.dumps(meta, indent=2) + "\n")
