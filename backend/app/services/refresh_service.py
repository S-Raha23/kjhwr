"""Live refresh: re-fetch both datasets, validate, and swap them into the store."""

from typing import Any

from app.data.elexon_client import ElexonClient
from app.data.ingest import fetch_snapshot
from app.data.snapshot_store import SnapshotStore


def refresh_snapshot(store: SnapshotStore, client: ElexonClient) -> dict[str, Any]:
    """Replace the in-memory snapshot. On any failure the exception propagates and the old
    snapshot stays in place (the swap only happens after fetch and validation succeed)."""
    snapshot = fetch_snapshot(client)
    store.replace(snapshot)
    return {"counts": snapshot.counts, "snapshot_fetched_at": snapshot.fetched_at}
