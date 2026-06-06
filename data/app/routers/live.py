from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.live import BoxScoreResponse, PlayByPlayResponse, ScoreboardResponse
from app.services import live

router = APIRouter(prefix="/live", tags=["live"])


@router.get("/scoreboard", response_model=ScoreboardResponse)
async def get_scoreboard(
    date: Optional[str] = Query(
        default=None, description="Game date YYYY-MM-DD. Defaults to today."
    ),
):
    try:
        return await live.getScoreboard(date)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/games/{game_id}/play-by-play", response_model=PlayByPlayResponse)
async def get_play_by_play(game_id: str):
    try:
        return await live.getPlayByPlay(game_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/games/{game_id}/boxscore", response_model=BoxScoreResponse)
async def get_boxscore(game_id: str):
    try:
        return await live.getBoxScore(game_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
