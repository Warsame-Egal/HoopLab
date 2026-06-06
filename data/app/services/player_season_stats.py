import logging
from typing import Optional

from nba_api.stats.endpoints import leaguedashplayerstats
from nba_api.stats.library.parameters import (
    MeasureTypeDetailed,
    PerModeDetailed,
    SeasonTypeAllStar,
)

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)

MEASURE_TYPES = {
    "base": MeasureTypeDetailed.base,
    "advanced": MeasureTypeDetailed.advanced,
    "misc": MeasureTypeDetailed.misc,
    "four factors": MeasureTypeDetailed.four_factors,
    "scoring": MeasureTypeDetailed.scoring,
    "opponent": MeasureTypeDetailed.opponent,
    "usage": MeasureTypeDetailed.usage,
}


def _resolve_measure(measure: str) -> MeasureTypeDetailed:
    key = measure.strip().lower()
    if key not in MEASURE_TYPES:
        valid = ", ".join(sorted(MEASURE_TYPES))
        raise ValueError(f"Invalid measure '{measure}'. Expected one of: {valid}")
    return MEASURE_TYPES[key]


async def fetch_player_season_stats(
    season: Optional[str] = None,
    measure: str = "Base",
) -> dict:
    season = validate_season(season or get_current_season())
    measure_type = _resolve_measure(measure)
    endpoint_config = merge_endpoint_config()

    stats_df = await call_nba_api(
        lambda: leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            measure_type_detailed_defense=measure_type,
            per_mode_detailed=PerModeDetailed.per_game,
            season_type_all_star=SeasonTypeAllStar.regular,
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=45.0,
    )

    records = dataframe_to_records(stats_df)
    logger.info(
        "Fetched %s player season stat rows for %s (%s)",
        len(records),
        season,
        measure,
    )

    return {
        "season": season,
        "measure": measure,
        "records": records,
    }
