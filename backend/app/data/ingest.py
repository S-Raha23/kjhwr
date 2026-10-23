"""Fetch -> transform -> validate -> persist. CLI: ``python -m app.data.ingest``."""

import logging
import time
from datetime import UTC, datetime

from app.core.config import (
    ACTUALS_SETTLEMENT_FROM,
    ACTUALS_SETTLEMENT_TO,
    FORECAST_PUBLISH_FROM,
    FORECAST_PUBLISH_TO,
    get_settings,
)
from app.core.logging import setup_logging
from app.data.elexon_client import ElexonClient
from app.data.snapshot_store import Snapshot, save_snapshot
from app.data.transform import actuals_to_frame, forecasts_to_frame
from app.data.validation import validate_snapshot

logger = logging.getLogger(__name__)


def fetch_snapshot(client: ElexonClient) -> Snapshot:
    """Fetch both datasets from Elexon and return a validated snapshot."""
    started = time.monotonic()
    actuals = actuals_to_frame(client.fetch_actuals(ACTUALS_SETTLEMENT_FROM, ACTUALS_SETTLEMENT_TO))
    forecasts = forecasts_to_frame(
        client.fetch_forecasts(FORECAST_PUBLISH_FROM, FORECAST_PUBLISH_TO)
    )
    validate_snapshot(actuals, forecasts)
    snapshot = Snapshot(actuals, forecasts, fetched_at=datetime.now(UTC))
    logger.info("Fetched %s in %.1fs", snapshot.counts, time.monotonic() - started)
    return snapshot


def main() -> None:
    settings = get_settings()
    setup_logging(settings.log_level)
    snapshot = fetch_snapshot(ElexonClient())
    save_snapshot(snapshot, settings.snapshot_dir)
    logger.info("Snapshot written to %s", settings.snapshot_dir)


if __name__ == "__main__":
    main()
