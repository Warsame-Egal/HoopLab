CREATE TABLE team_standings (
    team_id        INTEGER NOT NULL REFERENCES teams (team_id),
    season         VARCHAR(7) NOT NULL REFERENCES seasons (season),
    conference     VARCHAR(20),
    division       VARCHAR(30),
    conf_rank      INTEGER,
    div_rank       INTEGER,
    wins           INTEGER,
    losses         INTEGER,
    win_pct        DOUBLE PRECISION,
    home_record    VARCHAR(15),
    road_record    VARCHAR(15),
    last_ten       VARCHAR(15),
    streak         VARCHAR(15),
    games_back     DOUBLE PRECISION,
    clinch         VARCHAR(15),
    PRIMARY KEY (team_id, season)
);

CREATE INDEX idx_team_standings_season ON team_standings (season);
