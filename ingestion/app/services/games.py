import logging
from typing import Optional

from nba_api.stats.endpoints import leaguegamefinder

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_games(season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()

    games_df = await call_nba_api(
        lambda: leaguegamefinder.LeagueGameFinder(
            season_nullable=season,
            league_id_nullable="00",
            season_type_nullable="Regular Season",
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=60.0,
    )

    records = dataframe_to_records(games_df)
    logger.info("Fetched %s team-game rows for %s", len(records), season)

    return {
        "season": season,
        "records": records,
    }
