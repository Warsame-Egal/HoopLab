import asyncio
import json
import logging
import re
from typing import Dict, List, Optional

from fastapi import HTTPException
from nba_api.live.nba.endpoints import boxscore, playbyplay, scoreboard
from nba_api.stats.endpoints import (
    boxscoretraditionalv3,
    playbyplayv3,
    scoreboardv2,
    scoreboardv3,
)
from nba_api.stats.static import teams

from app.config import get_api_kwargs
from app.constants import (
    GAME_STATUS_FINAL,
    GAME_STATUS_LIVE,
    GAME_STATUS_SCHEDULED,
)
from app.schemas.live import (
    BoxScoreResponse,
    LiveGame,
    PlayByPlayEvent,
    PlayByPlayResponse,
    PlayerBoxScoreStats,
    Scoreboard,
    ScoreboardResponse,
    Team,
    TeamBoxScoreStats,
)
from app.utils.nba_date import is_nba_today, nba_today_iso
from app.utils.nba_fetch import call_live_nba_api, call_nba_api, merge_endpoint_config
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

_LIVE_STATUS_TEXT = re.compile(
    r"(live|in progress|halftime|overtime|\bq\s*\d\b|\bq\d\b|"
    r"\b[1-4](?:st|nd|rd|th)\s*q|\bqtr\b|quarter|\b ot\b)",
    re.IGNORECASE,
)


def _status_text_is_live(status_text: str) -> bool:
    text = (status_text or "").strip().lower()
    if not text or "final" in text:
        return False
    return _LIVE_STATUS_TEXT.search(text) is not None


def _infer_game_status(
    status_id: int,
    status_text: str,
    period: int,
    home_score: int,
    away_score: int,
) -> int:
    """Normalize NBA feeds where in-progress games may still report status 1."""
    text = (status_text or "").lower()
    if status_id == GAME_STATUS_FINAL or "final" in text:
        return GAME_STATUS_FINAL
    if status_id == GAME_STATUS_LIVE:
        return GAME_STATUS_LIVE
    if period > 0 and "final" not in text:
        return GAME_STATUS_LIVE
    if _status_text_is_live(status_text):
        return GAME_STATUS_LIVE
    if period > 0 and (home_score > 0 or away_score > 0):
        return GAME_STATUS_LIVE
    return status_id

NBA_TEAMS_BY_ID = {team["id"]: team for team in teams.get_teams()}
NBA_TEAM_ABBREV = {team["id"]: team["abbreviation"] for team in teams.get_teams()}

_BOXSCORE_UNAVAILABLE_DETAIL = (
    "Box score not available. The game may not have started, or NBA data is unavailable."
)


def _is_nba_empty_response_error(exc: Exception) -> bool:
    if isinstance(exc, json.JSONDecodeError):
        return True
    msg = str(exc).lower()
    return "expecting value" in msg or "line 1 column 1" in msg


def _parse_wins_losses(record: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    if not record or "-" not in str(record):
        return None, None
    parts = str(record).split("-", 1)
    try:
        return int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        return None, None


def _result_set(games_data: dict, name: str) -> Optional[dict]:
    for result in games_data.get("resultSets", []):
        if result.get("name") == name:
            return result
    return None


def _rows_as_dicts(result: Optional[dict]) -> List[dict]:
    if not result or "headers" not in result:
        return []
    headers = result["headers"]
    out = []
    for row in result.get("rowSet", []):
        if len(row) != len(headers):
            continue
        out.append(dict(zip(headers, row)))
    return out


def _build_line_score_index(games_data: dict) -> Dict[str, Dict[int, dict]]:
    index: Dict[str, Dict[int, dict]] = {}
    for row in _rows_as_dicts(_result_set(games_data, "LineScore")):
        game_id = str(row.get("GAME_ID", "")).zfill(10)
        team_id = row.get("TEAM_ID")
        if game_id and team_id is not None:
            index.setdefault(game_id, {})[int(team_id)] = row
    return index


def _team_from_line_score(team_id: int, line: Optional[dict]) -> Team:
    if line:
        wins, losses = _parse_wins_losses(line.get("TEAM_WINS_LOSSES"))
        return Team(
            teamId=team_id,
            teamName=line.get("TEAM_NAME") or NBA_TEAMS_BY_ID.get(team_id, {}).get(
                "nickname", "Unknown"
            ),
            teamCity=line.get("TEAM_CITY_NAME")
            or NBA_TEAMS_BY_ID.get(team_id, {}).get("city", ""),
            teamTricode=line.get("TEAM_ABBREVIATION")
            or NBA_TEAM_ABBREV.get(team_id, "UNK"),
            wins=wins,
            losses=losses,
            score=int(line.get("PTS") or 0),
            timeoutsRemaining=0,
        )
    meta = NBA_TEAMS_BY_ID.get(team_id, {})
    return Team(
        teamId=team_id,
        teamName=meta.get("nickname", "Unknown"),
        teamCity=meta.get("city", ""),
        teamTricode=meta.get("abbreviation", "UNK"),
        wins=None,
        losses=None,
        score=0,
        timeoutsRemaining=0,
    )


def _parse_gamecode_teams(game_code: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """NBA game codes look like 20260603/NYKSAS (away tricode + home tricode)."""
    if not game_code or "/" not in game_code:
        return None, None
    suffix = game_code.split("/", 1)[1].strip().upper()
    if len(suffix) < 6:
        return None, None
    away_tri = suffix[:3]
    home_tri = suffix[3:6]
    away_id = next(
        (tid for tid, meta in NBA_TEAMS_BY_ID.items() if meta.get("abbreviation") == away_tri),
        None,
    )
    home_id = next(
        (tid for tid, meta in NBA_TEAMS_BY_ID.items() if meta.get("abbreviation") == home_tri),
        None,
    )
    return away_id, home_id


def _live_game_from_v2_row(
    game_row: dict, line_index: Dict[str, Dict[int, dict]]
) -> Optional[LiveGame]:
    game_id = game_row.get("GAME_ID")
    if game_id is None:
        return None
    game_id_str = str(game_id).zfill(10)
    home_id = game_row.get("HOME_TEAM_ID")
    away_id = game_row.get("VISITOR_TEAM_ID")
    if home_id is not None:
        home_id = int(home_id)
    if away_id is not None:
        away_id = int(away_id)
    if home_id is None or away_id is None:
        code_away, code_home = _parse_gamecode_teams(game_row.get("GAMECODE"))
        line_ids = list(line_index.get(game_id_str, {}).keys())
        if away_id is None:
            away_id = code_away or (line_ids[0] if line_ids else None)
        if home_id is None:
            home_id = code_home
            if home_id is None and line_ids:
                other = [tid for tid in line_ids if tid != away_id]
                home_id = other[0] if other else None
    if home_id is None or away_id is None:
        return None
    lines = line_index.get(game_id_str, {})
    status_id = int(game_row.get("GAME_STATUS_ID") or GAME_STATUS_SCHEDULED)
    status_text = str(game_row.get("GAME_STATUS_TEXT") or "Unknown").strip()
    period = int(game_row.get("LIVE_PERIOD") or 0)
    if status_id == GAME_STATUS_FINAL and period == 0:
        period = 4
    game_clock = game_row.get("LIVE_PC_TIME") or None
    if game_clock in ("", " "):
        game_clock = None
    game_date_est = game_row.get("GAME_DATE_EST") or ""
    game_time_utc = str(game_date_est) if game_date_est else ""
    home_line = lines.get(home_id)
    away_line = lines.get(away_id)
    home_score = int((home_line or {}).get("PTS") or 0)
    away_score = int((away_line or {}).get("PTS") or 0)
    status_id = _infer_game_status(status_id, status_text, period, home_score, away_score)
    return LiveGame(
        gameId=game_id_str,
        gameStatus=status_id,
        gameStatusText=status_text,
        period=period,
        gameClock=game_clock,
        gameTimeUTC=game_time_utc,
        homeTeam=_team_from_line_score(home_id, lines.get(home_id)),
        awayTeam=_team_from_line_score(away_id, lines.get(away_id)),
        gameLeaders=None,
    )


async def fetch_scoreboard_v2(game_date: str) -> dict:
    def _call():
        return scoreboardv2.ScoreboardV2(
            game_date=game_date, **merge_endpoint_config()
        ).get_dict()

    return await call_nba_api(_call, timeout=30.0)


async def fetch_scoreboard_v3(game_date: str) -> dict:
    return await call_nba_api(
        lambda: scoreboardv3.ScoreboardV3(
            game_date=game_date,
            league_id="00",
            **merge_endpoint_config(),
        ).get_dict(),
        timeout=30.0,
    )


def _games_from_scoreboard_dict(
    raw_scoreboard: dict, fallback_date: str
) -> ScoreboardResponse:
    """Parse live or V3 scoreboard JSON (homeTeam / awayTeam on each game)."""
    if not raw_scoreboard:
        return ScoreboardResponse(
            scoreboard=Scoreboard(gameDate=fallback_date, games=[])
        )

    game_date = raw_scoreboard.get("gameDate") or fallback_date
    raw_games = raw_scoreboard.get("games") or []
    games: List[LiveGame] = []
    for game in raw_games:
        try:
            home_team = extract_team_data(game["homeTeam"])
            away_team = extract_team_data(game["awayTeam"])
            period = int(game.get("period") or 0)
            status_text = str(game["gameStatusText"]).strip()
            status_id = _infer_game_status(
                int(game["gameStatus"]),
                status_text,
                period,
                int(home_team.score or 0),
                int(away_team.score or 0),
            )
            games.append(
                LiveGame(
                    gameId=str(game["gameId"]).zfill(10),
                    gameStatus=status_id,
                    gameStatusText=status_text,
                    period=period,
                    gameClock=game.get("gameClock") or None,
                    gameTimeUTC=str(game.get("gameTimeUTC") or game.get("gameEt") or ""),
                    homeTeam=home_team,
                    awayTeam=away_team,
                    gameLeaders=game.get("gameLeaders"),
                )
            )
        except (KeyError, TypeError, ValueError) as e:
            logger.warning("Skipping game with incomplete data: %s", e)

    return ScoreboardResponse(
        scoreboard=Scoreboard(gameDate=game_date, games=games)
    )


async def fetch_nba_scoreboard():
    """
    Get the raw scoreboard data from the NBA API.
    Retries up to 3 times with 2s delay to avoid stale cache from transient failures.

    Returns:
        dict: Raw scoreboard data with all game information, or {} on failure
    """
    last_error = None
    for attempt in range(1, 4):
        try:
            board = await call_nba_api(
                lambda: scoreboard.ScoreBoard(**merge_endpoint_config()).get_dict(),
                timeout=15.0,
                max_retries=0,
            )
            out = board.get("scoreboard", {})
            if out:
                return out
            last_error = ValueError("Empty scoreboard in response")
        except asyncio.TimeoutError as e:
            last_error = e
            logger.warning(
                "Timeout fetching scoreboard from NBA API (attempt %s/3, timeout 15s)",
                attempt,
            )
        except (ValueError, KeyError) as e:
            err_str = str(e)
            if "Expecting value" in err_str or "line 1 column 1" in err_str:
                logger.info("NBA API returned empty response (off-season or no games today)")
                return {"games": [], "gameDate": ""}
            last_error = e
            logger.warning("Value error fetching scoreboard (attempt %s/3): %s", attempt, e)
        except Exception as e:
            last_error = e
            logger.warning(
                "Error fetching scoreboard from NBA API (attempt %s/3): %s", attempt, e
            )
        if attempt < 3:
            await asyncio.sleep(2)
    logger.error(
        "Scoreboard fetch failed after 3 attempts. Last error: %s.",
        last_error,
    )
    return {}


def extract_team_data(team_data):
    """
    Take raw team data from the API and convert it to our Team format.

    Args:
        team_data: Raw team data from NBA API

    Returns:
        Team: Clean team data in our format
    """
    return Team(
        teamId=team_data["teamId"],
        teamName=team_data["teamName"],
        teamCity=team_data["teamCity"],
        teamTricode=team_data["teamTricode"],
        wins=team_data.get("wins", 0),
        losses=team_data.get("losses", 0),
        score=team_data.get("score", 0),
        timeoutsRemaining=team_data.get("timeoutsRemaining", 0),
    )


async def getScoreboard(game_date: Optional[str] = None) -> ScoreboardResponse:
    """
    Get NBA scores for today (live feed) or a specific date (stats ScoreboardV2).

    Args:
        game_date: Optional YYYY-MM-DD. Omitted or today uses the live scoreboard feed.

    Returns:
        ScoreboardResponse: Games in the standard live scoreboard shape.
    """
    if is_nba_today(game_date):
        return await _get_live_scoreboard_response(game_date or nba_today_iso())
    return await _get_scoreboard_for_date(game_date)


async def _get_live_scoreboard_response(fallback_date: str) -> ScoreboardResponse:
    try:
        raw_scoreboard_data = await fetch_nba_scoreboard()
        if raw_scoreboard_data and raw_scoreboard_data.get("games"):
            return _games_from_scoreboard_dict(raw_scoreboard_data, fallback_date)
        logger.info(
            "Live scoreboard empty for NBA today (%s) — falling back to ScoreboardV3",
            fallback_date,
        )
        return await _get_scoreboard_v3_response(fallback_date)
    except Exception as e:
        logger.error(f"Error fetching live scoreboard: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching live scores: {e}")


async def _get_scoreboard_v3_response(game_date: str) -> ScoreboardResponse:
    try:
        raw = await fetch_scoreboard_v3(game_date)
        board = raw.get("scoreboard") or {}
        response = _games_from_scoreboard_dict(board, game_date)
        if response.scoreboard.games:
            return response
        logger.info("ScoreboardV3 returned no games for %s", game_date)
    except asyncio.TimeoutError as e:
        logger.error("Timeout fetching ScoreboardV3 for %s: %s", game_date, e)
    except Exception as e:
        logger.error("Error fetching ScoreboardV3 for %s: %s", game_date, e)
    return await _get_scoreboard_v2_response(game_date)


async def _get_scoreboard_for_date(game_date: str) -> ScoreboardResponse:
    response = await _get_scoreboard_v3_response(game_date)
    if response.scoreboard.games:
        return response
    return await _get_scoreboard_v2_response(game_date)


async def _get_scoreboard_v2_response(game_date: str) -> ScoreboardResponse:
    try:
        games_data = await fetch_scoreboard_v2(game_date)
        if "resultSets" not in games_data or not games_data["resultSets"]:
            logger.info("No ScoreboardV2 data for %s", game_date)
            return ScoreboardResponse(
                scoreboard=Scoreboard(gameDate=game_date, games=[])
            )

        line_index = _build_line_score_index(games_data)
        games: List[LiveGame] = []
        processed_ids: set[str] = set()

        for game_row in _rows_as_dicts(_result_set(games_data, "GameHeader")):
            live_game = _live_game_from_v2_row(game_row, line_index)
            if not live_game or live_game.gameId in processed_ids:
                continue
            processed_ids.add(live_game.gameId)
            games.append(live_game)

        return ScoreboardResponse(
            scoreboard=Scoreboard(gameDate=game_date, games=games)
        )
    except asyncio.TimeoutError as e:
        logger.error("Timeout fetching ScoreboardV2 for %s: %s", game_date, e)
        raise HTTPException(
            status_code=500,
            detail=f"Timeout retrieving scoreboard for {game_date}. Please try again.",
        )
    except Exception as e:
        logger.error("Error fetching ScoreboardV2 for %s: %s", game_date, e)
        raise HTTPException(
            status_code=500, detail=f"Error fetching scoreboard for {game_date}: {e}"
        )



def _team_display_name(team: Team) -> str:
    city = (team.teamCity or "").strip()
    name = (team.teamName or "Unknown").strip()
    return f"{city} {name}".strip() if city else name


async def _find_scoreboard_game(game_id: str) -> Optional[LiveGame]:
    """
    Locate a game on today's scoreboard.

    The live NBA feed is often empty during playoffs; fall back to ScoreboardV3/V2
    (same path as getScoreboard) when the raw live payload has no games.
    """
    game_id_norm = str(game_id).zfill(10)
    try:
        raw_scoreboard_data = await fetch_nba_scoreboard()
        raw_games = (raw_scoreboard_data or {}).get("games") or []
        for game in raw_games:
            if str(game.get("gameId", "")).zfill(10) == game_id_norm:
                parsed = _games_from_scoreboard_dict(
                    {
                        "gameDate": raw_scoreboard_data.get("gameDate"),
                        "games": [game],
                    },
                    raw_scoreboard_data.get("gameDate") or nba_today_iso(),
                )
                if parsed.scoreboard.games:
                    return parsed.scoreboard.games[0]
    except Exception as e:
        logger.warning("Live scoreboard lookup failed for %s: %s", game_id_norm, e)

    try:
        response = await getScoreboard(nba_today_iso())
        for game in response.scoreboard.games:
            if game.gameId == game_id_norm:
                return game
    except Exception as e:
        logger.warning("Scoreboard fallback lookup failed for %s: %s", game_id_norm, e)
    return None


async def _get_game_info_from_scoreboard(game_id: str) -> Optional[dict]:
    """Basic game info when the live box score endpoint is unavailable."""
    game = await _find_scoreboard_game(game_id)
    if not game:
        return None
    return {
        "gameId": game.gameId,
        "status": game.gameStatusText,
        "homeTeam": {
            "teamId": game.homeTeam.teamId,
            "teamName": _team_display_name(game.homeTeam),
            "score": int(game.homeTeam.score or 0),
        },
        "awayTeam": {
            "teamId": game.awayTeam.teamId,
            "teamName": _team_display_name(game.awayTeam),
            "score": int(game.awayTeam.score or 0),
        },
    }


def _player_box_from_live(player: dict) -> PlayerBoxScoreStats:
    stats = player.get("statistics") or {}
    return PlayerBoxScoreStats(
        player_id=player["personId"],
        name=player["name"],
        position=player.get("position", "N/A"),
        minutes=stats.get("minutesCalculated", "N/A"),
        points=stats.get("points", 0),
        rebounds=stats.get("reboundsTotal", 0),
        assists=stats.get("assists", 0),
        steals=stats.get("steals", 0),
        blocks=stats.get("blocks", 0),
        turnovers=stats.get("turnovers", 0),
        field_goals_made=stats.get("fieldGoalsMade"),
        field_goals_attempted=stats.get("fieldGoalsAttempted"),
        free_throws_made=stats.get("freeThrowsMade"),
        free_throws_attempted=stats.get("freeThrowsAttempted"),
        rebounds_offensive=stats.get("reboundsOffensive"),
        rebounds_defensive=stats.get("reboundsDefensive"),
        fouls_personal=stats.get("foulsPersonal"),
    )


def _team_display_from_live_team(team: dict) -> str:
    city = (team.get("teamCity") or "").strip()
    name = (team.get("teamName") or "Unknown").strip()
    return f"{city} {name}".strip() if city else name


def _team_box_from_live(team: dict) -> TeamBoxScoreStats:
    stats = team.get("statistics") or {}
    return TeamBoxScoreStats(
        team_id=team["teamId"],
        team_name=_team_display_from_live_team(team),
        score=team["score"],
        field_goal_pct=stats.get("fieldGoalsPercentage", 0.0),
        three_point_pct=stats.get("threePointersPercentage", 0.0),
        free_throw_pct=stats.get("freeThrowsPercentage", 0.0),
        rebounds_total=stats.get("reboundsTotal", 0),
        assists=stats.get("assists", 0),
        steals=stats.get("steals", 0),
        blocks=stats.get("blocks", 0),
        turnovers=stats.get("turnovers", 0),
        players=[_player_box_from_live(p) for p in team.get("players", [])],
    )


def _box_score_from_live(game_info: dict) -> BoxScoreResponse:
    home_team = game_info["homeTeam"]
    away_team = game_info["awayTeam"]
    return BoxScoreResponse(
        game_id=str(game_info["gameId"]).zfill(10),
        status=game_info["gameStatusText"],
        home_team=_team_box_from_live(home_team),
        away_team=_team_box_from_live(away_team),
    )


def _player_box_from_v3(player: dict) -> PlayerBoxScoreStats:
    stats = player.get("statistics") or {}
    first = player.get("firstName", "")
    last = player.get("familyName", "")
    name = player.get("nameI") or f"{first} {last}".strip() or "Unknown"
    return PlayerBoxScoreStats(
        player_id=int(player["personId"]),
        name=name,
        position=player.get("position") or "N/A",
        minutes=stats.get("minutes") or "N/A",
        points=int(stats.get("points") or 0),
        rebounds=int(stats.get("reboundsTotal") or 0),
        assists=int(stats.get("assists") or 0),
        steals=int(stats.get("steals") or 0),
        blocks=int(stats.get("blocks") or 0),
        turnovers=int(stats.get("turnovers") or 0),
        field_goals_made=stats.get("fieldGoalsMade"),
        field_goals_attempted=stats.get("fieldGoalsAttempted"),
        free_throws_made=stats.get("freeThrowsMade"),
        free_throws_attempted=stats.get("freeThrowsAttempted"),
        rebounds_offensive=stats.get("reboundsOffensive"),
        rebounds_defensive=stats.get("reboundsDefensive"),
        fouls_personal=stats.get("foulsPersonal"),
    )


def _team_box_from_v3(team: dict) -> TeamBoxScoreStats:
    stats = team.get("statistics") or {}
    city = team.get("teamCity", "")
    name = team.get("teamName", "Unknown")
    display_name = f"{city} {name}".strip() if city else name
    return TeamBoxScoreStats(
        team_id=int(team["teamId"]),
        team_name=display_name,
        score=int(stats.get("points") or 0),
        field_goal_pct=float(stats.get("fieldGoalsPercentage") or 0.0),
        three_point_pct=float(stats.get("threePointersPercentage") or 0.0),
        free_throw_pct=float(stats.get("freeThrowsPercentage") or 0.0),
        rebounds_total=int(stats.get("reboundsTotal") or 0),
        assists=int(stats.get("assists") or 0),
        steals=int(stats.get("steals") or 0),
        blocks=int(stats.get("blocks") or 0),
        turnovers=int(stats.get("turnovers") or 0),
        players=[_player_box_from_v3(p) for p in team.get("players", [])],
    )


def _box_score_from_v3(box: dict, game_id: str) -> Optional[BoxScoreResponse]:
    home = box.get("homeTeam")
    away = box.get("awayTeam")
    if not home or not away:
        return None
    return BoxScoreResponse(
        game_id=game_id,
        status="Final",
        home_team=_team_box_from_v3(home),
        away_team=_team_box_from_v3(away),
    )


async def _fetch_historical_box_score(game_id: str) -> Optional[BoxScoreResponse]:
    try:
        raw = await call_nba_api(
            lambda: boxscoretraditionalv3.BoxScoreTraditionalV3(
                game_id=game_id, **merge_endpoint_config()
            ).get_dict(),
            timeout=10.0,
        )
        box = raw.get("boxScoreTraditional")
        if not box:
            return None
        return _box_score_from_v3(box, game_id)
    except Exception as e:
        logger.warning(
            "Historical box score unavailable for game %s: %s - %s",
            game_id,
            type(e).__name__,
            e,
        )
        return None


def _empty_box_score_from_live_game(game: LiveGame) -> BoxScoreResponse:
    """Scoreboard-only stub when NBA live/stats box score feeds are empty (common in playoffs)."""
    return BoxScoreResponse(
        game_id=game.gameId,
        status=game.gameStatusText,
        home_team=TeamBoxScoreStats(
            team_id=game.homeTeam.teamId,
            team_name=_team_display_name(game.homeTeam),
            score=int(game.homeTeam.score or 0),
            field_goal_pct=0.0,
            three_point_pct=0.0,
            free_throw_pct=0.0,
            rebounds_total=0,
            assists=0,
            steals=0,
            blocks=0,
            turnovers=0,
            players=[],
        ),
        away_team=TeamBoxScoreStats(
            team_id=game.awayTeam.teamId,
            team_name=_team_display_name(game.awayTeam),
            score=int(game.awayTeam.score or 0),
            field_goal_pct=0.0,
            three_point_pct=0.0,
            free_throw_pct=0.0,
            rebounds_total=0,
            assists=0,
            steals=0,
            blocks=0,
            turnovers=0,
            players=[],
        ),
    )


def _empty_box_score_from_game_info(game_info: dict, game_id: str) -> BoxScoreResponse:
    return BoxScoreResponse(
        game_id=game_id,
        status=game_info["status"],
        home_team=TeamBoxScoreStats(
            team_id=game_info["homeTeam"]["teamId"],
            team_name=game_info["homeTeam"]["teamName"],
            score=int(game_info["homeTeam"].get("score") or 0),
            field_goal_pct=0.0,
            three_point_pct=0.0,
            free_throw_pct=0.0,
            rebounds_total=0,
            assists=0,
            steals=0,
            blocks=0,
            turnovers=0,
            players=[],
        ),
        away_team=TeamBoxScoreStats(
            team_id=game_info["awayTeam"]["teamId"],
            team_name=game_info["awayTeam"]["teamName"],
            score=int(game_info["awayTeam"].get("score") or 0),
            field_goal_pct=0.0,
            three_point_pct=0.0,
            free_throw_pct=0.0,
            rebounds_total=0,
            assists=0,
            steals=0,
            blocks=0,
            turnovers=0,
            players=[],
        ),
    )


async def getBoxScore(game_id: str) -> BoxScoreResponse:
    """
    Get the full box score (detailed stats) for a specific game.

    Args:
        game_id: The unique game ID from NBA (accepts 8-digit or 10-digit format)

    Returns:
        BoxScoreResponse: Complete stats for both teams and all players

    Raises:
        HTTPException: If game not found or API error
    """
    game_id = str(game_id).zfill(10)
    live_error: Optional[Exception] = None

    try:
        game_data = await call_live_nba_api(
            lambda kw: boxscore.BoxScore(game_id, **kw).get_dict(),
            timeout=10.0,
        )
        if "game" in game_data:
            return _box_score_from_live(game_data["game"])

        logger.warning(
            "Live box score missing game payload for %s; trying historical stats",
            game_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        live_error = e
        if not _is_nba_empty_response_error(e):
            logger.warning(
                "Live box score failed for %s: %s - %s",
                game_id,
                type(e).__name__,
                e,
            )

    historical = await _fetch_historical_box_score(game_id)
    if historical:
        return historical

    scoreboard_game = await _find_scoreboard_game(game_id)
    if scoreboard_game:
        logger.info(
            "Returning scoreboard stub box score for %s (live NBA box score unavailable)",
            game_id,
        )
        return _empty_box_score_from_live_game(scoreboard_game)

    if live_error and not _is_nba_empty_response_error(live_error):
        logger.error("Error retrieving box score for game %s: %s", game_id, live_error)
        raise HTTPException(
            status_code=500, detail=f"Error retrieving box score: {str(live_error)}"
        )

    raise HTTPException(
        status_code=404,
        detail=f"{_BOXSCORE_UNAVAILABLE_DETAIL} (game {game_id})",
    )


def _plays_from_actions(game_id: str, actions: List[dict]) -> List[PlayByPlayEvent]:
    plays: List[PlayByPlayEvent] = []
    for action in actions:
        if action.get("actionNumber") is None:
            continue
        plays.append(
            PlayByPlayEvent(
                action_number=action["actionNumber"],
                clock=action.get("clock") or "",
                period=int(action.get("period") or 0),
                team_id=action.get("teamId"),
                team_tricode=action.get("teamTricode"),
                action_type=action.get("actionType") or "",
                description=action.get("description") or "",
                player_id=action.get("personId"),
                player_name=action.get("playerName"),
                score_home=(
                    str(action["scoreHome"])
                    if action.get("scoreHome") is not None
                    else None
                ),
                score_away=(
                    str(action["scoreAway"])
                    if action.get("scoreAway") is not None
                    else None
                ),
                shot_result=action.get("shotResult"),
            )
        )
    return plays


def _sort_plays_newest_first(plays: List[PlayByPlayEvent]) -> List[PlayByPlayEvent]:
    return sorted(plays, key=lambda p: p.action_number, reverse=True)


async def _fetch_historical_play_by_play(game_id: str) -> List[PlayByPlayEvent]:
    try:
        api_kwargs = get_api_kwargs()
        await rate_limit()
        raw = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: playbyplayv3.PlayByPlayV3(
                    game_id=game_id, **api_kwargs
                ).get_dict()
            ),
            timeout=10.0,
        )
        actions = raw.get("game", {}).get("actions") or []
        return _plays_from_actions(game_id, actions)
    except Exception as e:
        logger.warning(
            "Historical play-by-play unavailable for game %s: %s - %s",
            game_id,
            type(e).__name__,
            e,
        )
        return []


async def getPlayByPlay(game_id: str) -> PlayByPlayResponse:
    """
    Get the play-by-play (all game events) for a specific game.

    Uses the live feed for in-progress games; completed games fall back to PlayByPlayV3.
    """
    game_id = str(game_id).zfill(10)
    live_error: Optional[Exception] = None

    try:
        play_by_play_data = await call_live_nba_api(
            lambda kw: playbyplay.PlayByPlay(game_id, **kw).get_dict(),
            timeout=10.0,
        )
        actions = play_by_play_data.get("game", {}).get("actions") or []
        if actions:
            return PlayByPlayResponse(
                game_id=game_id,
                plays=_sort_plays_newest_first(_plays_from_actions(game_id, actions)),
            )
    except HTTPException:
        raise
    except Exception as e:
        live_error = e
        if not _is_nba_empty_response_error(e):
            logger.warning(
                "Live play-by-play failed for %s: %s - %s",
                game_id,
                type(e).__name__,
                e,
            )

    historical_plays = await _fetch_historical_play_by_play(game_id)
    if historical_plays:
        return PlayByPlayResponse(
            game_id=game_id, plays=_sort_plays_newest_first(historical_plays)
        )

    if live_error and _is_nba_empty_response_error(live_error):
        logger.warning(
            "Play-by-play not available for game %s (live and stats empty)",
            game_id,
        )
        return PlayByPlayResponse(game_id=game_id, plays=[])

    if live_error:
        logger.error("Error retrieving play-by-play for game %s: %s", game_id, live_error)
        raise HTTPException(
            status_code=500, detail=f"Error retrieving play-by-play: {str(live_error)}"
        )

    return PlayByPlayResponse(game_id=game_id, plays=[])
