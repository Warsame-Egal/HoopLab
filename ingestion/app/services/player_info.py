import logging

from nba_api.stats.endpoints import commonplayerinfo

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config

logger = logging.getLogger(__name__)


async def fetch_player_info(player_id: int) -> dict:
    endpoint_config = merge_endpoint_config()

    info_df = await call_nba_api(
        lambda: commonplayerinfo.CommonPlayerInfo(
            player_id=player_id,
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=30.0,
    )

    records = dataframe_to_records(info_df)
    logger.info("Fetched player info for player %s (%s rows)", player_id, len(records))

    return {
        "player_id": player_id,
        "records": records,
    }
