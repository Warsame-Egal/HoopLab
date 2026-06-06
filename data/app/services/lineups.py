import logging
from typing import Optional

from nba_api.stats.endpoints import leaguedashlineups
from nba_api.stats.library.parameters import PerModeDetailed, SeasonTypeAllStar

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_lineups(
    season: Optional[str] = None,
    team_id: Optional[int] = None,
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()

    lineups_df = await call_nba_api(
        lambda: leaguedashlineups.LeagueDashLineups(
            season=season,
            group_quantity=5,
            measure_type_detailed_defense="Advanced",
            per_mode_detailed=PerModeDetailed.per_game,
            season_type_all_star=SeasonTypeAllStar.regular,
            team_id_nullable=team_id if team_id else "",
            league_id_nullable="00",
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=60.0,
    )

    records = dataframe_to_records(lineups_df)
    logger.info(
        "Fetched %s lineup rows for %s (team=%s)",
        len(records),
        season,
        team_id,
    )

    return {
        "season": season,
        "team_id": team_id,
        "records": records,
    }
