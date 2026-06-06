from typing import Optional

from fastapi import APIRouter, Query

from app.routers.helpers import JsonModel, wrap_json
from app.services import player_depth

router = APIRouter(prefix="/player", tags=["player"])


@router.get("/{player_id}/profile", response_model=JsonModel)
async def profile(player_id: int):
    return await wrap_json(player_depth.fetch_profile(player_id))


@router.get("/{player_id}/career", response_model=JsonModel)
async def career(player_id: int):
    return await wrap_json(player_depth.fetch_career(player_id))


@router.get("/{player_id}/gamelog", response_model=JsonModel)
async def gamelog(player_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(player_depth.fetch_gamelog(player_id, season))


@router.get("/{player_id}/shotchart", response_model=JsonModel)
async def shotchart(player_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(player_depth.fetch_shotchart(player_id, season))


@router.get("/{player_id}/awards", response_model=JsonModel)
async def awards(player_id: int):
    return await wrap_json(player_depth.fetch_awards(player_id))


@router.get("/{player_id}/next-games", response_model=JsonModel)
async def next_games(player_id: int):
    return await wrap_json(player_depth.fetch_next_games(player_id))


@router.get("/{player_id}/splits", response_model=JsonModel)
async def splits(
    player_id: int,
    type: str = Query(default="general"),
    season: Optional[str] = Query(default=None),
):
    return await wrap_json(player_depth.fetch_splits(player_id, type, season))


@router.get("/{player_id}/estimated-metrics", response_model=JsonModel)
async def estimated(player_id: int, season: Optional[str] = Query(default=None)):
    return await wrap_json(player_depth.fetch_estimated_metrics(player_id, season))
