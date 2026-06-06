import logging

from nba_api.stats.endpoints import (
    boxscoresummaryv3,
    gamerotation,
    winprobabilitypbp,
)

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config

logger = logging.getLogger(__name__)


async def fetch_game_summary(game_id: str) -> dict:
    game_id = str(game_id).zfill(10)
    config = merge_endpoint_config()
    raw = await call_nba_api(
        lambda: boxscoresummaryv3.BoxScoreSummaryV3(
            game_id=game_id,
            **config,
        ).get_dict(),
        timeout=30.0,
    )
    return {"game_id": game_id, "summary": raw}


async def fetch_win_probability(game_id: str) -> dict:
    game_id = str(game_id).zfill(10)
    config = merge_endpoint_config()
    records: list[dict] = []
    try:
        df = await call_nba_api(
            lambda: winprobabilitypbp.WinProbabilityPBP(
                game_id=game_id,
                **config,
            ).get_data_frames()[0],
            timeout=30.0,
        )
        records = dataframe_to_records(df)
    except Exception as exc:
        logger.warning("Win probability unavailable for %s: %s", game_id, exc)
    return {"game_id": game_id, "records": records}


async def fetch_rotation(game_id: str) -> dict:
    game_id = str(game_id).zfill(10)
    config = merge_endpoint_config()
    df = await call_nba_api(
        lambda: gamerotation.GameRotation(
            game_id=game_id,
            **config,
        ).get_data_frames()[0],
        timeout=30.0,
    )
    records = dataframe_to_records(df)
    return {"game_id": game_id, "records": records}
