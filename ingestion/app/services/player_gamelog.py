import logging
from typing import Optional

from nba_api.stats.endpoints import playergamelogs
from nba_api.stats.library.parameters import SeasonTypeAllStar

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_player_gamelog(
    player_id: int,
    season: Optional[str] = None,
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()

    gamelog_df = await call_nba_api(
        lambda: playergamelogs.PlayerGameLogs(
            player_id_nullable=player_id,
            season_nullable=season,
            season_type_nullable=SeasonTypeAllStar.regular,
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=30.0,
    )

    records = dataframe_to_records(gamelog_df)
    logger.info(
        "Fetched %s game log rows for player %s (%s)",
        len(records),
        player_id,
        season,
    )

    return {
        "player_id": player_id,
        "season": season,
        "records": records,
    }
