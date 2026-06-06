import logging
from typing import Optional

from nba_api.stats.endpoints import playercompare

from app.services import player_season_stats, team_season_stats
from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def _season_player_rows(player_ids: list[int], season: str) -> list[dict]:
    payload = await player_season_stats.fetch_player_season_stats(
        season=season, measure="Advanced"
    )
    id_set = set(player_ids)
    return [row for row in payload.get("records", []) if row.get("PLAYER_ID") in id_set]


async def _season_team_rows(team_ids: list[int], season: str) -> list[dict]:
    payload = await team_season_stats.fetch_team_season_stats(
        season=season, measure="Advanced"
    )
    id_set = set(team_ids)
    return [row for row in payload.get("records", []) if row.get("TEAM_ID") in id_set]


async def fetch_compare_players(
    player_ids: list[int],
    season: Optional[str] = None,
) -> dict:
    if len(player_ids) < 2:
        raise ValueError("At least two player ids required")
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    records: list[dict] = []
    try:
        df = await call_nba_api(
            lambda: playercompare.PlayerCompare(
                vs_player_id_list=",".join(str(pid) for pid in player_ids[1:]),
                player_id_list=str(player_ids[0]),
                season=season,
                **config,
            ).get_data_frames()[0],
            timeout=45.0,
        )
        records = dataframe_to_records(df)
    except Exception as exc:
        logger.warning(
            "PlayerCompare unavailable for %s (%s); using season stats fallback",
            player_ids,
            exc,
        )
        records = await _season_player_rows(player_ids, season)
    return {"season": season, "player_ids": player_ids, "records": records}


async def fetch_compare_teams(
    team_ids: list[int],
    season: Optional[str] = None,
) -> dict:
    if len(team_ids) < 2:
        raise ValueError("At least two team ids required")
    season = validate_season(season or get_current_season())
    records = await _season_team_rows(team_ids, season)
    return {"season": season, "team_ids": team_ids, "records": records}
