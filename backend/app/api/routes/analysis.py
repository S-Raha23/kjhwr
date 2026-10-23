from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import AnalysisQueryDep, ServiceDep, clamp_to_period
from app.api.schemas import DayResponse, HorizonCurveResponse, MetricsResponse, SeriesResponse
from app.core.config import PERIOD_END, PERIOD_START

router = APIRouter(tags=["analysis"])


@router.get("/series")
def get_series(query: AnalysisQueryDep, service: ServiceDep) -> SeriesResponse:
    return SeriesResponse.model_validate(service.series(query.to_params()))


@router.get("/metrics")
def get_metrics(query: AnalysisQueryDep, service: ServiceDep) -> MetricsResponse:
    return MetricsResponse.model_validate(service.metrics(query.to_params()))


@router.get("/horizon-curve")
def get_horizon_curve(query: AnalysisQueryDep, service: ServiceDep) -> HorizonCurveResponse:
    params = query.to_params()
    return HorizonCurveResponse.model_validate(service.horizon_curve(params.start, params.end))


@router.get("/day")
def get_day(
    day: Annotated[date, Query(alias="date", ge=PERIOD_START, le=PERIOD_END)],
    query: AnalysisQueryDep,
    service: ServiceDep,
) -> DayResponse:
    params = query.to_params()
    return DayResponse.model_validate(service.day(clamp_to_period(day), params.start, params.end))
