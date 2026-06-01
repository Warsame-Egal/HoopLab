CREATE TABLE team_clutch_stats (
    team_id   INTEGER NOT NULL REFERENCES teams (team_id),
    season    VARCHAR(7) NOT NULL REFERENCES seasons (season),
    gp        INTEGER,
    wins      INTEGER,
    losses    INTEGER,
    off_rtg   DOUBLE PRECISION,
    def_rtg   DOUBLE PRECISION,
    net_rtg   DOUBLE PRECISION,
    PRIMARY KEY (team_id, season)
);

CREATE INDEX idx_team_clutch_season ON team_clutch_stats (season);
