"""DataFrame -> JSON-ready records: native Python types, nulls instead of NaN/NaT."""

from datetime import datetime
from typing import Any

import pandas as pd


def frame_records(frame: pd.DataFrame, columns: list[str]) -> list[dict[str, Any]]:
    """Rows of ``columns`` as dicts; missing values become ``None`` and timestamps stay UTC."""
    subset = frame[columns].astype(object)
    return subset.where(subset.notna(), None).to_dict("records")  # type: ignore[return-value]


def datetime_or_none(value: pd.Timestamp) -> datetime | None:
    return None if pd.isna(value) else value.to_pydatetime()
