import logging
from typing import Optional

from nba_api.stats.endpoints import (
    leaguedashteamshotlocations,
    leaguehustlestatsplayer,
    leaguehustlestatsteam,
    playoffpicture,
    synergyplaytypes,
    teamestimatedmetrics,
)
from nba_api.stats.library.parameters import SeasonTypeAllStar
from nba_api.stats.static import teams as static_teams

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def fetch_hustle(season: Optional[str] = None, entity: str = "player") -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    if entity.strip().lower() == "team":
        df = await call_nba_api(
            lambda: leaguehustlestatsteam.LeagueHustleStatsTeam(
                season=season,
                season_type_all_star=SeasonTypeAllStar.regular,
                **config,
            ).get_data_frames()[0],
            timeout=45.0,
        )
    else:
        df = await call_nba_api(
            lambda: leaguehustlestatsplayer.LeagueHustleStatsPlayer(
                season=season,
                season_type_all_star=SeasonTypeAllStar.regular,
                **config,
            ).get_data_frames()[0],
            timeout=45.0,
        )
    records = dataframe_to_records(df)
    return {"season": season, "type": entity, "records": records}


async def fetch_shot_zones(season: Optional[str] = None, scope: str = "team") -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    df = await call_nba_api(
        lambda: leaguedashteamshotlocations.LeagueDashTeamShotLocations(
            season=season,
            season_type_all_star=SeasonTypeAllStar.regular,
            **config,
        ).get_data_frames()[0],
        timeout=60.0,
    )
    records = dataframe_to_records(df)
    return {"season": season, "scope": scope, "records": records}


def _team_abbreviation(team_id: int) -> str:
    for team in static_teams.get_teams():
        if team["id"] == team_id:
            return team["abbreviation"]
    raise ValueError(f"Unknown team id: {team_id}")


async def fetch_playtypes(team_id: int, season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    team_abbr = _team_abbreviation(team_id)
    config = merge_endpoint_config()
    records: list[dict] = []
    try:
        df = await call_nba_api(
            lambda: synergyplaytypes.SynergyPlayTypes(
                player_or_team_abbreviation=team_abbr,
                season=season,
                season_type_all_star=SeasonTypeAllStar.regular,
                type_grouping_nullable="offensive",
                per_mode_simple="PerGame",
                **config,
            ).get_data_frames()[0],
            timeout=45.0,
        )
        records = dataframe_to_records(df)
    except Exception as exc:
        logger.warning("Play types unavailable for team %s (%s): %s", team_id, season, exc)
    return {"season": season, "team_id": team_id, "records": records}


def _season_id(season: str) -> str:
    start_year = int(season.split("-")[0])
    return f"2{start_year}"


async def fetch_playoff_picture(season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    sid = _season_id(season)
    raw = await call_nba_api(
        lambda: playoffpicture.PlayoffPicture(
            league_id="00",
            season_id=sid,
            **config,
        ).get_dict(),
        timeout=45.0,
    )
    return {"season": season, "data": raw}


async def fetch_estimated_metrics(season: Optional[str] = None) -> dict:
    season = validate_season(season or get_current_season())
    config = merge_endpoint_config()
    df = await call_nba_api(
        lambda: teamestimatedmetrics.TeamEstimatedMetrics(
            season=season,
            season_type=SeasonTypeAllStar.regular,
            **config,
        ).get_data_frames()[0],
        timeout=45.0,
    )
    records = dataframe_to_records(df)
    return {"season": season, "records": records}
