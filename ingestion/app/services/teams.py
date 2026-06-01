import logging

from nba_api.stats.endpoints import TeamDetails
from nba_api.stats.static import teams

from app.utils.nba_fetch import call_nba_api, merge_endpoint_config, sanitize_record

logger = logging.getLogger(__name__)


async def fetch_teams() -> list[dict]:
    endpoint_config = merge_endpoint_config()
    static_teams = teams.get_teams()
    enriched: list[dict] = []

    for team in static_teams:
        team_id = team["id"]
        details = await call_nba_api(
            lambda team_id=team_id: TeamDetails(team_id=team_id, **endpoint_config).get_dict(),
            timeout=15.0,
        )

        background = {}
        if details.get("resultSets"):
            headers = details["resultSets"][0]["headers"]
            rows = details["resultSets"][0]["rowSet"]
            if rows:
                background = dict(zip(headers, rows[0]))

        enriched.append(sanitize_record({
                "team_id": team_id,
                "abbreviation": team.get("abbreviation"),
                "city": team.get("city"),
                "name": team.get("nickname"),
                "full_name": team.get("full_name"),
                "state": team.get("state"),
                "year_founded": background.get("YEARFOUNDED") or team.get("year_founded"),
                "arena": background.get("ARENA"),
                "arena_capacity": background.get("ARENACAPACITY"),
                "owner": background.get("OWNER"),
                "general_manager": background.get("GENERALMANAGER"),
                "head_coach": background.get("HEADCOACH"),
            }))

    logger.info("Fetched %s teams", len(enriched))
    return enriched
