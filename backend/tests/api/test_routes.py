from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_loaded_snapshot() -> None:
    with TestClient(app) as client:
        body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["data_loaded"] is True


def test_meta_reports_snapshot_counts() -> None:
    with TestClient(app) as client:
        body = client.get("/api/meta").json()
    assert body["counts"] == {"actual_rows": 1632, "forecast_rows": 20440, "forecast_runs": 280}
    assert body["period"] == {
        "start": "2026-01-02",
        "end": "2026-02-01",
        "timezone": "Europe/London",
    }
    assert body["decision_cutoff_local"] == "11:00"
    assert body["horizon_range_h"] == [0, 48]
