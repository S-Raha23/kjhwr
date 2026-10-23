from fastapi import APIRouter, Depends

from app.api.deps import ElexonClientDep, StoreDep, require_admin
from app.api.schemas import RefreshResponse
from app.services.refresh_service import refresh_snapshot

router = APIRouter(tags=["admin"], dependencies=[Depends(require_admin)])


@router.post("/admin/refresh")
def post_refresh(store: StoreDep, client: ElexonClientDep) -> RefreshResponse:
    return RefreshResponse.model_validate(refresh_snapshot(store, client))
