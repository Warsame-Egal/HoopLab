import re
from datetime import datetime
from zoneinfo import ZoneInfo

SEASON_RE = re.compile(r"^\d{4}-\d{2}$")
NBA_TZ = ZoneInfo("America/New_York")


def nba_today_iso() -> str:
    """Calendar date for the NBA schedule day (US Eastern)."""
    return datetime.now(NBA_TZ).date().isoformat()


def get_current_season() -> str:
    now = datetime.now()
    current_year = now.year
    current_month = now.month

    if current_month >= 10:
        return f"{current_year}-{(current_year + 1) % 100:02d}"
    return f"{current_year - 1}-{current_year % 100:02d}"


def validate_season(season: str) -> str:
    if not SEASON_RE.match(season):
        raise ValueError(f"Invalid season format '{season}'. Expected YYYY-YY.")
    return season
