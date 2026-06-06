import logging
from typing import Optional

from nba_api.stats.endpoints import leagueleaders
from nba_api.stats.library.parameters import (
    PerMode48,
    Scope,
    SeasonTypeAllStar,
    StatCategoryAbbreviation,
)

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {
    "pts": StatCategoryAbbreviation.pts,
    "reb": StatCategoryAbbreviation.reb,
    "ast": StatCategoryAbbreviation.ast,
    "stl": StatCategoryAbbreviation.stl,
    "blk": StatCategoryAbbreviation.blk,
    "fg_pct": StatCategoryAbbreviation.fg_pct,
    "fg3m": StatCategoryAbbreviation.fg3m,
    "fg3_pct": StatCategoryAbbreviation.fg3_pct,
    "oreb": StatCategoryAbbreviation.oreb,
    "dreb": StatCategoryAbbreviation.dreb,
    "tov": StatCategoryAbbreviation.tov,
}


def _resolve_category(category: str) -> StatCategoryAbbreviation:
    key = category.strip().lower()
    if key not in VALID_CATEGORIES:
        valid = ", ".join(sorted(VALID_CATEGORIES))
        raise ValueError(f"Invalid category '{category}'. Expected one of: {valid}")
    return VALID_CATEGORIES[key]


async def fetch_leaders(
    season: Optional[str] = None,
    category: str = "PTS",
) -> dict:
    season = validate_season(season or get_current_season())
    stat_category = _resolve_category(category)
    endpoint_config = merge_endpoint_config()

    leaders_df = await call_nba_api(
        lambda: leagueleaders.LeagueLeaders(
            season=season,
            stat_category_abbreviation=stat_category,
            per_mode48=PerMode48.totals,
            scope=Scope.rs,
            season_type_all_star=SeasonTypeAllStar.regular,
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=30.0,
    )

    records = dataframe_to_records(leaders_df)
    logger.info(
        "Fetched %s league leader rows for %s (%s)",
        len(records),
        season,
        category,
    )

    return {
        "season": season,
        "category": category.upper(),
        "records": records,
    }
