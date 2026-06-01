package com.hooplab.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.domain.Game;
import com.hooplab.domain.Player;
import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.domain.PlayerSeasonStatsId;
import com.hooplab.domain.Season;
import com.hooplab.domain.Team;
import com.hooplab.domain.TeamClutchStats;
import com.hooplab.domain.TeamSeasonStats;
import com.hooplab.domain.TeamSeasonStatsId;
import com.hooplab.domain.TeamStanding;
import com.hooplab.repository.GameRepository;
import com.hooplab.repository.PlayerRepository;
import com.hooplab.repository.PlayerSeasonStatsRepository;
import com.hooplab.repository.SeasonRepository;
import com.hooplab.repository.TeamClutchStatsRepository;
import com.hooplab.repository.TeamRepository;
import com.hooplab.repository.TeamSeasonStatsRepository;
import com.hooplab.repository.TeamStandingRepository;
import com.hooplab.util.SeasonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class IngestionService {

    private static final Logger log = LoggerFactory.getLogger(IngestionService.class);

    private final IngestionClient client;
    private final IngestionMapper mapper;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final SeasonRepository seasonRepository;
    private final PlayerSeasonStatsRepository playerSeasonStatsRepository;
    private final TeamSeasonStatsRepository teamSeasonStatsRepository;
    private final TeamStandingRepository teamStandingRepository;
    private final TeamClutchStatsRepository teamClutchStatsRepository;
    private final GameRepository gameRepository;
    private final int defaultSeasonsBack;
    private final List<String> measures;

    public IngestionService(IngestionClient client,
                            IngestionMapper mapper,
                            TeamRepository teamRepository,
                            PlayerRepository playerRepository,
                            SeasonRepository seasonRepository,
                            PlayerSeasonStatsRepository playerSeasonStatsRepository,
                            TeamSeasonStatsRepository teamSeasonStatsRepository,
                            TeamStandingRepository teamStandingRepository,
                            TeamClutchStatsRepository teamClutchStatsRepository,
                            GameRepository gameRepository,
                            @Value("${hooplab.ingest.seasons-back:8}") int defaultSeasonsBack,
                            @Value("${hooplab.ingest.measures:Base,Advanced}") String measuresConfig) {
        this.client = client;
        this.mapper = mapper;
        this.teamRepository = teamRepository;
        this.playerRepository = playerRepository;
        this.seasonRepository = seasonRepository;
        this.playerSeasonStatsRepository = playerSeasonStatsRepository;
        this.teamSeasonStatsRepository = teamSeasonStatsRepository;
        this.teamStandingRepository = teamStandingRepository;
        this.teamClutchStatsRepository = teamClutchStatsRepository;
        this.gameRepository = gameRepository;
        this.defaultSeasonsBack = defaultSeasonsBack;
        this.measures = Arrays.stream(measuresConfig.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    public int getDefaultSeasonsBack() {
        return defaultSeasonsBack;
    }

    @Transactional
    public Map<String, Object> ingestSeason(String season) {
        ensureSeason(season);
        int teams = ingestTeams();
        int players = ingestPlayers();
        int playerStats = ingestPlayerSeasonStats(season);
        int teamStats = ingestTeamSeasonStats(season);
        int standings = ingestStandings(season);
        int clutch = ingestClutch(season);
        int games = ingestGames(season);

        log.info("Ingestion complete for {}: teams={}, players={}, playerStats={}, teamStats={}, "
                        + "standings={}, clutch={}, games={}",
                season, teams, players, playerStats, teamStats, standings, clutch, games);

        Map<String, Object> result = new HashMap<>();
        result.put("season", season);
        result.put("teamsUpserted", teams);
        result.put("playersUpserted", players);
        result.put("playerSeasonStatsUpserted", playerStats);
        result.put("teamSeasonStatsUpserted", teamStats);
        result.put("standingsUpserted", standings);
        result.put("clutchUpserted", clutch);
        result.put("gamesUpserted", games);
        return result;
    }

    @Transactional
    public Map<String, Object> ingestSeasonRange(int seasonsBack) {
        List<String> seasons = SeasonUtils.seasonRange(seasonsBack);
        int teams = ingestTeams();
        int players = ingestPlayers();

        List<Map<String, Object>> details = new ArrayList<>();
        int totalPlayerStats = 0;
        int totalTeamStats = 0;

        for (String season : seasons) {
            ensureSeason(season);
            int playerStats = ingestPlayerSeasonStats(season);
            int teamStats = ingestTeamSeasonStats(season);
            int standings = ingestStandings(season);
            int clutch = ingestClutch(season);
            int games = ingestGames(season);
            totalPlayerStats += playerStats;
            totalTeamStats += teamStats;
            Map<String, Object> seasonDetail = new HashMap<>();
            seasonDetail.put("season", season);
            seasonDetail.put("playerSeasonStatsUpserted", playerStats);
            seasonDetail.put("teamSeasonStatsUpserted", teamStats);
            seasonDetail.put("standingsUpserted", standings);
            seasonDetail.put("clutchUpserted", clutch);
            seasonDetail.put("gamesUpserted", games);
            details.add(seasonDetail);
            log.info("Backfill progress for {}: playerStats={}, teamStats={}, standings={}, clutch={}, games={}",
                    season, playerStats, teamStats, standings, clutch, games);
        }

        log.info("Season range ingestion complete: seasons={}, playerStats={}, teamStats={}",
                seasons.size(), totalPlayerStats, totalTeamStats);

        Map<String, Object> result = new HashMap<>();
        result.put("seasons", seasons);
        result.put("teamsUpserted", teams);
        result.put("playersUpserted", players);
        result.put("playerSeasonStatsUpserted", totalPlayerStats);
        result.put("teamSeasonStatsUpserted", totalTeamStats);
        result.put("details", details);
        return result;
    }

    private int ingestStandings(String season) {
        JsonNode response;
        try {
            response = client.fetchStandings(season);
        } catch (Exception ex) {
            log.warn("Standings ingestion skipped for {}: {}", season, ex.getMessage());
            return 0;
        }
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return 0;
        }
        int count = 0;
        for (JsonNode row : records) {
            Integer teamId = IngestionMapper.intVal(row, "TeamID");
            if (teamId == null) {
                continue;
            }
            Team team = teamRepository.findById(teamId).orElse(null);
            if (team == null) {
                continue;
            }
            teamStandingRepository.save(mapper.toTeamStanding(row, team, season));
            count++;
        }
        return count;
    }

    private int ingestClutch(String season) {
        JsonNode response;
        try {
            response = client.fetchTeamClutch(season, "Advanced");
        } catch (Exception ex) {
            log.warn("Clutch ingestion skipped for {}: {}", season, ex.getMessage());
            return 0;
        }
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return 0;
        }
        int count = 0;
        for (JsonNode row : records) {
            Integer teamId = IngestionMapper.intVal(row, "TEAM_ID");
            if (teamId == null) {
                continue;
            }
            Team team = teamRepository.findById(teamId).orElse(null);
            if (team == null) {
                continue;
            }
            teamClutchStatsRepository.save(mapper.toTeamClutch(row, team, season));
            count++;
        }
        return count;
    }

    private int ingestGames(String season) {
        JsonNode response;
        try {
            response = client.fetchGames(season);
        } catch (Exception ex) {
            log.warn("Game ingestion skipped for {}: {}", season, ex.getMessage());
            return 0;
        }
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return 0;
        }

        Map<String, JsonNode> homeByGame = new HashMap<>();
        Map<String, JsonNode> awayByGame = new HashMap<>();
        for (JsonNode row : records) {
            String gameId = IngestionMapper.text(row, "GAME_ID");
            String matchup = IngestionMapper.text(row, "MATCHUP");
            if (gameId == null || matchup == null) {
                continue;
            }
            if (matchup.contains("@")) {
                awayByGame.put(gameId, row);
            } else {
                homeByGame.put(gameId, row);
            }
        }

        Set<String> gameIds = new HashSet<>();
        gameIds.addAll(homeByGame.keySet());
        gameIds.addAll(awayByGame.keySet());
        if (gameIds.isEmpty()) {
            return 0;
        }

        gameRepository.deleteBySeason(season);
        List<Game> batch = new ArrayList<>();
        for (String gameId : gameIds) {
            JsonNode home = homeByGame.get(gameId);
            JsonNode away = awayByGame.get(gameId);
            JsonNode ref = home != null ? home : away;
            if (ref == null) {
                continue;
            }
            Game game = new Game();
            game.setGameId(gameId);
            game.setSeason(season);
            game.setGameDate(parseGameDate(IngestionMapper.text(ref, "GAME_DATE")));
            if (home != null) {
                game.setHomeTeamId(IngestionMapper.intVal(home, "TEAM_ID"));
                game.setHomeAbbr(IngestionMapper.text(home, "TEAM_ABBREVIATION"));
                game.setHomePts(IngestionMapper.intVal(home, "PTS"));
            }
            if (away != null) {
                game.setAwayTeamId(IngestionMapper.intVal(away, "TEAM_ID"));
                game.setAwayAbbr(IngestionMapper.text(away, "TEAM_ABBREVIATION"));
                game.setAwayPts(IngestionMapper.intVal(away, "PTS"));
            }
            String matchup = game.getAwayAbbr() != null && game.getHomeAbbr() != null
                    ? game.getAwayAbbr() + " @ " + game.getHomeAbbr()
                    : IngestionMapper.text(ref, "MATCHUP");
            game.setMatchup(matchup);
            batch.add(game);
        }
        gameRepository.saveAll(batch);
        return batch.size();
    }

    private static LocalDate parseGameDate(String value) {
        if (value == null || value.length() < 10) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(value.substring(0, 10));
        } catch (Exception ex) {
            return LocalDate.now();
        }
    }

    private void ensureSeason(String season) {
        seasonRepository.findById(season).ifPresentOrElse(existing -> {
        }, () -> {
            boolean isCurrent = season.equals(SeasonUtils.currentSeason());
            seasonRepository.save(mapper.toSeason(season, isCurrent));
        });
    }

    private int ingestTeams() {
        JsonNode response = client.fetchTeams();
        JsonNode records = response.get("records");
        int count = 0;
        if (records != null && records.isArray()) {
            for (JsonNode row : records) {
                Team team = mapper.toTeam(row);
                teamRepository.save(team);
                count++;
            }
        }
        return count;
    }

    private int ingestPlayers() {
        JsonNode response = client.fetchPlayers();
        JsonNode index = response.get("player_index");
        int count = 0;
        if (index != null && index.isArray()) {
            for (JsonNode row : index) {
                Integer teamId = IngestionMapper.intVal(row, "TEAM_ID");
                Team team = teamId == null ? null : teamRepository.findById(teamId).orElse(null);
                Player player = mapper.toPlayer(row, team);
                playerRepository.save(player);
                count++;
            }
        }
        return count;
    }

    private int ingestPlayerSeasonStats(String season) {
        String baseMeasure = measures.getFirst();
        JsonNode baseResponse = client.fetchPlayerSeasonStats(season, baseMeasure);
        Map<Integer, JsonNode> advancedByPlayer = Map.of();
        if (measures.size() > 1) {
            advancedByPlayer = mapper.indexByPlayerId(
                    client.fetchPlayerSeasonStats(season, measures.get(1)).get("records"));
        }

        int count = 0;
        JsonNode records = baseResponse.get("records");
        if (records == null || !records.isArray()) {
            return 0;
        }

        for (JsonNode row : records) {
            int playerId = IngestionMapper.intVal(row, "PLAYER_ID");
            Integer teamId = IngestionMapper.intVal(row, "TEAM_ID");
            Player player = playerRepository.findById(playerId).orElseGet(() -> {
                Player p = new Player();
                p.setPlayerId(playerId);
                p.setFullName(IngestionMapper.text(row, "PLAYER_NAME"));
                p.setActive(true);
                return playerRepository.save(p);
            });
            Team team = teamId == null ? null : teamRepository.findById(teamId).orElse(null);

            PlayerSeasonStatsId id = new PlayerSeasonStatsId(playerId, season);
            PlayerSeasonStats stats = playerSeasonStatsRepository.findById(id)
                    .orElseGet(() -> mapper.toPlayerSeasonStats(row, season, team, player));

            stats.setTeam(team);
            stats.setGp(IngestionMapper.intVal(row, "GP"));
            stats.setMin(IngestionMapper.dbl(row, "MIN"));
            stats.setPts(IngestionMapper.dbl(row, "PTS"));
            stats.setReb(IngestionMapper.dbl(row, "REB"));
            stats.setAst(IngestionMapper.dbl(row, "AST"));
            stats.setStl(IngestionMapper.dbl(row, "STL"));
            stats.setBlk(IngestionMapper.dbl(row, "BLK"));
            stats.setTov(IngestionMapper.dbl(row, "TOV"));
            stats.setFgPct(IngestionMapper.dbl(row, "FG_PCT"));
            stats.setFg3Pct(IngestionMapper.dbl(row, "FG3_PCT"));
            stats.setFtPct(IngestionMapper.dbl(row, "FT_PCT"));
            stats.setPlusMinus(IngestionMapper.dbl(row, "PLUS_MINUS"));

            JsonNode advanced = advancedByPlayer.get(playerId);
            if (advanced != null) {
                mapper.mergeAdvanced(stats, advanced);
            }

            playerSeasonStatsRepository.save(stats);
            count++;
        }
        return count;
    }

    private int ingestTeamSeasonStats(String season) {
        String baseMeasure = measures.getFirst();
        JsonNode response = client.fetchTeamSeasonStats(season, baseMeasure);
        Map<Integer, JsonNode> advancedByTeam = Map.of();
        if (measures.size() > 1) {
            advancedByTeam = mapper.indexByTeamId(
                    client.fetchTeamSeasonStats(season, measures.get(1)).get("records"));
        }

        JsonNode records = response.get("records");
        int count = 0;
        if (records == null || !records.isArray()) {
            return 0;
        }

        for (JsonNode row : records) {
            int teamId = IngestionMapper.intVal(row, "TEAM_ID");
            Team team = teamRepository.findById(teamId).orElseGet(() -> {
                Team t = new Team();
                t.setTeamId(teamId);
                t.setAbbreviation(IngestionMapper.text(row, "TEAM_ABBREVIATION"));
                t.setFullName(IngestionMapper.text(row, "TEAM_NAME"));
                t.setName(IngestionMapper.text(row, "TEAM_NAME"));
                TeamGeoCoordinates.apply(t);
                return teamRepository.save(t);
            });

            TeamSeasonStatsId id = new TeamSeasonStatsId(teamId, season);
            TeamSeasonStats stats = teamSeasonStatsRepository.findById(id)
                    .orElseGet(() -> mapper.toTeamSeasonStats(row, season, team));

            stats.setWins(IngestionMapper.intVal(row, "W"));
            stats.setLosses(IngestionMapper.intVal(row, "L"));
            stats.setPts(IngestionMapper.dbl(row, "PTS"));
            stats.setReb(IngestionMapper.dbl(row, "REB"));
            stats.setAst(IngestionMapper.dbl(row, "AST"));

            JsonNode advanced = advancedByTeam.get(teamId);
            if (advanced != null) {
                stats.setOffRtg(IngestionMapper.dbl(advanced, "OFF_RATING"));
                stats.setDefRtg(IngestionMapper.dbl(advanced, "DEF_RATING"));
                stats.setNetRtg(IngestionMapper.dbl(advanced, "NET_RATING"));
                stats.setPace(IngestionMapper.dbl(advanced, "PACE"));
            }

            teamSeasonStatsRepository.save(stats);
            count++;
        }
        return count;
    }
}
