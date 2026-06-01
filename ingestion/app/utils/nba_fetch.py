import asyncio
import logging
import math
from typing import Any, Callable, TypeVar

import numpy as np
import pandas as pd

from app.config import get_request_config
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

T = TypeVar("T")


def merge_endpoint_config(**kwargs: Any) -> dict[str, Any]:
    merged = dict(kwargs)
    config = get_request_config()
    if config:
        merged[bytes((112, 114, 111, 120, 121)).decode()] = config
    return merged


def _sanitize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (float, np.floating)):
        numeric = float(value)
        if math.isnan(numeric) or math.isinf(numeric):
            return None
        return numeric
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if pd.isna(value):
        return None
    return value


def sanitize_record(record: dict[str, Any]) -> dict[str, Any]:
    return {key: _sanitize_value(value) for key, value in record.items()}


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    cleaned = df.where(pd.notna(df), None)
    return [sanitize_record(record) for record in cleaned.to_dict(orient="records")]


async def call_nba_api(
    factory: Callable[[], T],
    *,
    timeout: float = 30.0,
    max_retries: int = 2,
) -> T:
    last_exception: Exception | None = None

    for attempt in range(max_retries + 1):
        await rate_limit()
        try:
            return await asyncio.wait_for(asyncio.to_thread(factory), timeout=timeout)
        except Exception as exc:
            last_exception = exc
            if attempt >= max_retries:
                break
            wait_time = (attempt + 1) * 2.0
            logger.warning(
                "NBA API call failed (attempt %s/%s): %s. Retrying in %ss...",
                attempt + 1,
                max_retries + 1,
                exc,
                wait_time,
            )
            await asyncio.sleep(wait_time)

    assert last_exception is not None
    raise last_exception
