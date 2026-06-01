import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services import (
    boxscore,
    clutch,
    games,
    leaders,
    lineups,
    player_career,
    player_gamelog,
    player_info,
    player_season_stats,
    players,
    scoreboard,
    shotchart,
    standings,
    team_gamelog,
    team_roster,
    team_season_stats,
    teams,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fetch", tags=["fetch"])


@router.get("/players")
async def get_players():
    try:
        return await players.fetch_players()
    except Exception as exc:
        logger.exception("Failed to fetch players")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/teams")
async def get_teams():
    try:
        records = await teams.fetch_teams()
        return {"records": records}
    except Exception as exc:
        logger.exception("Failed to fetch teams")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/player-season-stats")
async def get_player_season_stats(
    season: Optional[str] = Query(default=None),
    measure: str = Query(default="Base"),
):
    try:
        return await player_season_stats.fetch_player_season_stats(
            season=season,
            measure=measure,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch player season stats")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/team-season-stats")
async def get_team_season_stats(
    season: Optional[str] = Query(default=None),
    measure: str = Query(default="Base"),
):
    try:
        return await team_season_stats.fetch_team_season_stats(
            season=season,
            measure=measure,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch team season stats")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/leaders")
async def get_leaders(
    season: Optional[str] = Query(default=None),
    category: str = Query(default="PTS"),
):
    try:
        return await leaders.fetch_leaders(season=season, category=category)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch leaders")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/player-career")
async def get_player_career(player_id: int = Query(...)):
    try:
        return await player_career.fetch_player_career(player_id=player_id)
    except Exception as exc:
        logger.exception("Failed to fetch player career")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/player-info")
async def get_player_info(player_id: int = Query(...)):
    try:
        return await player_info.fetch_player_info(player_id=player_id)
    except Exception as exc:
        logger.exception("Failed to fetch player info")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/player-gamelog")
async def get_player_gamelog(
    player_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    try:
        return await player_gamelog.fetch_player_gamelog(
            player_id=player_id,
            season=season,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch player gamelog")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/team-roster")
async def get_team_roster(
    team_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    try:
        return await team_roster.fetch_team_roster(team_id=team_id, season=season)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch team roster")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/boxscore")
async def get_boxscore(
    game_id: str = Query(...),
    measure: str = Query(default="traditional"),
):
    try:
        return await boxscore.fetch_boxscore(game_id=game_id, measure=measure)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch box score")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/standings")
async def get_standings(season: Optional[str] = Query(default=None)):
    try:
        return await standings.fetch_standings(season=season)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch standings")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/games")
async def get_games(season: Optional[str] = Query(default=None)):
    try:
        return await games.fetch_games(season=season)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch games")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/scoreboard")
async def get_scoreboard(game_date: str = Query(...)):
    try:
        return await scoreboard.fetch_scoreboard(game_date=game_date)
    except Exception as exc:
        logger.exception("Failed to fetch scoreboard")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/team-clutch")
async def get_team_clutch(
    season: Optional[str] = Query(default=None),
    measure: str = Query(default="Advanced"),
):
    try:
        return await clutch.fetch_team_clutch(season=season, measure=measure)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch team clutch stats")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/lineups")
async def get_lineups(
    season: Optional[str] = Query(default=None),
    team_id: Optional[int] = Query(default=None),
):
    try:
        return await lineups.fetch_lineups(season=season, team_id=team_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch lineups")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/team-gamelog")
async def get_team_gamelog(
    team_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    try:
        return await team_gamelog.fetch_team_gamelog(
            team_id=team_id,
            season=season,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch team gamelog")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/shotchart")
async def get_shotchart(
    player_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    try:
        return await shotchart.fetch_shotchart(
            player_id=player_id,
            season=season,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch shot chart")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
