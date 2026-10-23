"""FastAPI dependencies."""

from fastapi import Request

from app.data.snapshot_store import SnapshotStore


def get_store(request: Request) -> SnapshotStore:
    store: SnapshotStore = request.app.state.store
    return store
