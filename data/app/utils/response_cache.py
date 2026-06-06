"""In-memory TTL cache for FastAPI JSON responses (survives Spring cache misses)."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Mapping

from app.cache_config import MAX_CACHE_ENTRIES, CacheTier
from app.utils.season import nba_today_iso

logger = logging.getLogger(__name__)


@dataclass
class _Entry:
    expires_at: float
    value: Any


def _is_live_scoreboard_date(date: str | None) -> bool:
    if date is None or not str(date).strip():
        return True
    return str(date).strip() == nba_today_iso()


def resolve_cache_ttl(path: str, query: Mapping[str, str]) -> float | None:
    """
    Return TTL seconds for this GET request, or None to bypass cache.
    Mirrors HoopLab backend CacheConfig tiers (live / semi-live / static / league-long).
    """
    if path in {"/", "/openapi.json", "/docs", "/redoc"}:
        return None
    if path.startswith("/health"):
        return None

    if path.startswith("/live/"):
        if path.rstrip("/").endswith("scoreboard"):
            date = query.get("date")
            if _is_live_scoreboard_date(date):
                return CacheTier.LIVE.ttl_seconds
            return CacheTier.GAME_FINAL.ttl_seconds
        # In-game feeds must not cache empty first responses (play-by-play, box score)
        if "/games/" in path:
            return None
        return CacheTier.LIVE.ttl_seconds

    if path == "/fetch/scoreboard":
        game_date = query.get("game_date")
        if _is_live_scoreboard_date(game_date):
            return CacheTier.LIVE.ttl_seconds
        return CacheTier.GAME_FINAL.ttl_seconds

    if path == "/fetch/boxscore":
        return CacheTier.BOXSCORE.ttl_seconds

    if path.startswith("/league/"):
        name = path.split("/")[-1]
        if name in {"playoff-picture", "clutch", "estimated-metrics"}:
            return CacheTier.SEMI_LIVE.ttl_seconds
        return CacheTier.LEAGUE_LONG.ttl_seconds

    if path in {
        "/fetch/players",
        "/fetch/teams",
        "/fetch/player-career",
        "/fetch/player-info",
    }:
        return CacheTier.STATIC.ttl_seconds

    if path in {"/fetch/team-roster", "/fetch/player-gamelog", "/fetch/team-gamelog"}:
        return CacheTier.STATIC.ttl_seconds

    if path.startswith("/player/"):
        tail = path.split("/")[-1]
        if tail in {"profile", "career", "awards"}:
            return CacheTier.PROFILE.ttl_seconds
        return CacheTier.SEMI_LIVE.ttl_seconds

    if path.startswith("/team/"):
        tail = path.split("/")[-1]
        if tail in {"year-by-year", "franchise-leaders"}:
            return CacheTier.PROFILE.ttl_seconds
        if tail in {"info", "roster"}:
            return CacheTier.STATIC.ttl_seconds
        return CacheTier.SEMI_LIVE.ttl_seconds

    if path.startswith("/games/"):
        if "/boxscore/" in path:
            return CacheTier.LIVE.ttl_seconds
        return CacheTier.GAME_FINAL.ttl_seconds

    if path.startswith("/compare/"):
        return CacheTier.SEMI_LIVE.ttl_seconds

    if path.startswith("/fetch/"):
        return CacheTier.SEMI_LIVE.ttl_seconds

    return CacheTier.SEMI_LIVE.ttl_seconds


class ResponseCache:
    def __init__(self) -> None:
        self._entries: dict[str, _Entry] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None
            if time.monotonic() >= entry.expires_at:
                del self._entries[key]
                return None
            return entry.value

    async def set(self, key: str, ttl_seconds: float, value: Any) -> None:
        async with self._lock:
            if len(self._entries) >= MAX_CACHE_ENTRIES and key not in self._entries:
                self._evict_expired_unlocked()
                if len(self._entries) >= MAX_CACHE_ENTRIES:
                    oldest_key = min(
                        self._entries,
                        key=lambda k: self._entries[k].expires_at,
                    )
                    del self._entries[oldest_key]
            self._entries[key] = _Entry(time.monotonic() + ttl_seconds, value)

    def _evict_expired_unlocked(self) -> None:
        now = time.monotonic()
        expired = [k for k, e in self._entries.items() if now >= e.expires_at]
        for key in expired:
            del self._entries[key]


response_cache = ResponseCache()
