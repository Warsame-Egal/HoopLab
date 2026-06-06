import logging
from typing import Optional

from nba_api.stats.endpoints import leaguedashteamclutch
from nba_api.stats.library.parameters import (
    MeasureTypeDetailed,
    PerModeDetailed,
    SeasonTypeAllStar,
)

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_team_clutch(
    season: Optional[str] = None,
    measure: str = "Advanced",
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()
    measure_type = (
        MeasureTypeDetailed.advanced
        if measure.strip().lower() == "advanced"
        else MeasureTypeDetailed.base
    )

    clutch_df = await call_nba_api(
        lambda: leaguedashteamclutch.LeagueDashTeamClutch(
            season=season,
            measure_type_detailed_defense=measure_type,
            per_mode_detailed=PerModeDetailed.per_game,
            season_type_all_star=SeasonTypeAllStar.regular,
            league_id_nullable="00",
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=45.0,
    )

    records = dataframe_to_records(clutch_df)
    logger.info("Fetched %s clutch rows for %s (%s)", len(records), season, measure)

    return {
        "season": season,
        "measure": measure,
        "records": records,
    }
