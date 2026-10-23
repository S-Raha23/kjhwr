from app.data.transform import actuals_to_frame, forecasts_to_frame


def test_actuals_dedupe_keeps_latest_publish() -> None:
    records = [
        {
            "publishTime": "2026-01-01T02:00:00Z",
            "startTime": "2026-01-01T01:30:00Z",
            "generation": 1,
        },
        {
            "publishTime": "2026-01-01T03:00:00Z",
            "startTime": "2026-01-01T01:30:00Z",
            "generation": 2,
        },
        {
            "publishTime": "2026-01-01T02:00:00Z",
            "startTime": "2026-01-01T01:00:00Z",
            "generation": 3,
        },
    ]
    frame = actuals_to_frame(records)
    assert list(frame.columns) == ["startTime", "generation"]
    assert frame["generation"].tolist() == [3.0, 2.0]
    assert str(frame["startTime"].dt.tz) == "UTC"


def test_forecasts_are_typed_and_deduplicated() -> None:
    row = {
        "publishTime": "2026-01-01T09:30:00Z",
        "startTime": "2026-01-02T00:00:00Z",
        "generation": 10,
    }
    frame = forecasts_to_frame([row, dict(row), {**row, "startTime": "2026-01-02T01:00:00Z"}])
    assert len(frame) == 2
    assert frame["generation"].dtype == "float64"
    assert str(frame["publishTime"].dt.tz) == "UTC"
