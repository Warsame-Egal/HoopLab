CREATE TABLE teams (
    team_id       INTEGER PRIMARY KEY,
    abbreviation  VARCHAR(10)  NOT NULL,
    city          VARCHAR(100),
    name          VARCHAR(100),
    full_name     VARCHAR(150),
    conference    VARCHAR(20),
    division      VARCHAR(20),
    year_founded  INTEGER
);

CREATE TABLE seasons (
    season      VARCHAR(7) PRIMARY KEY,
    start_year  INTEGER NOT NULL,
    is_current  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE players (
    player_id     INTEGER PRIMARY KEY,
    full_name     VARCHAR(200) NOT NULL,
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    position      VARCHAR(20),
    team_id       INTEGER REFERENCES teams (team_id),
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    from_year     INTEGER,
    to_year       INTEGER,
    headshot_url  VARCHAR(500)
);

CREATE TABLE player_season_stats (
    player_id   INTEGER NOT NULL REFERENCES players (player_id),
    season      VARCHAR(7) NOT NULL REFERENCES seasons (season),
    team_id     INTEGER REFERENCES teams (team_id),
    gp          INTEGER,
    min         DOUBLE PRECISION,
    pts         DOUBLE PRECISION,
    reb         DOUBLE PRECISION,
    ast         DOUBLE PRECISION,
    stl         DOUBLE PRECISION,
    blk         DOUBLE PRECISION,
    tov         DOUBLE PRECISION,
    fg_pct      DOUBLE PRECISION,
    fg3_pct     DOUBLE PRECISION,
    ft_pct      DOUBLE PRECISION,
    ts_pct      DOUBLE PRECISION,
    usg_pct     DOUBLE PRECISION,
    plus_minus  DOUBLE PRECISION,
    PRIMARY KEY (player_id, season)
);

CREATE TABLE team_season_stats (
    team_id   INTEGER NOT NULL REFERENCES teams (team_id),
    season    VARCHAR(7) NOT NULL REFERENCES seasons (season),
    wins      INTEGER,
    losses    INTEGER,
    off_rtg   DOUBLE PRECISION,
    def_rtg   DOUBLE PRECISION,
    net_rtg   DOUBLE PRECISION,
    pace      DOUBLE PRECISION,
    pts       DOUBLE PRECISION,
    reb       DOUBLE PRECISION,
    ast       DOUBLE PRECISION,
    PRIMARY KEY (team_id, season)
);

CREATE TABLE player_game_logs (
    id         BIGSERIAL PRIMARY KEY,
    player_id  INTEGER NOT NULL REFERENCES players (player_id),
    season     VARCHAR(7) NOT NULL REFERENCES seasons (season),
    game_id    VARCHAR(20) NOT NULL,
    game_date  DATE NOT NULL,
    matchup    VARCHAR(20),
    wl         VARCHAR(1),
    min        VARCHAR(10),
    pts        INTEGER,
    reb        INTEGER,
    ast        INTEGER,
    stl        INTEGER,
    blk        INTEGER,
    tov        INTEGER,
    plus_minus INTEGER,
    UNIQUE (player_id, season, game_id)
);

CREATE TABLE shots (
    id            BIGSERIAL PRIMARY KEY,
    player_id     INTEGER NOT NULL REFERENCES players (player_id),
    season        VARCHAR(7) NOT NULL REFERENCES seasons (season),
    game_id       VARCHAR(20),
    loc_x         INTEGER,
    loc_y         INTEGER,
    shot_made     BOOLEAN,
    shot_zone     VARCHAR(50),
    shot_type     VARCHAR(50),
    shot_distance INTEGER
);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE favorites (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('PLAYER', 'TEAM')),
    entity_id   INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE TABLE saved_views (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    config_json JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_full_name ON players (full_name);
CREATE INDEX idx_players_team_id ON players (team_id);
CREATE INDEX idx_player_season_stats_season_pts ON player_season_stats (season, pts DESC);
CREATE INDEX idx_team_season_stats_season ON team_season_stats (season);
CREATE INDEX idx_player_game_logs_player_season ON player_game_logs (player_id, season);
CREATE INDEX idx_shots_player_season ON shots (player_id, season);
