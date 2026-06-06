import logging
from typing import Optional

from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.stats.static import teams

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_standings(season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()

    standings_df = await call_nba_api(
        lambda: leaguestandingsv3.LeagueStandingsV3(
            season=season,
            season_type="Regular Season",
            league_id="00",
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=45.0,
    )

    abbrev_by_id = {team["id"]: team["abbreviation"] for team in teams.get_teams()}
    records = dataframe_to_records(standings_df)
    for row in records:
        team_id = row.get("TeamID")
        if team_id is not None and not row.get("TeamAbbreviation"):
            row["TeamAbbreviation"] = abbrev_by_id.get(int(team_id))
    logger.info("Fetched %s standings rows for %s", len(records), season)

    return {
        "season": season,
        "records": records,
    }
