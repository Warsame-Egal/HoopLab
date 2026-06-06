import re
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class PlayByPlayEvent(BaseModel):
    action_number: int
    clock: str
    period: int
    team_id: Optional[int] = None
    team_tricode: Optional[str] = None
    action_type: str
    description: str
    player_id: Optional[int] = None
    player_name: Optional[str] = None
    score_home: Optional[str] = None
    score_away: Optional[str] = None
    shot_result: Optional[str] = None


class PlayByPlayResponse(BaseModel):
    game_id: str = Field(..., pattern=r"^\d{10}$")
    plays: List[PlayByPlayEvent]


class Team(BaseModel):
    teamId: int
    teamName: str
    teamCity: str
    teamTricode: str
    wins: Optional[int] = None
    losses: Optional[int] = None
    score: Optional[int] = None
    timeoutsRemaining: Optional[int] = None


class LiveGame(BaseModel):
    gameId: str
    gameStatus: int
    gameStatusText: str
    period: int
    gameClock: Optional[str] = None
    gameTimeUTC: str
    homeTeam: Team
    awayTeam: Team
    gameLeaders: Optional[dict] = None

    @field_validator("gameStatusText", mode="before")
    @classmethod
    def clean_game_status_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("gameClock", mode="before")
    @classmethod
    def format_game_clock(cls, value: Optional[str]) -> Optional[str]:
        if value in (None, "null", ""):
            return None
        match = re.match(r"PT(\d+)M(\d+)", value)
        if match:
            minutes, seconds = match.groups()
            return f"{int(minutes)}:{seconds.zfill(2)}"
        return value


class Scoreboard(BaseModel):
    gameDate: str
    games: List[LiveGame]


class ScoreboardResponse(BaseModel):
    scoreboard: Scoreboard


class PlayerBoxScoreStats(BaseModel):
    player_id: int
    name: str
    position: str = "N/A"
    minutes: Optional[str] = None
    points: int
    rebounds: int
    assists: int
    steals: int
    blocks: int
    turnovers: int
    field_goals_made: Optional[int] = None
    field_goals_attempted: Optional[int] = None
    free_throws_made: Optional[int] = None
    free_throws_attempted: Optional[int] = None
    rebounds_offensive: Optional[int] = None
    rebounds_defensive: Optional[int] = None
    fouls_personal: Optional[int] = None


class TeamBoxScoreStats(BaseModel):
    team_id: int
    team_name: str
    score: int
    field_goal_pct: float
    three_point_pct: float
    free_throw_pct: float
    rebounds_total: int
    assists: int
    steals: int
    blocks: int
    turnovers: int
    players: List[PlayerBoxScoreStats]


class BoxScoreResponse(BaseModel):
    game_id: str = Field(..., pattern=r"^\d{10}$")
    status: str
    home_team: TeamBoxScoreStats
    away_team: TeamBoxScoreStats
