from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.routers.helpers import JsonModel, wrap_json
from app.services import compare as compare_service

router = APIRouter(prefix="/compare", tags=["compare"])


def _parse_ids(raw: str) -> list[int]:
    ids = []
    for part in raw.split(","):
        part = part.strip()
        if part:
            ids.append(int(part))
    return ids


@router.get("/players", response_model=JsonModel)
async def compare_players(
    ids: str = Query(..., description="Comma-separated player ids"),
    season: Optional[str] = Query(default=None),
):
    player_ids = _parse_ids(ids)
    if len(player_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two player ids")
    return await wrap_json(compare_service.fetch_compare_players(player_ids, season))


@router.get("/teams", response_model=JsonModel)
async def compare_teams(
    ids: str = Query(..., description="Comma-separated team ids"),
    season: Optional[str] = Query(default=None),
):
    team_ids = _parse_ids(ids)
    if len(team_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two team ids")
    return await wrap_json(compare_service.fetch_compare_teams(team_ids, season))
