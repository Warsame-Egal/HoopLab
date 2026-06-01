import logging

from nba_api.stats.endpoints import playercareerstats

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config

logger = logging.getLogger(__name__)


async def fetch_player_career(player_id: int) -> dict:
    endpoint_config = merge_endpoint_config()

    career_df = await call_nba_api(
        lambda: playercareerstats.PlayerCareerStats(
            player_id=player_id,
            per_mode36="PerGame",
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=30.0,
    )

    records = dataframe_to_records(career_df)
    logger.info("Fetched %s career season rows for player %s", len(records), player_id)

    return {
        "player_id": player_id,
        "records": records,
    }
