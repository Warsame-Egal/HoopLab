package com.hooplab.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.data.DataClient;
import com.hooplab.data.FetchParser;
import com.hooplab.dto.*;
import com.hooplab.exception.ApiException;
import com.hooplab.util.JsonUtils;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PlayerService {

    private final DataClient dataClient;

    public PlayerService(DataClient dataClient) {
        this.dataClient = dataClient;
    }

    @Cacheable(value = "players", key = "#search + ':' + #page + ':' + #size")
    public PageResponse<PlayerSummaryDto> list(String search, int page, int size) {
        return FetchParser.parsePlayers(dataClient.fetchPlayers(), search, page, size);
    }

    @Cacheable(value = "players", key = "#id")
    public PlayerSummaryDto getById(int id) {
        PageResponse<PlayerSummaryDto> page = list("", 0, Integer.MAX_VALUE);
        return page.content().stream()
                .filter(p -> p.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Player not found"));
    }

    @Cacheable(value = "semiLive", key = "'player-seasons:' + #id")
    public List<PlayerSeasonStatsDto> getSeasons(int id) {
        getById(id);
        List<PlayerSeasonStatsDto> seasons = new ArrayList<>();
        for (String s : SeasonUtils.seasonRange(8)) {
            JsonNode base = dataClient.fetchPlayerSeasonStats(s, "Base");
            JsonNode advanced = dataClient.fetchPlayerSeasonStats(s, "Advanced");
            seasons.addAll(FetchParser.parsePlayerSeasonsForPlayer(base, advanced, id));
        }
        return seasons.stream()
                .filter(s -> s.season() != null)
                .distinct()
                .sorted((a, b) -> b.season().compareTo(a.season()))
                .toList();
    }

    @Cacheable(value = "semiLive", key = "'player-gamelog:' + #id + ':' + #season")
    public List<GameLogDto> getGameLog(int id, String season) {
        getById(id);
        JsonNode response = dataClient.fetchPlayerGameLog(id, season);
        return FetchParser.parsePlayerGameLog(response);
    }

    @Cacheable(value = "static", key = "'shotchart:' + #id + ':' + #season")
    public List<ShotDto> getShotChart(int id, String season) {
        getById(id);
        JsonNode response = dataClient.fetchShotChart(id, season);
        return FetchParser.parseShotChart(response);
    }

    @Cacheable(value = "career", key = "#id")
    public List<CareerSeasonDto> getCareer(int id) {
        getById(id);
        JsonNode response = dataClient.fetchPlayerCareer(id);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<CareerSeasonDto> seasons = new ArrayList<>();
        for (JsonNode row : records) {
            seasons.add(new CareerSeasonDto(
                    JsonUtils.str(row, "SEASON_ID"),
                    JsonUtils.str(row, "TEAM_ABBREVIATION"),
                    JsonUtils.integer(row, "PLAYER_AGE"),
                    JsonUtils.integer(row, "GP"),
                    JsonUtils.dbl(row, "MIN"),
                    JsonUtils.dbl(row, "PTS"),
                    JsonUtils.dbl(row, "REB"),
                    JsonUtils.dbl(row, "AST"),
                    JsonUtils.dbl(row, "STL"),
                    JsonUtils.dbl(row, "BLK"),
                    JsonUtils.dbl(row, "FG_PCT"),
                    JsonUtils.dbl(row, "FG3_PCT"),
                    JsonUtils.dbl(row, "FT_PCT")));
        }
        return seasons;
    }

    @Cacheable(value = "profile", key = "#id")
    public PlayerProfileDto getProfile(int id) {
        getById(id);
        JsonNode response = dataClient.fetchPlayerInfo(id);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray() || records.isEmpty()) {
            return null;
        }
        JsonNode row = records.get(0);
        return new PlayerProfileDto(
                id,
                JsonUtils.str(row, "DISPLAY_FIRST_LAST"),
                JsonUtils.str(row, "POSITION"),
                JsonUtils.integer(row, "TEAM_ID"),
                JsonUtils.str(row, "TEAM_ABBREVIATION"),
                JsonUtils.str(row, "HEIGHT"),
                JsonUtils.str(row, "WEIGHT"),
                JsonUtils.str(row, "JERSEY"),
                JsonUtils.str(row, "COUNTRY"),
                JsonUtils.str(row, "SCHOOL"),
                JsonUtils.integer(row, "DRAFT_YEAR"),
                JsonUtils.str(row, "DRAFT_ROUND"),
                JsonUtils.str(row, "DRAFT_NUMBER"),
                JsonUtils.integer(row, "SEASON_EXP"),
                trimDate(JsonUtils.str(row, "BIRTHDATE")),
                "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + id + ".png");
    }

    @Cacheable(value = "trends", key = "'player:' + #id + ':' + #stat")
    public List<TrendPointDto> getTrends(int id, String stat) {
        getById(id);
        String measure = playerTrendMeasure(stat);
        List<TrendPointDto> points = new ArrayList<>();
        for (String s : SeasonUtils.seasonRange(8)) {
            JsonNode stats = dataClient.fetchPlayerSeasonStats(s, measure);
            points.addAll(FetchParser.parsePlayerTrends(stats, id, stat, s));
        }
        return points.stream()
                .filter(p -> p.season() != null && p.value() != null)
                .sorted(Comparator.comparing(TrendPointDto::season))
                .toList();
    }

    private static String playerTrendMeasure(String stat) {
        if (stat == null) {
            return "Base";
        }
        return switch (stat.trim().toUpperCase()) {
            case "TS_PCT", "USG_PCT", "OFF_RATING", "DEF_RATING", "NET_RATING" -> "Advanced";
            default -> "Base";
        };
    }

    @Cacheable(value = "profile", key = "'awards:' + #id")
    public String getAwards(int id) {
        return dataClient.getPlayerDepth("/player/" + id + "/awards");
    }

    @Cacheable(value = "semiLive", key = "'next:' + #id")
    public String getNextGames(int id) {
        return dataClient.getPlayerDepth("/player/" + id + "/next-games");
    }

    @Cacheable(value = "semiLive", key = "'psplits:' + #id + ':' + #type + ':' + (#season == null ? 'cur' : #season)")
    public String getPlayerSplits(int id, String type, String season) {
        String s = season != null ? season : SeasonUtils.currentSeason();
        return dataClient.getPlayerDepth("/player/" + id + "/splits?type=" + type + "&season=" + s);
    }

    @Cacheable(value = "semiLive", key = "'pest:' + #id + ':' + (#season == null ? 'cur' : #season)")
    public String getEstimatedMetrics(int id, String season) {
        String s = season != null ? season : SeasonUtils.currentSeason();
        return dataClient.getPlayerDepth("/player/" + id + "/estimated-metrics?season=" + s);
    }

    private static String trimDate(String value) {
        if (value == null) {
            return null;
        }
        int t = value.indexOf('T');
        return t > 0 ? value.substring(0, t) : value;
    }
}
