"""Raw Elexon JSON records -> typed, de-duplicated DataFrames (UTC timestamps, float MW)."""

import logging

import pandas as pd

from app.data.elexon_client import Record

logger = logging.getLogger(__name__)

ACTUAL_COLUMNS = ["startTime", "generation"]
FORECAST_COLUMNS = ["publishTime", "startTime", "generation"]


def actuals_to_frame(records: list[Record]) -> pd.DataFrame:
    """FUELHH records -> ``startTime``, ``generation``; the latest publish wins on duplicates."""
    frame = _to_frame(records, ["publishTime", *ACTUAL_COLUMNS])
    before = len(frame)
    frame = frame.sort_values("publishTime").drop_duplicates("startTime", keep="last")
    _warn_dropped("actuals", before - len(frame))
    return frame[ACTUAL_COLUMNS].sort_values("startTime").reset_index(drop=True)


def forecasts_to_frame(records: list[Record]) -> pd.DataFrame:
    """WINDFOR records -> ``publishTime``, ``startTime``, ``generation``, de-duplicated."""
    frame = _to_frame(records, FORECAST_COLUMNS)
    before = len(frame)
    frame = frame.drop_duplicates(["publishTime", "startTime"], keep="last")
    _warn_dropped("forecasts", before - len(frame))
    return frame[FORECAST_COLUMNS].sort_values(["publishTime", "startTime"]).reset_index(drop=True)


def _to_frame(records: list[Record], columns: list[str]) -> pd.DataFrame:
    frame = pd.DataFrame.from_records(records, columns=columns)
    for column in ("publishTime", "startTime"):
        if column in columns:
            frame[column] = pd.to_datetime(frame[column], utc=True)
    frame["generation"] = pd.to_numeric(frame["generation"], errors="coerce").astype("float64")
    return frame


def _warn_dropped(name: str, dropped: int) -> None:
    if dropped:
        logger.warning("Dropped %d duplicate %s rows", dropped, name)
