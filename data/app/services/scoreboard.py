import logging

from nba_api.stats.endpoints import scoreboardv2

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config

logger = logging.getLogger(__name__)


async def fetch_scoreboard(game_date: str) -> dict:
    endpoint_config = merge_endpoint_config()

    frames = await call_nba_api(
        lambda: scoreboardv2.ScoreboardV2(
            game_date=game_date,
            league_id="00",
            day_offset=0,
            **endpoint_config,
        ).get_data_frames(),
        timeout=30.0,
    )

    game_header = dataframe_to_records(frames[0]) if len(frames) > 0 else []
    line_score = dataframe_to_records(frames[1]) if len(frames) > 1 else []

    logger.info("Fetched scoreboard for %s (%s games)", game_date, len(game_header))

    return {
        "game_date": game_date,
        "game_header": game_header,
        "line_score": line_score,
    }
