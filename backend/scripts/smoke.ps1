# HoopLab endpoint smoke test (PowerShell).
#
# Hits every Spring REST route against a running stack and asserts 2xx.
# Live play-by-play and live box score may legitimately be empty when no game
# is in progress; those are checked for 2xx only.
#
# Usage (from repo root):
#   .\backend\scripts\smoke.ps1
#
# Optional env vars:
#   $env:BASE = "http://localhost:8080"
#   $env:GAME_ID = "0022300001"
#   $env:PLAYER_ID = "2544"
#   $env:TEAM_ID = "1610612747"
#   $env:SEASON = "2023-24"
#   $env:DATE = "2024-01-15"

$ErrorActionPreference = "Stop"

$Base = if ($env:BASE) { $env:BASE } else { "http://localhost:8080" }
$GameId = if ($env:GAME_ID) { $env:GAME_ID } else { "0022300001" }
$PlayerId = if ($env:PLAYER_ID) { $env:PLAYER_ID } else { "2544" }
$TeamId = if ($env:TEAM_ID) { $env:TEAM_ID } else { "1610612747" }
$Season = if ($env:SEASON) { $env:SEASON } else { "2023-24" }
$Date = if ($env:DATE) { $env:DATE } else { "2024-01-15" }

$script:pass = 0
$script:fail = 0

function Test-SmokeEndpoint {
    param(
        [ValidateSet("nonempty", "ok")]
        [string]$Expect,
        [string]$Path
    )

    $url = "$Base$Path"
    $code = 0
    $len = 0

    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 120
        $code = [int]$response.StatusCode
        $len = $response.Content.Length
    } catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $code = [int]$resp.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $body = $reader.ReadToEnd()
                $reader.Close()
                $len = $body.Length
            } catch {
                $len = 0
            }
        }
    }

    if ($code -lt 200 -or $code -ge 300) {
        Write-Host "FAIL [$code] $Path"
        $script:fail++
        return
    }
    if ($Expect -eq "nonempty" -and $len -le 2) {
        Write-Host "FAIL [empty body] $Path"
        $script:fail++
        return
    }
    Write-Host "ok   [$code] $Path"
    $script:pass++
}

Write-Host "Smoke testing $Base (season=$Season, game=$GameId, player=$PlayerId, team=$TeamId, date=$Date)"
Write-Host "---------------------------------------------------------------"

Test-SmokeEndpoint nonempty "/api/analytics/overview?season=$Season"

Test-SmokeEndpoint ok "/api/scoreboard"
Test-SmokeEndpoint nonempty "/api/scoreboard?date=$Date"

Test-SmokeEndpoint nonempty "/api/games?season=$Season&limit=10"
Test-SmokeEndpoint nonempty "/api/games/by-date?date=$Date"
Test-SmokeEndpoint nonempty "/api/games/$GameId/boxscore"
Test-SmokeEndpoint nonempty "/api/games/$GameId/boxscore/advanced?measure=advanced"
Test-SmokeEndpoint nonempty "/api/games/$GameId/boxscore/scoring"
Test-SmokeEndpoint nonempty "/api/games/$GameId/boxscore/fourfactors"
Test-SmokeEndpoint nonempty "/api/games/$GameId/summary"
Test-SmokeEndpoint ok "/api/games/$GameId/win-probability"
Test-SmokeEndpoint ok "/api/games/$GameId/play-by-play"
Test-SmokeEndpoint ok "/api/games/$GameId/live-boxscore"

Test-SmokeEndpoint nonempty "/api/leaders?season=$Season&category=PTS&limit=10"
Test-SmokeEndpoint nonempty "/api/league/hustle?season=$Season&entity=player"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/trends?stat=WIN_PCT"
Test-SmokeEndpoint nonempty "/api/league/shot-zones?season=$Season"
Test-SmokeEndpoint ok "/api/league/playtypes?teamId=$TeamId&season=$Season"
Test-SmokeEndpoint nonempty "/api/league/playoff-picture?season=$Season"
Test-SmokeEndpoint nonempty "/api/league/estimated-metrics?season=$Season"
Test-SmokeEndpoint nonempty "/api/league/lineups?season=$Season"

Test-SmokeEndpoint nonempty "/api/standings?season=$Season"

Test-SmokeEndpoint nonempty "/api/players?search=james&page=0&size=20"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/profile"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/seasons"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/career"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/gamelog?season=$Season"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/shotchart?season=$Season"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/trends?stat=PTS"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/awards"
Test-SmokeEndpoint ok "/api/players/$PlayerId/next-games"
Test-SmokeEndpoint ok "/api/players/$PlayerId/splits?type=general&season=$Season"
Test-SmokeEndpoint nonempty "/api/players/$PlayerId/estimated-metrics?season=$Season"

Test-SmokeEndpoint nonempty "/api/teams"
Test-SmokeEndpoint nonempty "/api/teams/map?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/seasons"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/trends?stat=NET_RTG"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/roster?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/gamelog?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/official-roster?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/lineups?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/info?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/year-by-year"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/splits?type=general&season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/on-off?season=$Season"
Test-SmokeEndpoint nonempty "/api/teams/$TeamId/franchise-leaders"

Test-SmokeEndpoint nonempty "/api/compare/players?ids=2544,201939&season=$Season"
Test-SmokeEndpoint nonempty "/api/compare/teams?ids=$TeamId,1610612738&season=$Season"

Write-Host "---------------------------------------------------------------"
Write-Host "passed=$pass failed=$fail"

if ($fail -gt 0) {
    exit 1
}
