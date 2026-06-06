"""HTTP middleware for the data service."""

import json
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.utils.response_cache import resolve_cache_ttl, response_cache

logger = logging.getLogger(__name__)


class ResponseCacheMiddleware(BaseHTTPMiddleware):
    """Cache GET JSON responses so repeated Spring calls skip nba_api, per the configured TTLs."""

    async def dispatch(self, request: Request, call_next):
        if request.method != "GET":
            return await call_next(request)

        ttl = resolve_cache_ttl(request.url.path, request.query_params)
        if ttl is None:
            return await call_next(request)

        cache_key = request.url.path
        if request.url.query:
            cache_key = f"{cache_key}?{request.url.query}"

        cached = await response_cache.get(cache_key)
        if cached is not None:
            return JSONResponse(content=cached, headers={"X-Cache": "HIT"})

        response = await call_next(request)
        if response.status_code != 200:
            return response

        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        try:
            payload = json.loads(body)
            await response_cache.set(cache_key, ttl, payload)
        except json.JSONDecodeError:
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        headers = {k: v for k, v in response.headers.items() if k.lower() != "content-length"}
        headers["X-Cache"] = "MISS"
        return JSONResponse(content=payload, status_code=200, headers=headers)


class RejectWebSocketUpgradeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.headers.get("upgrade", "").lower() == "websocket":
            return JSONResponse(
                status_code=426,
                content={
                    "status": 426,
                    "message": (
                        "WebSocket is not supported on the data service. "
                        "Use Spring Boot at /ws/* (port 8080)."
                    ),
                    "path": str(request.url.path),
                },
            )
        return await call_next(request)
