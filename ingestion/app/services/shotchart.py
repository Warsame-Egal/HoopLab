import logging
from typing import Optional

from nba_api.stats.endpoints import playerindex, shotchartdetail
from nba_api.stats.library.parameters import ContextMeasureSimple, SeasonTypeAllStar

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config
from app.utils.season import get_current_season, validate_season

logger = logging.getLogger(__name__)


async def _resolve_team_id(player_id: int, endpoint_config: dict) -> int:
    index_df = await call_nba_api(
        lambda: playerindex.PlayerIndex(**endpoint_config).get_data_frames()[0],
        timeout=30.0,
    )
    player_rows = index_df[index_df["PERSON_ID"] == player_id]
    if player_rows.empty:
        raise ValueError(f"Player not found: {player_id}")

    team_id = player_rows.iloc[0].get("TEAM_ID")
    if team_id is None or (isinstance(team_id, float) and team_id != team_id):
        raise ValueError(f"No team found for player {player_id}")

    return int(team_id)


async def fetch_shotchart(
    player_id: int,
    season: Optional[str] = None,
) -> dict:
    season = validate_season(season or get_current_season())
    endpoint_config = merge_endpoint_config()
    team_id = await _resolve_team_id(player_id, endpoint_config)

    shotchart_df = await call_nba_api(
        lambda: shotchartdetail.ShotChartDetail(
            team_id=team_id,
            player_id=player_id,
            season_nullable=season,
            season_type_all_star=SeasonTypeAllStar.regular,
            context_measure_simple=ContextMeasureSimple.fga,
            **endpoint_config,
        ).get_data_frames()[0],
        timeout=45.0,
    )

    records = dataframe_to_records(shotchart_df)
    logger.info(
        "Fetched %s shot chart rows for player %s (%s)",
        len(records),
        player_id,
        season,
    )

    return {
        "player_id": player_id,
        "team_id": team_id,
        "season": season,
        "records": records,
    }
