from typing import Optional

from fastapi import APIRouter, Query

from app.routers.helpers import JsonModel, wrap_json
from app.services import league_features, lineups

router = APIRouter(prefix="/league", tags=["league"])


@router.get("/hustle", response_model=JsonModel)
async def get_hustle(
    season: Optional[str] = Query(default=None),
    entity: str = Query(default="player"),
):
    return await wrap_json(league_features.fetch_hustle(season=season, entity=entity))


@router.get("/shot-zones", response_model=JsonModel)
async def get_shot_zones(
    season: Optional[str] = Query(default=None),
    scope: str = Query(default="team"),
):
    return await wrap_json(league_features.fetch_shot_zones(season=season, scope=scope))


@router.get("/playtypes", response_model=JsonModel)
async def get_playtypes(
    team_id: int = Query(...),
    season: Optional[str] = Query(default=None),
):
    return await wrap_json(league_features.fetch_playtypes(team_id=team_id, season=season))


@router.get("/playoff-picture", response_model=JsonModel)
async def get_playoff_picture(season: Optional[str] = Query(default=None)):
    return await wrap_json(league_features.fetch_playoff_picture(season=season))


@router.get("/estimated-metrics", response_model=JsonModel)
async def get_estimated_metrics(season: Optional[str] = Query(default=None)):
    return await wrap_json(league_features.fetch_estimated_metrics(season=season))


@router.get("/lineups", response_model=JsonModel)
async def get_top_lineups(
    season: Optional[str] = Query(default=None),
    team_id: Optional[int] = Query(default=None),
):
    return await wrap_json(lineups.fetch_lineups(season=season, team_id=team_id))
