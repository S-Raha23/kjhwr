from collections.abc import Iterator
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_elexon_client
from app.data.elexon_client import ElexonClient
from app.data.snapshot_store import Snapshot
from app.main import create_app

ADMIN_TOKEN = "secret-token"
ADMIN_HEADERS = {"X-Admin-Token": ADMIN_TOKEN}


@pytest.fixture()
def client() -> Iterator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client


def _elexon_client(handler: httpx.MockTransport) -> ElexonClient:
    http = httpx.Client(base_url="https://example.test", transport=handler)
    return ElexonClient(http, sleep=lambda _: None)


def _snapshot_transport(snapshot: Snapshot) -> httpx.MockTransport:
    """An Elexon stand-in that serves the committed snapshot as raw API records."""

    def iso(column: Any) -> list[str]:
        return [t.strftime("%Y-%m-%dT%H:%M:%SZ") for t in column]

    actuals = [
        {"publishTime": s, "startTime": s, "generation": g}
        for s, g in zip(
            iso(snapshot.actuals["startTime"]), snapshot.actuals["generation"], strict=True
        )
    ]
    forecasts = [
        {"publishTime": p, "startTime": s, "generation": g}
        for p, s, g in zip(
            iso(snapshot.forecasts["publishTime"]),
            iso(snapshot.forecasts["startTime"]),
            snapshot.forecasts["generation"],
            strict=True,
        )
    ]

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=actuals if "FUELHH" in request.url.path else forecasts)

    return httpx.MockTransport(handler)


def test_health_reports_loaded_snapshot(client: TestClient) -> None:
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["data_loaded"] is True


def test_meta_reports_snapshot_counts(client: TestClient) -> None:
    body = client.get("/api/meta").json()
    assert body["counts"] == {"actual_rows": 1632, "forecast_rows": 20440, "forecast_runs": 280}
    assert body["period"] == {
        "start": "2026-01-02",
        "end": "2026-02-01",
        "timezone": "Europe/London",
    }
    assert body["decision_cutoff_local"] == "11:00"
    assert body["horizon_range_h"] == [0, 48]


def test_series_has_half_hourly_points_with_forecast_on_the_hour(client: TestClient) -> None:
    body = client.get("/api/series").json()
    assert body["meta"] == {
        "start": "2026-01-02",
        "end": "2026-02-01",
        "mode": "cutoff",
        "horizon_h": None,
    }
    points = body["points"]
    assert len(points) == 1488
    assert points[0]["t"] == "2026-01-02T00:00:00Z"
    assert points[0]["forecast_published"] == "2026-01-01T09:30:00Z"
    assert points[0]["horizon_h"] == 14.5
    assert points[1]["t"] == "2026-01-02T00:30:00Z" and points[1]["forecast"] is None


def test_metrics_default_view_matches_reference(client: TestClient) -> None:
    body = client.get("/api/metrics").json()
    assert body["summary"]["n"] == 744
    assert body["summary"]["mae"] == pytest.approx(1995.6, abs=0.5)
    assert body["summary"]["bias"] == pytest.approx(1728.0, abs=0.5)
    assert len(body["by_hour"]) == 24 and len(body["by_day"]) == 31
    assert sum(body["histogram"]["counts"]) == 744


def test_metrics_horizon_mode_matches_reference(client: TestClient) -> None:
    body = client.get("/api/metrics", params={"mode": "horizon", "horizon_h": 0}).json()
    assert body["meta"]["horizon_h"] == 0
    assert body["summary"]["mae"] == pytest.approx(1679.9, abs=0.5)


def test_dates_are_clamped_to_the_period_and_echoed(client: TestClient) -> None:
    meta = client.get("/api/metrics", params={"start": "2025-12-01", "end": "2026-12-31"}).json()[
        "meta"
    ]
    assert meta["start"] == "2026-01-02" and meta["end"] == "2026-02-01"


def test_horizon_curve_has_49_points(client: TestClient) -> None:
    points = client.get("/api/horizon-curve").json()["points"]
    assert [p["horizon_h"] for p in points] == list(range(49))
    assert points[48]["n"] == 589 and points[0]["coverage_pct"] == 100.0


def test_day_panel_has_bands_and_totals(client: TestClient) -> None:
    body = client.get("/api/day", params={"date": "2026-01-15"}).json()
    assert body["decision_time"] == "2026-01-14T11:00:00Z"
    assert body["forecast_published"] == "2026-01-14T09:30:00Z"
    assert len(body["points"]) == 24
    first = body["points"][0]
    assert first["band_p10"] <= first["band_p90"]
    totals = body["totals"]
    assert totals["error_mwh"] == pytest.approx(totals["forecast_mwh"] - totals["actual_mwh"])


@pytest.mark.parametrize(
    ("path", "params"),
    [
        ("/api/series", {"start": "2026-01-10", "end": "2026-01-05"}),
        ("/api/series", {"mode": "sideways"}),
        ("/api/metrics", {"mode": "horizon", "horizon_h": 49}),
        ("/api/metrics", {"mode": "horizon", "horizon_h": -1}),
        ("/api/day", {"date": "2026-03-01"}),
        ("/api/day", {}),
    ],
)
def test_invalid_queries_are_rejected_with_422(
    client: TestClient, path: str, params: dict[str, str | int]
) -> None:
    assert client.get(path, params=params).status_code == 422


def test_analysis_gets_are_cacheable(client: TestClient) -> None:
    assert client.get("/api/metrics").headers["Cache-Control"] == "public, max-age=300"


def test_refresh_is_404_when_no_admin_token_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("ADMIN_TOKEN", raising=False)
    assert client.post("/api/admin/refresh", headers=ADMIN_HEADERS).status_code == 404


def test_refresh_is_401_without_a_valid_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("ADMIN_TOKEN", ADMIN_TOKEN)
    assert client.post("/api/admin/refresh").status_code == 401
    assert client.post("/api/admin/refresh", headers={"X-Admin-Token": "nope"}).status_code == 401


def test_refresh_swaps_in_new_data(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, real_snapshot: Snapshot
) -> None:
    monkeypatch.setenv("ADMIN_TOKEN", ADMIN_TOKEN)
    transport = _snapshot_transport(real_snapshot)
    client.app.dependency_overrides[get_elexon_client] = lambda: _elexon_client(transport)  # type: ignore[attr-defined]
    before = client.app.state.store.version  # type: ignore[attr-defined]
    response = client.post("/api/admin/refresh", headers=ADMIN_HEADERS)
    assert response.status_code == 200
    assert response.json()["counts"]["forecast_runs"] == 280
    assert client.app.state.store.version == before + 1  # type: ignore[attr-defined]


def test_failed_refresh_returns_502_and_keeps_old_data(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("ADMIN_TOKEN", ADMIN_TOKEN)
    failing = httpx.MockTransport(lambda _: httpx.Response(500))
    client.app.dependency_overrides[get_elexon_client] = lambda: _elexon_client(failing)  # type: ignore[attr-defined]
    before = client.app.state.store.version  # type: ignore[attr-defined]
    response = client.post("/api/admin/refresh", headers=ADMIN_HEADERS)
    assert response.status_code == 502
    assert client.app.state.store.version == before  # type: ignore[attr-defined]
    assert client.get("/api/meta").json()["counts"]["forecast_runs"] == 280
