from typing import Optional

from fastapi import APIRouter, Query

from app.routers.helpers import (
    JsonModel,
    PlayersModel,
    RecordsModel,
    wrap_json,
    wrap_players,
    wrap_records,
)
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

router = APIRouter(prefix="/fetch", tags=["fetch"])


@router.get("/players", response_model=PlayersModel)
async def get_players():
    return await wrap_players(players.fetch_players())


async def _teams_payload():
    records = await teams.fetch_teams()
    return {"records": records}


@router.get("/teams", response_model=RecordsModel)
async def get_teams():
    return await wrap_records(_teams_payload())


@router.get("/player-season-stats", response_model=JsonModel)
async def get_player_season_stats(
    season: Optional[str] = Query(default=None),
    measure: str = Query(default="Base"),
):
    return await wrap_json(
        player_season_stats.fetch_player_season_stats(season=season, measure=measure)
    )


@router.get("/team-season-stats", response_model=JsonModel)
async def get_team_season_stats(
    season: Optional[str] = Query(default=None),
    measure: str = Query(default="Base"),
):
    return await wrap_json(
        team_season_stats.fetch_team_season_stats(season=season, measure=measure)
    )


@router.get("/leaders", response_model=JsonModel)
async def get_leaders(
    season: Optional[str] = Query(default=None),
    category: str = Query(default="PTS"),
):
    return await wrap_json(leaders.fetch_leaders(season=season, category=category))


@router.get("/player-career", response_model=JsonModel)
async def get_player_career(player_id: int = Query(...)):
    return await wrap_json(player_career.fetch_player_career(player_id=player_id))


@router.get("/player-info", response_model=JsonModel)
async def get_player_info(player_id: int = Query(...)):
    return await wrap_json(player_info.fetch_player_info(player_id=player_id))


@router.get("/player-gamelog", response_model=JsonModel)
async def get_player_gamelog(
    player_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    return await wrap_json(
        player_gamelog.fetch_player_gamelog(player_id=player_id, season=season)
    )


@router.get("/team-roster", response_model=JsonModel)
async def get_team_roster(
    team_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    return await wrap_json(team_roster.fetch_team_roster(team_id=team_id, season=season))


@router.get("/boxscore", response_model=JsonModel)
async def get_boxscore(
    game_id: str = Query(...),
    measure: str = Query(default="traditional"),
):
    return await wrap_json(boxscore.fetch_boxscore(game_id=game_id, measure=measure))


@router.get("/standings", response_model=JsonModel)
async def get_standings(season: Optional[str] = Query(default=None)):
    return await wrap_json(standings.fetch_standings(season=season))


@router.get("/games", response_model=JsonModel)
async def get_games(season: Optional[str] = Query(default=None)):
    return await wrap_json(games.fetch_games(season=season))


@router.get("/scoreboard", response_model=JsonModel)
async def get_scoreboard(game_date: str = Query(...)):
    return await wrap_json(scoreboard.fetch_scoreboard(game_date=game_date))


@router.get("/team-clutch", response_model=JsonModel)
async def get_team_clutch(
    season: Optional[str] = Query(default=None),
    measure: str = Query(default="Advanced"),
):
    return await wrap_json(clutch.fetch_team_clutch(season=season, measure=measure))


@router.get("/lineups", response_model=JsonModel)
async def get_lineups(
    season: Optional[str] = Query(default=None),
    team_id: Optional[int] = Query(default=None),
):
    return await wrap_json(lineups.fetch_lineups(season=season, team_id=team_id))


@router.get("/team-gamelog", response_model=JsonModel)
async def get_team_gamelog(
    team_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    return await wrap_json(
        team_gamelog.fetch_team_gamelog(team_id=team_id, season=season)
    )


@router.get("/shotchart", response_model=JsonModel)
async def get_shotchart(
    player_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    from fastapi import HTTPException

    from app.schemas.common import validate_json_object

    try:
        data = await shotchart.fetch_shotchart(player_id=player_id, season=season)
        validate_json_object(data)
        return data
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        import logging

        logging.getLogger(__name__).exception("Failed to fetch shot chart")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
