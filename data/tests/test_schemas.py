import pytest
from pydantic import ValidationError

from app.schemas.common import NBAJsonResponse, PlayersIndexResponse, RecordsResponse
from app.schemas.live import PlayByPlayResponse, ScoreboardResponse


def test_records_response_accepts_rows():
    model = RecordsResponse.model_validate({"records": [{"TEAM_ID": 1, "W": 40}]})
    assert len(model.records) == 1


def test_players_index_response():
    model = PlayersIndexResponse.model_validate(
        {"player_index": [{"PLAYER_ID": 1}], "common_all_players": [{"PERSON_ID": 1}]}
    )
    assert len(model.player_index) == 1


def test_nba_json_rejects_non_object():
    with pytest.raises(ValidationError):
        NBAJsonResponse.model_validate(["not", "a", "dict"])


def test_scoreboard_response_shape():
    ScoreboardResponse.model_validate(
        {
            "scoreboard": {
                "gameDate": "2025-01-15",
                "games": [],
            }
        }
    )


def test_play_by_play_response_shape():
    PlayByPlayResponse.model_validate({"game_id": "0022500001", "plays": []})
