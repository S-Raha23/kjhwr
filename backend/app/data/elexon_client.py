"""HTTP client for the Elexon BMRS API: retries, backoff and 7-day chunking."""

import logging
import time
from collections.abc import Callable
from datetime import date, datetime
from typing import Any

import httpx

from app.core.config import (
    ELEXON_BASE_URL,
    FORECAST_CHUNK,
    HTTP_BACKOFF_BASE_S,
    HTTP_MAX_ATTEMPTS,
    HTTP_TIMEOUT_S,
)
from app.core.errors import DataUnavailableError

logger = logging.getLogger(__name__)

Record = dict[str, Any]
ISO_UTC = "%Y-%m-%dT%H:%M:%SZ"


class ElexonClient:
    def __init__(
        self,
        client: httpx.Client | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._client = client or httpx.Client(base_url=ELEXON_BASE_URL, timeout=HTTP_TIMEOUT_S)
        self._sleep = sleep

    def fetch_actuals(self, settlement_from: date, settlement_to: date) -> list[Record]:
        """FUELHH half-hourly wind generation for the settlement-date range."""
        params = {
            "settlementDateFrom": settlement_from.isoformat(),
            "settlementDateTo": settlement_to.isoformat(),
            "fuelType": "WIND",
        }
        return self._get("/datasets/FUELHH/stream", params)

    def fetch_forecasts(self, publish_from: datetime, publish_to: datetime) -> list[Record]:
        """WINDFOR forecasts published in ``[publish_from, publish_to]``, fetched in chunks."""
        records: list[Record] = []
        chunk_start = publish_from
        while chunk_start < publish_to:
            chunk_end = min(chunk_start + FORECAST_CHUNK, publish_to)
            params = {
                "publishDateTimeFrom": chunk_start.strftime(ISO_UTC),
                "publishDateTimeTo": chunk_end.strftime(ISO_UTC),
            }
            records.extend(self._get("/datasets/WINDFOR/stream", params))
            chunk_start = chunk_end
        return records

    def _get(self, path: str, params: dict[str, str]) -> list[Record]:
        last_error: Exception | None = None
        for attempt in range(HTTP_MAX_ATTEMPTS):
            try:
                response = self._client.get(path, params=params)
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError) as error:
                last_error = error
                logger.warning("Elexon %s attempt %d failed: %s", path, attempt + 1, error)
                if attempt < HTTP_MAX_ATTEMPTS - 1:
                    self._sleep(HTTP_BACKOFF_BASE_S * 2**attempt)
                continue
            if not isinstance(payload, list):
                raise DataUnavailableError(f"Unexpected payload from {path}: expected a list")
            return payload
        raise DataUnavailableError(f"Elexon request to {path} failed") from last_error
