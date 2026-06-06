#!/usr/bin/env bash
#
# HoopLab endpoint smoke test.
#
# Hits every Spring REST route against a running stack and asserts a 2xx with a non-empty body.
# Live play-by-play and live box score may legitimately be empty when no game is in progress, so
# those are checked for a 2xx only.
#
# Usage:
#   BASE=http://localhost:8080 \
#   GAME_ID=0022300001 \
#   PLAYER_ID=2544 \
#   TEAM_ID=1610612747 \
#   SEASON=2023-24 \
#   DATE=2024-01-15 \
#   bash backend/scripts/smoke.sh
#
# Defaults target a known completed slate so the script works without a live game.

set -u

BASE="${BASE:-http://localhost:8080}"
GAME_ID="${GAME_ID:-0022300001}"
PLAYER_ID="${PLAYER_ID:-2544}"        # LeBron James
TEAM_ID="${TEAM_ID:-1610612747}"      # Los Angeles Lakers
SEASON="${SEASON:-2023-24}"
DATE="${DATE:-2024-01-15}"

pass=0
fail=0

# check <expectation> <path>
#   expectation = "nonempty" (2xx + body length > 2) or "ok" (2xx, body may be empty)
check() {
  local expect="$1" path="$2"
  local url="${BASE}${path}"
  local tmp code
  tmp="$(mktemp)"
  code="$(curl -s -o "$tmp" -w '%{http_code}' "$url")"
  local len
  len="$(wc -c < "$tmp" | tr -d ' ')"
  rm -f "$tmp"

  if [[ "$code" != 2* ]]; then
    echo "FAIL [$code] $path"
    fail=$((fail + 1))
    return
  fi
  if [[ "$expect" == "nonempty" && "$len" -le 2 ]]; then
    echo "FAIL [empty body] $path"
    fail=$((fail + 1))
    return
  fi
  echo "ok   [$code] $path"
  pass=$((pass + 1))
}

echo "Smoke testing ${BASE} (season=${SEASON}, game=${GAME_ID}, player=${PLAYER_ID}, team=${TEAM_ID}, date=${DATE})"
echo "---------------------------------------------------------------"

# Analytics
check nonempty "/api/analytics/overview?season=${SEASON}"

# Scoreboard (live today; historical for a past date)
check ok       "/api/scoreboard"
check nonempty "/api/scoreboard?date=${DATE}"

# Games
check nonempty "/api/games?season=${SEASON}&limit=10"
check nonempty "/api/games/by-date?date=${DATE}"
check nonempty "/api/games/${GAME_ID}/boxscore"
check nonempty "/api/games/${GAME_ID}/boxscore/advanced?measure=advanced"
check nonempty "/api/games/${GAME_ID}/boxscore/scoring"
check nonempty "/api/games/${GAME_ID}/boxscore/fourfactors"
check nonempty "/api/games/${GAME_ID}/summary"
check ok       "/api/games/${GAME_ID}/win-probability"
check ok       "/api/games/${GAME_ID}/play-by-play"
check ok       "/api/games/${GAME_ID}/live-boxscore"

# Leaders / League
check nonempty "/api/leaders?season=${SEASON}&category=PTS&limit=10"
check nonempty "/api/league/hustle?season=${SEASON}&entity=player"
check nonempty "/api/teams/${TEAM_ID}/trends?stat=WIN_PCT"
check nonempty "/api/league/shot-zones?season=${SEASON}"
check ok       "/api/league/playtypes?teamId=${TEAM_ID}&season=${SEASON}"
check nonempty "/api/league/playoff-picture?season=${SEASON}"
check nonempty "/api/league/estimated-metrics?season=${SEASON}"
check nonempty "/api/league/lineups?season=${SEASON}"

# Standings
check nonempty "/api/standings?season=${SEASON}"

# Players
check nonempty "/api/players?search=james&page=0&size=20"
check nonempty "/api/players/${PLAYER_ID}"
check nonempty "/api/players/${PLAYER_ID}/profile"
check nonempty "/api/players/${PLAYER_ID}/seasons"
check nonempty "/api/players/${PLAYER_ID}/career"
check nonempty "/api/players/${PLAYER_ID}/gamelog?season=${SEASON}"
check nonempty "/api/players/${PLAYER_ID}/shotchart?season=${SEASON}"
check nonempty "/api/players/${PLAYER_ID}/trends?stat=PTS"
check nonempty "/api/players/${PLAYER_ID}/awards"
check ok       "/api/players/${PLAYER_ID}/next-games"
check ok       "/api/players/${PLAYER_ID}/splits?type=general&season=${SEASON}"
check nonempty "/api/players/${PLAYER_ID}/estimated-metrics?season=${SEASON}"

# Teams
check nonempty "/api/teams"
check nonempty "/api/teams/map?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}"
check nonempty "/api/teams/${TEAM_ID}/seasons"
check nonempty "/api/teams/${TEAM_ID}/trends?stat=NET_RTG"
check nonempty "/api/teams/${TEAM_ID}/roster?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/gamelog?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/official-roster?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/lineups?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/info?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/year-by-year"
check nonempty "/api/teams/${TEAM_ID}/splits?type=general&season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/on-off?season=${SEASON}"
check nonempty "/api/teams/${TEAM_ID}/franchise-leaders"

# Compare
check nonempty "/api/compare/players?ids=2544,201939&season=${SEASON}"
check nonempty "/api/compare/teams?ids=${TEAM_ID},1610612738&season=${SEASON}"

echo "---------------------------------------------------------------"
echo "passed=${pass} failed=${fail}"
[[ "$fail" -eq 0 ]]
