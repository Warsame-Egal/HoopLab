from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_rejects_websocket_upgrade_on_data_service():
    response = client.get(
        "/live/scoreboard",
        headers={
            "connection": "Upgrade",
            "upgrade": "websocket",
            "sec-websocket-version": "13",
            "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==",
        },
    )
    assert response.status_code == 426
    body = response.json()
    assert "not supported" in body["message"].lower()
