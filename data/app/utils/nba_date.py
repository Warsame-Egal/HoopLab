"""NBA schedule dates use US Eastern (America/New_York), not UTC."""

from datetime import datetime
from zoneinfo import ZoneInfo

NBA_TZ = ZoneInfo("America/New_York")


def nba_today_iso() -> str:
    return datetime.now(NBA_TZ).date().isoformat()


def is_nba_today(game_date: str | None) -> bool:
    if not game_date:
        return True
    return game_date == nba_today_iso()
