import logging
from typing import Optional

from nba_api.stats.endpoints import (
    franchiseleaders,
    teamdashboardbygeneralsplits,
    teamdashboardbyshootingsplits,
    teaminfocommon,
    teamplayeronoffsummary,
    teamyearbyyearstats,
)

from app.services import lineups, team_gamelog, team_roster
from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)

SPLIT_TYPES = {
    "general": teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits,
    "shooting": teamdashboardbyshootingsplits.TeamDashboardByShootingSplits,
}


async def fetch_info(team_id: int, season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    raw = await call_nba_api(
        lambda: teaminfocommon.TeamInfoCommon(
            team_id=team_id,
            season_nullable=season,
            season_type_nullable="Regular Season",
            **config,
        ).get_dict(),
        timeout=30.0,
    )
    return {"team_id": team_id, "season": season, "data": raw}


async def fetch_roster(team_id: int, season: Optional[str] = None) -> dict:
    return await team_roster.fetch_team_roster(team_id=team_id, season=season)


async def fetch_gamelog(team_id: int, season: Optional[str] = None) -> dict:
    return await team_gamelog.fetch_team_gamelog(team_id=team_id, season=season)


async def fetch_lineups(team_id: int, season: Optional[str] = None) -> dict:
    return await lineups.fetch_lineups(season=season, team_id=team_id)


async def fetch_year_by_year(team_id: int) -> dict:
    config = merge_endpoint_config()
    df = await call_nba_api(
        lambda: teamyearbyyearstats.TeamYearByYearStats(
            team_id=team_id,
            per_mode_simple="PerGame",
            **config,
        ).get_data_frames()[0],
        timeout=30.0,
    )
    records = dataframe_to_records(df)
    return {"team_id": team_id, "records": records}


async def fetch_splits(
    team_id: int,
    split_type: str = "general",
    season: Optional[str] = None,
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_cls = SPLIT_TYPES.get(split_type.strip().lower())
    if endpoint_cls is None:
        raise ValueError(f"Invalid split type. Expected one of: {', '.join(SPLIT_TYPES)}")
    config = merge_endpoint_config()
    frames = await call_nba_api(
        lambda: endpoint_cls(
            team_id=team_id,
            season=season,
            season_type_all_star="Regular Season",
            **config,
        ).get_data_frames(),
        timeout=45.0,
    )
    result_sets = []
    for i, df in enumerate(frames):
        records = dataframe_to_records(df)
        if records:
            result_sets.append({"index": i, "records": records})
    return {"team_id": team_id, "season": season, "type": split_type, "result_sets": result_sets}


async def fetch_on_off(team_id: int, season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    df = await call_nba_api(
        lambda: teamplayeronoffsummary.TeamPlayerOnOffSummary(
            team_id=team_id,
            season=season,
            season_type_all_star="Regular Season",
            **config,
        ).get_data_frames()[0],
        timeout=45.0,
    )
    records = dataframe_to_records(df)
    return {"team_id": team_id, "season": season, "records": records}


async def fetch_franchise_leaders(team_id: int) -> dict:
    config = merge_endpoint_config()
    frames = await call_nba_api(
        lambda: franchiseleaders.FranchiseLeaders(
            team_id=team_id,
            league_id_nullable="00",
            **config,
        ).get_data_frames(),
        timeout=30.0,
    )
    result_sets = []
    for i, df in enumerate(frames):
        records = dataframe_to_records(df)
        if records:
            result_sets.append({"index": i, "records": records})
    return {"team_id": team_id, "result_sets": result_sets}
