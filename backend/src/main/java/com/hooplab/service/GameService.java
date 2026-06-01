package com.hooplab.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.domain.Game;
import com.hooplab.dto.AdvancedBoxScoreDto;
import com.hooplab.dto.AdvancedRowDto;
import com.hooplab.dto.BoxScoreDto;
import com.hooplab.dto.BoxScorePlayerDto;
import com.hooplab.dto.BoxScoreTeamDto;
import com.hooplab.dto.GameDto;
import com.hooplab.exception.ApiException;
import com.hooplab.ingestion.IngestionClient;
import com.hooplab.repository.GameRepository;
import com.hooplab.util.JsonUtils;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GameService {

    private static final List<String[]> ADVANCED_COLUMNS = List.of(
            new String[]{"OFF_RATING", "OffRtg"},
            new String[]{"DEF_RATING", "DefRtg"},
            new String[]{"NET_RATING", "NetRtg"},
            new String[]{"AST_PCT", "AST%"},
            new String[]{"REB_PCT", "REB%"},
            new String[]{"TS_PCT", "TS%"},
            new String[]{"USG_PCT", "USG%"},
            new String[]{"PACE", "Pace"},
            new String[]{"PIE", "PIE"}
    );

    private static final List<String[]> FOUR_FACTORS_COLUMNS = List.of(
            new String[]{"EFG_PCT", "eFG%"},
            new String[]{"FTA_RATE", "FTA Rate"},
            new String[]{"TM_TOV_PCT", "TOV%"},
            new String[]{"OREB_PCT", "OREB%"},
            new String[]{"OPP_EFG_PCT", "Opp eFG%"},
            new String[]{"OPP_FTA_RATE", "Opp FTA"},
            new String[]{"OPP_TOV_PCT", "Opp TOV%"},
            new String[]{"OPP_OREB_PCT", "Opp OREB%"}
    );

    private final IngestionClient ingestionClient;
    private final GameRepository gameRepository;

    public GameService(IngestionClient ingestionClient, GameRepository gameRepository) {
        this.ingestionClient = ingestionClient;
        this.gameRepository = gameRepository;
    }

    @Cacheable(value = "games", key = "#season + ':' + #limit")
    public List<GameDto> getRecentGames(String season, int limit) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        int capped = Math.min(Math.max(limit, 1), 100);
        return gameRepository.findBySeasonOrderByGameDateDesc(resolvedSeason, PageRequest.of(0, capped))
                .stream()
                .map(this::toGameDto)
                .toList();
    }

    public List<GameDto> getGamesByDate(LocalDate date) {
        return gameRepository.findByGameDateOrderByGameIdAsc(date).stream()
                .map(this::toGameDto)
                .toList();
    }

    @Cacheable(value = "boxscore", key = "#gameId")
    public BoxScoreDto getBoxScore(String gameId) {
        JsonNode response = ingestionClient.fetchBoxScore(gameId);
        JsonNode playerStats = response.get("player_stats");
        JsonNode teamStats = response.get("team_stats");

        if (teamStats == null || !teamStats.isArray() || teamStats.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "No box score available for game " + gameId);
        }

        Map<Integer, List<BoxScorePlayerDto>> playersByTeam = new LinkedHashMap<>();
        if (playerStats != null && playerStats.isArray()) {
            for (JsonNode row : playerStats) {
                Integer teamId = JsonUtils.integer(row, "TEAM_ID");
                playersByTeam.computeIfAbsent(teamId, k -> new ArrayList<>()).add(toPlayer(row));
            }
        }

        List<BoxScoreTeamDto> teams = new ArrayList<>();
        for (JsonNode teamRow : teamStats) {
            Integer teamId = JsonUtils.integer(teamRow, "TEAM_ID");
            teams.add(new BoxScoreTeamDto(
                    teamId,
                    JsonUtils.str(teamRow, "TEAM_ABBREVIATION"),
                    JsonUtils.str(teamRow, "TEAM_NAME"),
                    JsonUtils.integer(teamRow, "PTS"),
                    JsonUtils.integer(teamRow, "REB"),
                    JsonUtils.integer(teamRow, "AST"),
                    playersByTeam.getOrDefault(teamId, List.of())));
        }

        return new BoxScoreDto(gameId, teams);
    }

    @Cacheable(value = "advancedBoxscore", key = "#gameId + ':' + #measure")
    public AdvancedBoxScoreDto getAdvancedBoxScore(String gameId, String measure) {
        String resolved = measure == null ? "advanced" : measure.trim().toLowerCase();
        List<String[]> columns = switch (resolved) {
            case "fourfactors" -> FOUR_FACTORS_COLUMNS;
            case "advanced" -> ADVANCED_COLUMNS;
            default -> throw new ApiException(HttpStatus.BAD_REQUEST.value(),
                    "Unsupported advanced measure: " + measure);
        };

        JsonNode response = ingestionClient.fetchBoxScore(gameId, resolved);
        JsonNode playerStats = response.get("player_stats");
        JsonNode teamStats = response.get("team_stats");

        if (teamStats == null || !teamStats.isArray() || teamStats.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "No advanced box score available for game " + gameId);
        }

        List<String> labels = columns.stream().map(c -> c[1]).toList();
        List<AdvancedRowDto> teamRows = new ArrayList<>();
        for (JsonNode row : teamStats) {
            teamRows.add(new AdvancedRowDto(
                    JsonUtils.integer(row, "TEAM_ID"),
                    null,
                    JsonUtils.str(row, "TEAM_NAME"),
                    JsonUtils.str(row, "TEAM_ABBREVIATION"),
                    extractValues(row, columns)));
        }

        List<AdvancedRowDto> playerRows = new ArrayList<>();
        if (playerStats != null && playerStats.isArray()) {
            for (JsonNode row : playerStats) {
                playerRows.add(new AdvancedRowDto(
                        JsonUtils.integer(row, "TEAM_ID"),
                        JsonUtils.integer(row, "PLAYER_ID"),
                        JsonUtils.str(row, "PLAYER_NAME"),
                        JsonUtils.str(row, "TEAM_ABBREVIATION"),
                        extractValues(row, columns)));
            }
        }

        return new AdvancedBoxScoreDto(gameId, resolved, labels, teamRows, playerRows);
    }

    private List<Double> extractValues(JsonNode row, List<String[]> columns) {
        List<Double> values = new ArrayList<>(columns.size());
        for (String[] column : columns) {
            values.add(JsonUtils.dbl(row, column[0]));
        }
        return values;
    }

    private GameDto toGameDto(Game game) {
        return new GameDto(
                game.getGameId(),
                game.getSeason(),
                game.getGameDate(),
                game.getHomeTeamId(),
                game.getAwayTeamId(),
                game.getHomeAbbr(),
                game.getAwayAbbr(),
                game.getHomePts(),
                game.getAwayPts(),
                game.getMatchup());
    }

    private BoxScorePlayerDto toPlayer(JsonNode row) {
        return new BoxScorePlayerDto(
                JsonUtils.integer(row, "PLAYER_ID"),
                JsonUtils.str(row, "PLAYER_NAME"),
                JsonUtils.str(row, "START_POSITION"),
                JsonUtils.str(row, "MIN"),
                JsonUtils.integer(row, "PTS"),
                JsonUtils.integer(row, "REB"),
                JsonUtils.integer(row, "AST"),
                JsonUtils.integer(row, "STL"),
                JsonUtils.integer(row, "BLK"),
                JsonUtils.integer(row, "TO"),
                JsonUtils.integer(row, "FGM"),
                JsonUtils.integer(row, "FGA"),
                JsonUtils.integer(row, "FG3M"),
                JsonUtils.integer(row, "FG3A"),
                JsonUtils.integer(row, "FTM"),
                JsonUtils.integer(row, "FTA"),
                JsonUtils.integer(row, "PLUS_MINUS"));
    }
}
