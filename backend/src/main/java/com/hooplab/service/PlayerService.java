package com.hooplab.service;

import com.hooplab.domain.Player;
import com.hooplab.domain.PlayerGameLog;
import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.domain.Shot;
import com.hooplab.dto.CareerSeasonDto;
import com.hooplab.dto.GameLogDto;
import com.hooplab.dto.PageResponse;
import com.hooplab.dto.PlayerProfileDto;
import com.hooplab.dto.PlayerSeasonStatsDto;
import com.hooplab.dto.PlayerSummaryDto;
import com.hooplab.dto.ShotDto;
import com.hooplab.dto.TrendPointDto;
import com.hooplab.exception.ApiException;
import com.hooplab.ingestion.IngestionClient;
import com.hooplab.ingestion.IngestionMapper;
import com.hooplab.repository.PlayerGameLogRepository;
import com.hooplab.repository.PlayerRepository;
import com.hooplab.repository.PlayerSeasonStatsRepository;
import com.hooplab.repository.ShotRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PlayerSeasonStatsRepository playerSeasonStatsRepository;
    private final PlayerGameLogRepository playerGameLogRepository;
    private final ShotRepository shotRepository;
    private final IngestionClient ingestionClient;
    private final IngestionMapper ingestionMapper;

    public PlayerService(PlayerRepository playerRepository,
                         PlayerSeasonStatsRepository playerSeasonStatsRepository,
                         PlayerGameLogRepository playerGameLogRepository,
                         ShotRepository shotRepository,
                         IngestionClient ingestionClient,
                         IngestionMapper ingestionMapper) {
        this.playerRepository = playerRepository;
        this.playerSeasonStatsRepository = playerSeasonStatsRepository;
        this.playerGameLogRepository = playerGameLogRepository;
        this.shotRepository = shotRepository;
        this.ingestionClient = ingestionClient;
        this.ingestionMapper = ingestionMapper;
    }

    @Cacheable("players")
    public PageResponse<PlayerSummaryDto> list(String search, int page, int size) {
        Page<Player> result = playerRepository.search(search == null ? "" : search, PageRequest.of(page, size));
        List<PlayerSummaryDto> content = result.getContent().stream().map(this::toSummary).toList();
        return new PageResponse<>(content, page, size, result.getTotalElements(), result.getTotalPages());
    }

    @Cacheable(value = "players", key = "#id")
    public PlayerSummaryDto getById(int id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found"));
        return toSummary(player);
    }

    public List<PlayerSeasonStatsDto> getSeasons(int id) {
        if (!playerRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found");
        }
        return playerSeasonStatsRepository.findByPlayerPlayerIdOrderByIdSeasonDesc(id).stream()
                .map(this::toSeasonStats)
                .toList();
    }

    @Transactional
    public List<GameLogDto> getGameLog(int id, String season) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found"));

        List<PlayerGameLog> cached = playerGameLogRepository
                .findByPlayerPlayerIdAndSeasonOrderByGameDateDesc(id, season);
        if (!cached.isEmpty()) {
            return cached.stream().map(this::toGameLog).toList();
        }

        JsonNode response = ingestionClient.fetchPlayerGameLog(id, season);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray() || records.isEmpty()) {
            return List.of();
        }

        playerGameLogRepository.deleteByPlayerPlayerIdAndSeason(id, season);
        for (JsonNode row : records) {
            playerGameLogRepository.save(ingestionMapper.toGameLog(row, player, season));
        }

        return playerGameLogRepository.findByPlayerPlayerIdAndSeasonOrderByGameDateDesc(id, season).stream()
                .map(this::toGameLog)
                .toList();
    }

    @Transactional
    public List<ShotDto> getShotChart(int id, String season) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found"));

        List<Shot> cached = shotRepository.findByPlayerPlayerIdAndSeason(id, season);
        if (!cached.isEmpty()) {
            return cached.stream().map(this::toShot).toList();
        }

        JsonNode response = ingestionClient.fetchShotChart(id, season);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray() || records.isEmpty()) {
            return List.of();
        }

        shotRepository.deleteByPlayerPlayerIdAndSeason(id, season);
        for (JsonNode row : records) {
            shotRepository.save(ingestionMapper.toShot(row, player, season));
        }

        return shotRepository.findByPlayerPlayerIdAndSeason(id, season).stream()
                .map(this::toShot)
                .toList();
    }

    @Cacheable(value = "career", key = "#id")
    public List<CareerSeasonDto> getCareer(int id) {
        if (!playerRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found");
        }
        JsonNode response = ingestionClient.fetchPlayerCareer(id);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<CareerSeasonDto> seasons = new java.util.ArrayList<>();
        for (JsonNode row : records) {
            seasons.add(new CareerSeasonDto(
                    str(row, "SEASON_ID"),
                    str(row, "TEAM_ABBREVIATION"),
                    integer(row, "PLAYER_AGE"),
                    integer(row, "GP"),
                    dbl(row, "MIN"),
                    dbl(row, "PTS"),
                    dbl(row, "REB"),
                    dbl(row, "AST"),
                    dbl(row, "STL"),
                    dbl(row, "BLK"),
                    dbl(row, "FG_PCT"),
                    dbl(row, "FG3_PCT"),
                    dbl(row, "FT_PCT")));
        }
        return seasons;
    }

    @Cacheable(value = "profile", key = "#id")
    public PlayerProfileDto getProfile(int id) {
        if (!playerRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found");
        }
        JsonNode response = ingestionClient.fetchPlayerInfo(id);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray() || records.isEmpty()) {
            return null;
        }
        JsonNode row = records.get(0);
        return new PlayerProfileDto(
                id,
                str(row, "DISPLAY_FIRST_LAST"),
                str(row, "POSITION"),
                integer(row, "TEAM_ID"),
                str(row, "TEAM_ABBREVIATION"),
                str(row, "HEIGHT"),
                str(row, "WEIGHT"),
                str(row, "JERSEY"),
                str(row, "COUNTRY"),
                str(row, "SCHOOL"),
                integer(row, "DRAFT_YEAR"),
                str(row, "DRAFT_ROUND"),
                str(row, "DRAFT_NUMBER"),
                integer(row, "SEASON_EXP"),
                trimDate(str(row, "BIRTHDATE")),
                "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + id + ".png");
    }

    @Cacheable(value = "trends", key = "'player:' + #id + ':' + #stat")
    public List<TrendPointDto> getTrends(int id, String stat) {
        if (!playerRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found");
        }
        return playerSeasonStatsRepository.findByPlayerPlayerIdOrderByIdSeasonAsc(id).stream()
                .map(entry -> new TrendPointDto(
                        entry.getId().getSeason(),
                        StatTrendExtractor.playerValue(entry, stat)))
                .toList();
    }

    private PlayerSummaryDto toSummary(Player player) {
        return new PlayerSummaryDto(
                player.getPlayerId(),
                player.getFullName(),
                player.getFirstName(),
                player.getLastName(),
                player.getPosition(),
                player.getTeam() == null ? null : player.getTeam().getTeamId(),
                player.getTeam() == null ? null : player.getTeam().getAbbreviation(),
                player.isActive(),
                player.getFromYear(),
                player.getToYear(),
                player.getHeadshotUrl()
        );
    }

    private PlayerSeasonStatsDto toSeasonStats(PlayerSeasonStats stats) {
        return new PlayerSeasonStatsDto(
                stats.getId().getSeason(),
                stats.getTeam() == null ? null : stats.getTeam().getTeamId(),
                stats.getGp(),
                stats.getMin(),
                stats.getPts(),
                stats.getReb(),
                stats.getAst(),
                stats.getStl(),
                stats.getBlk(),
                stats.getTov(),
                stats.getFgPct(),
                stats.getFg3Pct(),
                stats.getFtPct(),
                stats.getTsPct(),
                stats.getUsgPct(),
                stats.getPlusMinus()
        );
    }

    private GameLogDto toGameLog(PlayerGameLog log) {
        return new GameLogDto(
                log.getGameId(),
                log.getGameDate(),
                log.getMatchup(),
                log.getWl(),
                log.getMin(),
                log.getPts(),
                log.getReb(),
                log.getAst(),
                log.getStl(),
                log.getBlk(),
                log.getTov(),
                log.getPlusMinus()
        );
    }

    private ShotDto toShot(Shot shot) {
        return new ShotDto(
                shot.getLocX(),
                shot.getLocY(),
                shot.getShotMade(),
                shot.getShotZone(),
                shot.getShotType(),
                shot.getShotDistance()
        );
    }

    private static String str(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private static Integer integer(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.intValue();
        }
        try {
            return (int) Double.parseDouble(value.asText());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Double dbl(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.doubleValue();
        }
        try {
            return Double.parseDouble(value.asText());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String trimDate(String value) {
        if (value == null) {
            return null;
        }
        int t = value.indexOf('T');
        return t > 0 ? value.substring(0, t) : value;
    }
}
