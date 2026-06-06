import asyncio
import logging
import time
from typing import Optional

from app.constants import NBA_API_MIN_DELAY_SECONDS

logger = logging.getLogger(__name__)

_last_call_time: Optional[float] = None
_lock = asyncio.Lock()


async def rate_limit() -> None:
    async with _lock:
        global _last_call_time

        current_time = time.time()

        if _last_call_time is not None:
            time_since_last_call = current_time - _last_call_time
            if time_since_last_call < NBA_API_MIN_DELAY_SECONDS:
                await asyncio.sleep(NBA_API_MIN_DELAY_SECONDS - time_since_last_call)

        _last_call_time = time.time()
