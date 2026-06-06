from typing import Optional

from fastapi import APIRouter, Query

from app.routers.helpers import JsonModel, wrap_json
from app.services import team_depth

router = APIRouter(prefix="/team", tags=["team"])


@router.get("/{team_id}/info", response_model=JsonModel)
async def info(team_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(team_depth.fetch_info(team_id, season))


@router.get("/{team_id}/roster", response_model=JsonModel)
async def roster(team_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(team_depth.fetch_roster(team_id, season))


@router.get("/{team_id}/gamelog", response_model=JsonModel)
async def gamelog(team_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(team_depth.fetch_gamelog(team_id, season))


@router.get("/{team_id}/lineups", response_model=JsonModel)
async def team_lineups(team_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(team_depth.fetch_lineups(team_id, season))


@router.get("/{team_id}/year-by-year", response_model=JsonModel)
async def year_by_year(team_id: int):
    return await wrap_json(team_depth.fetch_year_by_year(team_id))


@router.get("/{team_id}/splits", response_model=JsonModel)
async def splits(
    team_id: int,
    type: str = Query(default="general"),
    season: Optional[str] = Query(default=None),
):
    return await wrap_json(team_depth.fetch_splits(team_id, type, season))


@router.get("/{team_id}/on-off", response_model=JsonModel)
async def on_off(team_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(team_depth.fetch_on_off(team_id, season))


@router.get("/{team_id}/franchise-leaders", response_model=JsonModel)
async def franchise_leaders(team_id: int):
    return await wrap_json(team_depth.fetch_franchise_leaders(team_id))
