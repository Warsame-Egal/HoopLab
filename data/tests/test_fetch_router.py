from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_fetch_leaders_returns_json():
    payload = {"season": "2024-25", "category": "PTS", "records": [{"PLAYER": "Test"}]}
    with patch("app.services.leaders.fetch_leaders", new=AsyncMock(return_value=payload)):
        response = client.get("/fetch/leaders?category=PTS")
    assert response.status_code == 200
    body = response.json()
    assert body["records"][0]["PLAYER"] == "Test"


def test_fetch_teams_returns_records_envelope():
    with patch("app.services.teams.fetch_teams", new=AsyncMock(return_value=[{"TEAM_ID": 1}])):
        response = client.get("/fetch/teams")
    assert response.status_code == 200
    assert response.json()["records"][0]["TEAM_ID"] == 1
