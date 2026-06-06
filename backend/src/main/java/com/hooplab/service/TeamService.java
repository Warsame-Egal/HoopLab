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
import java.util.Map;

@Service
public class TeamService {

    private final DataClient dataClient;

    public TeamService(DataClient dataClient) {
        this.dataClient = dataClient;
    }

    @Cacheable("teams")
    public List<TeamSummaryDto> list() {
        return FetchParser.parseTeams(dataClient.fetchTeams());
    }

    @Cacheable(value = "teams", key = "#id")
    public TeamSummaryDto getById(int id) {
        return list().stream()
                .filter(t -> t.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found"));
    }

    @Cacheable(value = "semiLive", key = "'team-seasons:' + #id")
    public List<TeamSeasonStatsDto> getSeasons(int id) {
        getById(id);
        List<TeamSeasonStatsDto> seasons = new ArrayList<>();
        for (String s : SeasonUtils.seasonRange(8)) {
            JsonNode stats = dataClient.fetchTeamSeasonStats(s, "Advanced");
            seasons.addAll(FetchParser.parseTeamSeasons(stats, id));
        }
        return seasons;
    }

    @Cacheable(value = "teamMap", key = "#season")
    public List<TeamMapDto> getMap(String season) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        Map<Integer, TeamSummaryDto> teamsById = FetchParser.teamsById(list());
        JsonNode teamStats = dataClient.fetchTeamSeasonStats(resolvedSeason, "Advanced");
        JsonNode clutch = dataClient.fetchTeamClutch(resolvedSeason, "Advanced");
        return FetchParser.parseTeamMap(teamStats, clutch, resolvedSeason, teamsById);
    }

    @Cacheable(value = "lineups", key = "#id + ':' + (#season == null ? 'current' : #season)")
    public List<LineupDto> getLineups(int id, String season) {
        getById(id);
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode response = dataClient.fetchLineups(id, resolvedSeason);
        JsonNode records = response.get("records");
        List<LineupDto> lineups = new ArrayList<>();
        if (records != null && records.isArray()) {
            for (JsonNode row : records) {
                lineups.add(new LineupDto(
                        JsonUtils.str(row, "GROUP_NAME"),
                        JsonUtils.integer(row, "GP"),
                        JsonUtils.dbl(row, "MIN"),
                        JsonUtils.dbl(row, "OFF_RATING"),
                        JsonUtils.dbl(row, "DEF_RATING"),
                        JsonUtils.dbl(row, "NET_RATING")));
            }
        }
        return lineups.stream()
                .sorted(Comparator.comparing(
                        (LineupDto l) -> l.min() == null ? 0.0 : l.min()).reversed())
                .limit(15)
                .toList();
    }

    @Cacheable(value = "roster", key = "#id + ':' + #season")
    public List<RosterEntryDto> getRoster(int id, String season) {
        getById(id);
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode stats = dataClient.fetchPlayerSeasonStats(resolvedSeason, "Base");
        return FetchParser.parseRoster(stats, id, resolvedSeason);
    }

    @Cacheable(value = "semiLive", key = "'team-gamelog:' + #id + ':' + #season")
    public List<TeamGameLogDto> getGameLog(int id, String season) {
        getById(id);
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode response = dataClient.fetchTeamGameLog(id, resolvedSeason);
        return FetchParser.parseTeamGameLog(response);
    }

    @Cacheable(value = "officialRoster", key = "#id + ':' + (#season == null ? 'current' : #season)")
    public OfficialRosterDto getOfficialRoster(int id, String season) {
        getById(id);
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode response = dataClient.fetchTeamRoster(id, resolvedSeason);

        List<RosterPlayerDto> players = new ArrayList<>();
        JsonNode playerRows = response.get("players");
        if (playerRows != null && playerRows.isArray()) {
            for (JsonNode row : playerRows) {
                Integer age = JsonUtils.integer(row, "AGE");
                players.add(new RosterPlayerDto(
                        JsonUtils.integer(row, "PLAYER_ID"),
                        JsonUtils.str(row, "PLAYER"),
                        JsonUtils.str(row, "NUM"),
                        JsonUtils.str(row, "POSITION"),
                        JsonUtils.str(row, "HEIGHT"),
                        JsonUtils.str(row, "WEIGHT"),
                        age == null ? null : age.toString(),
                        JsonUtils.str(row, "EXP"),
                        JsonUtils.str(row, "SCHOOL")));
            }
        }

        List<CoachDto> coaches = new ArrayList<>();
        JsonNode coachRows = response.get("coaches");
        if (coachRows != null && coachRows.isArray()) {
            for (JsonNode row : coachRows) {
                coaches.add(new CoachDto(
                        JsonUtils.str(row, "COACH_NAME"),
                        JsonUtils.str(row, "COACH_TYPE")));
            }
        }

        return new OfficialRosterDto(players, coaches);
    }

    @Cacheable(value = "trends", key = "'team:' + #id + ':' + #stat")
    public List<TrendPointDto> getTrends(int id, String stat) {
        getById(id);
        String measure = teamTrendMeasure(stat);
        List<TrendPointDto> points = new ArrayList<>();
        for (String s : SeasonUtils.seasonRange(8)) {
            JsonNode stats = dataClient.fetchTeamSeasonStats(s, measure);
            points.addAll(FetchParser.parseTeamTrends(stats, id, stat, s));
        }
        return points.stream()
                .filter(p -> p.season() != null && p.value() != null)
                .sorted(Comparator.comparing(TrendPointDto::season))
                .toList();
    }

    private static String teamTrendMeasure(String stat) {
        if (stat == null) {
            return "Advanced";
        }
        return switch (stat.trim().toUpperCase()) {
            case "WIN_PCT", "W_PCT", "PTS", "PPG", "REB", "AST" -> "Base";
            default -> "Advanced";
        };
    }

    @Cacheable(value = "teams", key = "'info:' + #id + ':' + (#season == null ? 'cur' : #season)")
    public String getInfo(int id, String season) {
        String s = season != null ? season : SeasonUtils.currentSeason();
        return dataClient.getTeamDepth("/team/" + id + "/info?season=" + s);
    }

    @Cacheable(value = "teams", key = "'yby:' + #id")
    public String getYearByYear(int id) {
        return dataClient.getTeamDepth("/team/" + id + "/year-by-year");
    }

    @Cacheable(value = "semiLive", key = "'tsplits:' + #id + ':' + #type + ':' + (#season == null ? 'cur' : #season)")
    public String getTeamSplits(int id, String type, String season) {
        String s = season != null ? season : SeasonUtils.currentSeason();
        return dataClient.getTeamDepth("/team/" + id + "/splits?type=" + type + "&season=" + s);
    }

    @Cacheable(value = "semiLive", key = "'onoff:' + #id + ':' + (#season == null ? 'cur' : #season)")
    public String getOnOff(int id, String season) {
        String s = season != null ? season : SeasonUtils.currentSeason();
        return dataClient.getTeamDepth("/team/" + id + "/on-off?season=" + s);
    }

    @Cacheable(value = "teams", key = "'franchise:' + #id")
    public String getFranchiseLeaders(int id) {
        return dataClient.getTeamDepth("/team/" + id + "/franchise-leaders");
    }
}
