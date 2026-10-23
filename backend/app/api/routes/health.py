from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_store
from app.api.schemas import HealthResponse, MetaResponse, PeriodInfo, SnapshotCounts
from app.core.config import (
    DECISION_CUTOFF_LOCAL,
    HORIZON_RANGE_H,
    LONDON,
    PERIOD_END,
    PERIOD_START,
    SOURCE_LABEL,
)
from app.data.snapshot_store import SnapshotStore

router = APIRouter(tags=["health"])

StoreDep = Annotated[SnapshotStore, Depends(get_store)]


@router.get("/health")
def get_health(store: StoreDep) -> HealthResponse:
    return HealthResponse(
        status="ok", data_loaded=True, snapshot_fetched_at=store.snapshot.fetched_at
    )


@router.get("/meta")
def get_meta(store: StoreDep) -> MetaResponse:
    snapshot = store.snapshot
    return MetaResponse(
        period=PeriodInfo(start=PERIOD_START, end=PERIOD_END, timezone=LONDON.key),
        decision_cutoff_local=DECISION_CUTOFF_LOCAL.strftime("%H:%M"),
        horizon_range_h=HORIZON_RANGE_H,
        counts=SnapshotCounts(**snapshot.counts),
        snapshot_fetched_at=snapshot.fetched_at,
        source=SOURCE_LABEL,
    )
