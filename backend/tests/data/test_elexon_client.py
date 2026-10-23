from datetime import UTC, date, datetime

import httpx
import pytest

from app.core.errors import DataUnavailableError
from app.data.elexon_client import ElexonClient

JAN_1, JAN_2 = date(2026, 1, 1), date(2026, 1, 2)


def _client(transport: httpx.MockTransport, sleeps: list[float] | None = None) -> ElexonClient:
    http = httpx.Client(base_url="https://example.test", transport=transport)
    return ElexonClient(http, sleep=sleeps.append if sleeps is not None else lambda _: None)


def test_forecasts_are_requested_in_seven_day_chunks() -> None:
    seen: list[dict[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(dict(request.url.params))
        return httpx.Response(200, json=[])

    start, end = datetime(2026, 1, 1, tzinfo=UTC), datetime(2026, 1, 16, tzinfo=UTC)
    _client(httpx.MockTransport(handler)).fetch_forecasts(start, end)
    assert [p["publishDateTimeFrom"] for p in seen] == [
        "2026-01-01T00:00:00Z",
        "2026-01-08T00:00:00Z",
        "2026-01-15T00:00:00Z",
    ]
    assert seen[-1]["publishDateTimeTo"] == "2026-01-16T00:00:00Z"


def test_retries_with_exponential_backoff_then_succeeds() -> None:
    calls = {"n": 0}

    def handler(_: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(503) if calls["n"] < 3 else httpx.Response(200, json=[{"a": 1}])

    sleeps: list[float] = []
    records = _client(httpx.MockTransport(handler), sleeps).fetch_actuals(JAN_1, JAN_2)
    assert records == [{"a": 1}]
    assert sleeps == [1.0, 2.0]


def test_persistent_failure_raises_domain_error() -> None:
    client = _client(httpx.MockTransport(lambda _: httpx.Response(500)))
    with pytest.raises(DataUnavailableError):
        client.fetch_actuals(JAN_1, JAN_2)
