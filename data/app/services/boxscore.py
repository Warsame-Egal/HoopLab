import logging

from nba_api.stats.endpoints import (
    boxscoreadvancedv3,
    boxscorefourfactorsv3,
    boxscorehustlev2,
    boxscoreplayertrackv3,
    boxscorescoringv3,
    boxscoretraditionalv2,
    boxscoreusagev3,
)

from app.utils.nba_fetch import call_nba_api, dataframe_to_records, merge_endpoint_config

logger = logging.getLogger(__name__)


def _normalize_game_id(game_id: str) -> str:
    return str(game_id).zfill(10)


def _empty_boxscore_payload(game_id: str, measure: str) -> dict:
    return {
        "game_id": game_id,
        "measure": measure,
        "player_stats": [],
        "team_stats": [],
    }

# v3 endpoints use camelCase columns. We normalize to the uppercase keys the
# Spring backend already expects so the API contract stays stable.
_ADVANCED_RENAME = {
    "offensiveRating": "OFF_RATING",
    "defensiveRating": "DEF_RATING",
    "netRating": "NET_RATING",
    "assistPercentage": "AST_PCT",
    "reboundPercentage": "REB_PCT",
    "trueShootingPercentage": "TS_PCT",
    "usagePercentage": "USG_PCT",
    "pace": "PACE",
    "PIE": "PIE",
}

_SCORING_RENAME = {
    "percentageFieldGoalsAttempted": "PCT_FGA",
    "percentageFieldGoalsAttempted2pt": "PCT_FGA_2PT",
    "percentageFieldGoalsAttempted3pt": "PCT_FGA_3PT",
    "pointsFastBreak": "PTS_FB",
    "pointsInThePaint": "PTS_PAINT",
    "pointsOffTurnovers": "PTS_OFF_TOV",
    "pointsSecondChance": "PTS_2ND_CHANCE",
}

_USAGE_RENAME = {
    "usagePercentage": "USG_PCT",
    "pctFieldGoalsMade": "PCT_FGM",
    "pctFieldGoalsAttempted": "PCT_FGA",
    "pctThreePointersMade": "PCT_FG3M",
    "pctThreePointersAttempted": "PCT_FG3A",
    "pctFreeThrowsMade": "PCT_FTM",
    "pctFreeThrowsAttempted": "PCT_FTA",
    "pctReboundsOffensive": "PCT_OREB",
    "pctReboundsDefensive": "PCT_DREB",
    "pctReboundsTotal": "PCT_REB",
    "pctAssists": "PCT_AST",
    "pctTurnovers": "PCT_TOV",
    "pctSteals": "PCT_STL",
    "pctBlocks": "PCT_BLK",
}

_HUSTLE_RENAME = {
    "points": "PTS",
    "contestedShots": "CONTESTED_SHOTS",
    "contestedShots2pt": "CONTESTED_SHOTS_2PT",
    "contestedShots3pt": "CONTESTED_SHOTS_3PT",
    "deflections": "DEFLECTIONS",
    "chargesDrawn": "CHARGES_DRAWN",
    "screenAssists": "SCREEN_ASSISTS",
    "screenAssistPoints": "SCREEN_AST_PTS",
    "looseBallsRecoveredOffensive": "LOOSE_BALLS_RECOVERED_OFF",
    "looseBallsRecoveredDefensive": "LOOSE_BALLS_RECOVERED_DEF",
    "looseBallsRecoveredTotal": "LOOSE_BALLS_RECOVERED_TOTAL",
}

_PLAYER_TRACK_RENAME = {
    "speed": "SPEED",
    "distance": "DISTANCE",
    "touches": "TOUCHES",
    "passes": "PASSES",
    "secondaryAssists": "SECONDARY_AST",
    "freeThrowAssists": "FT_AST",
    "contestedFieldGoalsMade": "CONTESTED_FGM",
    "contestedFieldGoalsAttempted": "CONTESTED_FGA",
}

_FOUR_FACTORS_RENAME = {
    "effectiveFieldGoalPercentage": "EFG_PCT",
    "freeThrowAttemptRate": "FTA_RATE",
    "teamTurnoverPercentage": "TM_TOV_PCT",
    "offensiveReboundPercentage": "OREB_PCT",
    "oppEffectiveFieldGoalPercentage": "OPP_EFG_PCT",
    "oppFreeThrowAttemptRate": "OPP_FTA_RATE",
    "oppTeamTurnoverPercentage": "OPP_TOV_PCT",
    "oppOffensiveReboundPercentage": "OPP_OREB_PCT",
}


def _normalize_v3(records: list[dict], rename: dict[str, str], *, is_player: bool) -> list[dict]:
    normalized = []
    for row in records:
        out: dict = {
            "TEAM_ID": row.get("teamId"),
            "TEAM_ABBREVIATION": row.get("teamTricode"),
            "TEAM_NAME": row.get("teamName"),
        }
        if is_player:
            name = row.get("nameI")
            if not name:
                name = f"{row.get('firstName', '')} {row.get('familyName', '')}".strip()
            out["PLAYER_ID"] = row.get("personId")
            out["PLAYER_NAME"] = name
        for source, target in rename.items():
            out[target] = row.get(source)
        normalized.append(out)
    return normalized


async def _fetch_traditional(game_id: str) -> dict:
    endpoint_config = merge_endpoint_config()
    try:
        frames = await call_nba_api(
            lambda: boxscoretraditionalv2.BoxScoreTraditionalV2(
                game_id=game_id,
                **endpoint_config,
            ).get_data_frames(),
            timeout=30.0,
        )
    except Exception as e:
        logger.warning("Traditional box score failed for %s: %s", game_id, e)
        return {"player_stats": [], "team_stats": []}
    player_stats = dataframe_to_records(frames[0]) if len(frames) > 0 else []
    team_stats = dataframe_to_records(frames[1]) if len(frames) > 1 else []
    return {"player_stats": player_stats, "team_stats": team_stats}


async def _fetch_hustle_v2(game_id: str) -> dict:
    endpoint_config = merge_endpoint_config()
    try:
        frames = await call_nba_api(
            lambda: boxscorehustlev2.BoxScoreHustleV2(
                game_id=game_id,
                **endpoint_config,
            ).get_data_frames(),
            timeout=30.0,
        )
    except Exception as e:
        logger.warning("Hustle box score failed for %s: %s", game_id, e)
        return {"player_stats": [], "team_stats": []}
    players = dataframe_to_records(frames[0]) if len(frames) > 0 else []
    teams = dataframe_to_records(frames[1]) if len(frames) > 1 else []
    return {
        "player_stats": players,
        "team_stats": teams,
    }


async def _fetch_v3(game_id: str, endpoint_cls, rename: dict[str, str]) -> dict:
    endpoint_config = merge_endpoint_config()
    try:
        frames = await call_nba_api(
            lambda: endpoint_cls(
                game_id=game_id,
                **endpoint_config,
            ).get_data_frames(),
            timeout=30.0,
        )
    except Exception as e:
        logger.warning(
            "V3 box score (%s) failed for %s: %s",
            endpoint_cls.__name__,
            game_id,
            e,
        )
        return {"player_stats": [], "team_stats": []}
    players = dataframe_to_records(frames[0]) if len(frames) > 0 else []
    teams = dataframe_to_records(frames[1]) if len(frames) > 1 else []
    return {
        "player_stats": _normalize_v3(players, rename, is_player=True),
        "team_stats": _normalize_v3(teams, rename, is_player=False),
    }


async def fetch_boxscore(game_id: str, measure: str = "traditional") -> dict:
    game_id = _normalize_game_id(game_id)
    key = measure.strip().lower()
    if key == "traditional":
        data = await _fetch_traditional(game_id)
    elif key == "advanced":
        data = await _fetch_v3(game_id, boxscoreadvancedv3.BoxScoreAdvancedV3, _ADVANCED_RENAME)
    elif key == "fourfactors":
        data = await _fetch_v3(
            game_id, boxscorefourfactorsv3.BoxScoreFourFactorsV3, _FOUR_FACTORS_RENAME
        )
    elif key == "scoring":
        data = await _fetch_v3(game_id, boxscorescoringv3.BoxScoreScoringV3, _SCORING_RENAME)
    elif key == "usage":
        data = await _fetch_v3(game_id, boxscoreusagev3.BoxScoreUsageV3, _USAGE_RENAME)
    elif key in ("hustle", "playertrack"):
        if key == "hustle":
            data = await _fetch_hustle_v2(game_id)
        else:
            data = await _fetch_v3(
                game_id, boxscoreplayertrackv3.BoxScorePlayerTrackV3, _PLAYER_TRACK_RENAME
            )
    else:
        raise ValueError(
            f"Invalid measure '{measure}'. Expected one of: traditional, advanced, fourfactors, "
            "scoring, usage, hustle, playertrack"
        )

    logger.info(
        "Fetched %s box score for game %s (%s player rows, %s team rows)",
        key,
        game_id,
        len(data["player_stats"]),
        len(data["team_stats"]),
    )

    return {
        "game_id": game_id,
        "measure": key,
        "player_stats": data["player_stats"],
        "team_stats": data["team_stats"],
    }
