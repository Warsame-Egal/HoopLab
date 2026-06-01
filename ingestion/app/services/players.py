import logging

from nba_api.stats.endpoints import commonallplayers, playerindex
from nba_api.stats.library.parameters import HistoricalNullable, LeagueIDNullable

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season

logger = logging.getLogger(__name__)


async def fetch_players() -> dict:
    endpoint_config = merge_endpoint_config()

    index_df = await call_nba_api(
        lambda: playerindex.PlayerIndex(
            historical_nullable=HistoricalNullable.all_time,
            **endpoint_config,
        ).get_data_frames()[0]
    )
    index_records = dataframe_to_records(index_df)

    all_players_df = await call_nba_api(
        lambda: commonallplayers.CommonAllPlayers(
            is_only_current_season=0,
            league_id=LeagueIDNullable.nba,
            season=get_current_season(),
            **endpoint_config,
        ).get_data_frames()[0]
    )
    all_players_records = dataframe_to_records(all_players_df)

    logger.info(
        "Fetched %s player index rows and %s common-all-players rows",
        len(index_records),
        len(all_players_records),
    )

    return {
        "player_index": index_records,
        "common_all_players": all_players_records,
    }
