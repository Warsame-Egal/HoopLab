CREATE TABLE games (
    game_id       VARCHAR(20) PRIMARY KEY,
    season        VARCHAR(7) NOT NULL REFERENCES seasons (season),
    game_date     DATE NOT NULL,
    home_team_id  INTEGER REFERENCES teams (team_id),
    away_team_id  INTEGER REFERENCES teams (team_id),
    home_abbr     VARCHAR(10),
    away_abbr     VARCHAR(10),
    home_pts      INTEGER,
    away_pts      INTEGER,
    matchup       VARCHAR(40)
);

CREATE INDEX idx_games_season_date ON games (season, game_date DESC);
