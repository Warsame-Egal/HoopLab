
from app.config import get_api_kwargs


def test_get_api_kwargs_reads_nba_api_proxy(monkeypatch):
    monkeypatch.delenv("NBA_API_CONFIG", raising=False)
    monkeypatch.setenv("NBA_API_PROXY", "http://proxy.example:8080")
    from app import config

    config.api_config = config.ApiConfig()
    assert get_api_kwargs() == {"proxy": "http://proxy.example:8080"}
