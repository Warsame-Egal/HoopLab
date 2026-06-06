from datetime import datetime
from unittest.mock import patch
from zoneinfo import ZoneInfo

from app.utils.nba_date import is_nba_today, nba_today_iso


def test_nba_today_uses_eastern_timezone():
    eastern = ZoneInfo("America/New_York")
    with patch("app.utils.nba_date.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 6, 3, 23, 30, tzinfo=eastern)
        assert nba_today_iso() == "2026-06-03"


def test_is_nba_today():
    with patch("app.utils.nba_date.nba_today_iso", return_value="2026-06-03"):
        assert is_nba_today("2026-06-03") is True
        assert is_nba_today("2026-06-04") is False
        assert is_nba_today(None) is True
