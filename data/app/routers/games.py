from fastapi import APIRouter, HTTPException

from app.routers.helpers import JsonModel, wrap_json
from app.schemas.live import PlayByPlayResponse
from app.services import boxscore, game_depth, live

router = APIRouter(prefix="/games", tags=["games"])

VALID_VARIANTS = {
    "advanced",
    "scoring",
    "fourfactors",
    "usage",
    "hustle",
    "playertrack",
    "traditional",
}


@router.get("/{game_id}/boxscore/{variant}", response_model=JsonModel)
async def get_boxscore_variant(game_id: str, variant: str):
    key = variant.strip().lower()
    if key not in VALID_VARIANTS:
        valid = ", ".join(sorted(VALID_VARIANTS))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid variant '{variant}'. Expected one of: {valid}",
        )
    return await wrap_json(boxscore.fetch_boxscore(game_id=game_id, measure=key))


@router.get("/{game_id}/summary", response_model=JsonModel)
async def get_summary(game_id: str):
    return await wrap_json(game_depth.fetch_game_summary(game_id))


@router.get("/{game_id}/win-probability", response_model=JsonModel)
async def get_win_probability(game_id: str):
    return await wrap_json(game_depth.fetch_win_probability(game_id))


@router.get("/{game_id}/rotation", response_model=JsonModel)
async def get_rotation(game_id: str):
    return await wrap_json(game_depth.fetch_rotation(game_id))


@router.get("/{game_id}/play-by-play", response_model=PlayByPlayResponse)
async def get_play_by_play(game_id: str):
    try:
        return await live.getPlayByPlay(game_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
