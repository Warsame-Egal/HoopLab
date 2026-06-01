import logging
from typing import Optional

from nba_api.stats.endpoints import commonteamroster

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_team_roster(
    team_id: int,
    season: Optional[str] = None,
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()

    frames = await call_nba_api(
        lambda: commonteamroster.CommonTeamRoster(
            team_id=team_id,
            season=season,
            **endpoint_config,
        ).get_data_frames(),
        timeout=30.0,
    )

    players = dataframe_to_records(frames[0]) if len(frames) > 0 else []
    coaches = dataframe_to_records(frames[1]) if len(frames) > 1 else []

    logger.info(
        "Fetched roster for team %s (%s): %s players, %s coaches",
        team_id,
        season,
        len(players),
        len(coaches),
    )

    return {
        "team_id": team_id,
        "season": season,
        "players": players,
        "coaches": coaches,
    }
