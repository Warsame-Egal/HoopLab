CREATE TABLE team_game_logs (
    id         BIGSERIAL PRIMARY KEY,
    team_id    INTEGER NOT NULL REFERENCES teams (team_id),
    season     VARCHAR(7) NOT NULL REFERENCES seasons (season),
    game_id    VARCHAR(20) NOT NULL,
    game_date  DATE NOT NULL,
    matchup    VARCHAR(20),
    wl         VARCHAR(1),
    pts        INTEGER,
    reb        INTEGER,
    ast        INTEGER,
    plus_minus INTEGER,
    UNIQUE (team_id, season, game_id)
);

CREATE INDEX idx_team_game_logs_team_season ON team_game_logs (team_id, season);
