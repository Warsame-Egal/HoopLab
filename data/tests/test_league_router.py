from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_league_hustle_route():
    with patch(
        "app.routers.league.league_features.fetch_hustle",
        new_callable=AsyncMock,
        return_value={"season": "2024-25", "type": "player", "records": []},
    ):
        r = client.get("/league/hustle?season=2024-25")
    assert r.status_code == 200
    assert "records" in r.json()


def test_games_boxscore_variant_route():
    with patch(
        "app.routers.games.boxscore.fetch_boxscore",
        new_callable=AsyncMock,
        return_value={
            "game_id": "0022500001",
            "measure": "advanced",
            "player_stats": [],
            "team_stats": [],
        },
    ):
        r = client.get("/games/0022500001/boxscore/advanced")
    assert r.status_code == 200
    assert r.json()["measure"] == "advanced"
