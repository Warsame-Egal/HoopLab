from app.cache_config import CacheTier
from app.utils.response_cache import resolve_cache_ttl


def test_live_scoreboard_today_uses_short_ttl():
    ttl = resolve_cache_ttl("/live/scoreboard", {})
    assert ttl == CacheTier.LIVE.ttl_seconds


def test_historical_scoreboard_uses_long_ttl():
    ttl = resolve_cache_ttl("/live/scoreboard", {"date": "2024-01-15"})
    assert ttl == CacheTier.GAME_FINAL.ttl_seconds


def test_fetch_player_season_stats_semi_live():
    ttl = resolve_cache_ttl(
        "/fetch/player-season-stats",
        {"season": "2025-26", "measure": "Base"},
    )
    assert ttl == CacheTier.SEMI_LIVE.ttl_seconds


def test_league_hustle_long_ttl():
    ttl = resolve_cache_ttl("/league/hustle", {"season": "2025-26", "entity": "player"})
    assert ttl == CacheTier.LEAGUE_LONG.ttl_seconds


def test_health_not_cached():
    assert resolve_cache_ttl("/health", {}) is None


def test_live_game_feeds_not_cached():
    assert resolve_cache_ttl("/live/games/0042500401/play-by-play", {}) is None
    assert resolve_cache_ttl("/live/games/0042500401/boxscore", {}) is None


def test_cache_middleware_hit():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.middleware import ResponseCacheMiddleware
    from app.utils.response_cache import response_cache

    response_cache._entries.clear()

    app = FastAPI()
    app.add_middleware(ResponseCacheMiddleware)

    calls = {"n": 0}

    @app.get("/fetch/teams")
    async def teams():
        calls["n"] += 1
        return {"records": [{"id": 1}]}

    client = TestClient(app)
    r1 = client.get("/fetch/teams")
    r2 = client.get("/fetch/teams")
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.headers.get("X-Cache") == "MISS"
    assert r2.headers.get("X-Cache") == "HIT"
    assert calls["n"] == 1
