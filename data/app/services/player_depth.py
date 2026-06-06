import logging
from typing import Optional

from nba_api.stats.endpoints import (
    playerawards,
    playerdashboardbyclutch,
    playerdashboardbygeneralsplits,
    playerdashboardbyshootingsplits,
    playerestimatedmetrics,
    playernextngames,
)

from app.services import player_career, player_gamelog, player_info, shotchart
from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)

_PLAYER_SPLIT_KWARGS = {"season_type_playoffs": "Regular Season"}

SPLIT_TYPES = {
    "general": playerdashboardbygeneralsplits.PlayerDashboardByGeneralSplits,
    "shooting": playerdashboardbyshootingsplits.PlayerDashboardByShootingSplits,
    "clutch": playerdashboardbyclutch.PlayerDashboardByClutch,
}


async def fetch_profile(player_id: int) -> dict:
    return await player_info.fetch_player_info(player_id=player_id)


async def fetch_career(player_id: int) -> dict:
    return await player_career.fetch_player_career(player_id=player_id)


async def fetch_gamelog(player_id: int, season: Optional[str] = None) -> dict:
    return await player_gamelog.fetch_player_gamelog(player_id=player_id, season=season)


async def fetch_shotchart(player_id: int, season: Optional[str] = None) -> dict:
    return await shotchart.fetch_shotchart(player_id=player_id, season=season)


async def fetch_awards(player_id: int) -> dict:
    config = merge_endpoint_config()
    frames = await call_nba_api(
        lambda: playerawards.PlayerAwards(player_id=player_id, **config).get_data_frames(),
        timeout=30.0,
    )
    records = dataframe_to_records(frames[0]) if frames else []
    return {"player_id": player_id, "records": records}


async def fetch_next_games(player_id: int) -> dict:
    config = merge_endpoint_config()
    frames = await call_nba_api(
        lambda: playernextngames.PlayerNextNGames(
            player_id=player_id,
            number_of_games=5,
            **config,
        ).get_data_frames(),
        timeout=30.0,
    )
    records = dataframe_to_records(frames[0]) if frames else []
    return {"player_id": player_id, "records": records}


async def fetch_splits(
    player_id: int,
    split_type: str = "general",
    season: Optional[str] = None,
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_cls = SPLIT_TYPES.get(split_type.strip().lower())
    if endpoint_cls is None:
        raise ValueError(f"Invalid split type. Expected one of: {', '.join(SPLIT_TYPES)}")
    config = merge_endpoint_config()
    try:
        frames = await call_nba_api(
            lambda: endpoint_cls(
                player_id=player_id,
                season=season,
                **_PLAYER_SPLIT_KWARGS,
                **config,
            ).get_data_frames(),
            timeout=45.0,
        )
    except Exception as exc:
        logger.warning(
            "Player splits unavailable for %s type=%s (%s): %s",
            player_id,
            split_type,
            season,
            exc,
        )
        frames = []
    result_sets = []
    for i, df in enumerate(frames):
        records = dataframe_to_records(df)
        if records:
            result_sets.append({"index": i, "records": records})
    return {
        "player_id": player_id,
        "season": season,
        "type": split_type,
        "result_sets": result_sets,
    }


async def fetch_estimated_metrics(player_id: int, season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    df = await call_nba_api(
        lambda: playerestimatedmetrics.PlayerEstimatedMetrics(
            season=season,
            season_type="Regular Season",
            **config,
        ).get_data_frames()[0],
        timeout=30.0,
    )
    records = [
        row for row in dataframe_to_records(df) if row.get("PLAYER_ID") == player_id
    ]
    return {"player_id": player_id, "season": season, "records": records}
