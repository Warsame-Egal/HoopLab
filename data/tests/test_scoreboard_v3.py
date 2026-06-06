from app.services.live import _games_from_scoreboard_dict, _parse_gamecode_teams


def test_parse_gamecode_teams():
    away, home = _parse_gamecode_teams("20260603/NYKSAS")
    assert away == 1610612752
    assert home == 1610612759


def test_games_from_v3_shape():
    raw = {
        "gameDate": "2026-06-03",
        "games": [
            {
                "gameId": "0042500401",
                "gameStatus": 1,
                "gameStatusText": "8:30 pm ET",
                "period": 0,
                "gameClock": "",
                "gameTimeUTC": "2026-06-04T00:30:00Z",
                "homeTeam": {
                    "teamId": 1610612759,
                    "teamName": "Spurs",
                    "teamCity": "San Antonio",
                    "teamTricode": "SAS",
                    "wins": 0,
                    "losses": 0,
                    "score": 0,
                },
                "awayTeam": {
                    "teamId": 1610612752,
                    "teamName": "Knicks",
                    "teamCity": "New York",
                    "teamTricode": "NYK",
                    "wins": 0,
                    "losses": 0,
                    "score": 0,
                },
            }
        ],
    }
    resp = _games_from_scoreboard_dict(raw, "2026-06-03")
    assert len(resp.scoreboard.games) == 1
    game = resp.scoreboard.games[0]
    assert game.homeTeam.teamTricode == "SAS"
    assert game.awayTeam.teamTricode == "NYK"
