import time
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["health"])
_app_start_time = time.time()


@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "hooplab-data",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - _app_start_time),
    }
