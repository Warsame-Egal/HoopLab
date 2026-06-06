from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.live import BoxScoreResponse, PlayByPlayResponse, ScoreboardResponse

client = TestClient(app)

SAMPLE_SCOREBOARD = ScoreboardResponse.model_validate(
    {
        "scoreboard": {
            "gameDate": "2025-01-15",
            "games": [],
        }
    }
)

SAMPLE_PBP = PlayByPlayResponse.model_validate({"game_id": "0022500001", "plays": []})

SAMPLE_BOX = BoxScoreResponse.model_validate(
    {
        "game_id": "0022500001",
        "status": "Live",
        "home_team": {
            "team_id": 1,
            "team_name": "Home",
            "score": 0,
            "field_goal_pct": 0.0,
            "three_point_pct": 0.0,
            "free_throw_pct": 0.0,
            "rebounds_total": 0,
            "assists": 0,
            "steals": 0,
            "blocks": 0,
            "turnovers": 0,
            "players": [],
        },
        "away_team": {
            "team_id": 2,
            "team_name": "Away",
            "score": 0,
            "field_goal_pct": 0.0,
            "three_point_pct": 0.0,
            "free_throw_pct": 0.0,
            "rebounds_total": 0,
            "assists": 0,
            "steals": 0,
            "blocks": 0,
            "turnovers": 0,
            "players": [],
        },
    }
)


@pytest.mark.parametrize(
    "path,mock_target,mock_return",
    [
        ("/live/scoreboard", "app.services.live.getScoreboard", SAMPLE_SCOREBOARD),
        (
            "/live/games/0022500001/play-by-play",
            "app.services.live.getPlayByPlay",
            SAMPLE_PBP,
        ),
        (
            "/live/games/0022500001/boxscore",
            "app.services.live.getBoxScore",
            SAMPLE_BOX,
        ),
    ],
)
def test_live_endpoints_return_json(path, mock_target, mock_return):
    with patch(mock_target, new=AsyncMock(return_value=mock_return)):
        response = client.get(path)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("application/json")
