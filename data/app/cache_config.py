"""TTL tiers aligned with HoopLab Spring CacheConfig / nba-scoreboard Caffeine caches."""

from enum import Enum


class CacheTier(Enum):
    """How long to cache a JSON response at the data layer."""

    LIVE = 5
    SEMI_LIVE = 10 * 60
    LEAGUE_LONG = 30 * 60
    STATIC = 60 * 60
    PROFILE = 6 * 60 * 60
    BOXSCORE = 24 * 60 * 60
    GAME_FINAL = 24 * 60 * 60

    @property
    def ttl_seconds(self) -> float:
        return float(self.value)


MAX_CACHE_ENTRIES = 500
