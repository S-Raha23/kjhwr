"""Runtime settings (environment) and domain constants (the rules of the pilot)."""

from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

LONDON = ZoneInfo("Europe/London")

PERIOD_START = date(2026, 1, 2)
PERIOD_END = date(2026, 2, 1)
DECISION_CUTOFF_LOCAL = time(11, 0)
HORIZON_RANGE_H = (0, 48)
DEFAULT_HORIZON_H = 24
HISTOGRAM_BIN_MW = 500
BAND_LEAD_BUCKETS_H = ((14, 20), (20, 26), (26, 32), (32, 38))
BAND_COVERAGE_QUANTILES = (0.1, 0.9)

MAX_PLAUSIBLE_GENERATION_MW = 30_000
MIN_ACTUALS_COVERAGE = 0.95

SOURCE_LABEL = "Elexon BMRS FUELHH (WIND) and WINDFOR"

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
ACTUALS_SETTLEMENT_FROM = date(2025, 12, 31)
ACTUALS_SETTLEMENT_TO = date(2026, 2, 2)
FORECAST_PUBLISH_FROM = datetime(2025, 12, 29, tzinfo=UTC)
FORECAST_PUBLISH_TO = datetime(2026, 2, 2, tzinfo=UTC)
FORECAST_CHUNK = timedelta(days=7)
HTTP_TIMEOUT_S = 30.0
HTTP_MAX_ATTEMPTS = 3
HTTP_BACKOFF_BASE_S = 1.0


class Settings(BaseSettings):
    """Environment-driven configuration."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    admin_token: str | None = None
    snapshot_dir: Path = BACKEND_DIR / "snapshot"
    cors_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "INFO"


def get_settings() -> Settings:
    return Settings()
