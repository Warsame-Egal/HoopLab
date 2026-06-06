package com.hooplab.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.dto.*;
import com.hooplab.util.JsonUtils;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

public final class FetchParser {

    private FetchParser() {
    }

    public static List<TeamSummaryDto> parseTeams(JsonNode response) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<TeamSummaryDto> teams = new ArrayList<>();
        for (JsonNode row : records) {
            String abbr = JsonUtils.str(row, "abbreviation");
            TeamGeo.Geo geo = TeamGeo.forAbbreviation(abbr).orElse(null);
            teams.add(new TeamSummaryDto(
                    JsonUtils.integer(row, "team_id"),
                    abbr,
                    JsonUtils.str(row, "city"),
                    JsonUtils.str(row, "name"),
                    JsonUtils.str(row, "full_name"),
                    geo != null ? geo.conference() : null,
                    geo != null ? geo.division() : null,
                    JsonUtils.integer(row, "year_founded")));
        }
        teams.sort(Comparator.comparing(TeamSummaryDto::fullName, Comparator.nullsLast(String::compareTo)));
        return teams;
    }

    public static PageResponse<PlayerSummaryDto> parsePlayers(
            JsonNode response, String search, int page, int size) {
        JsonNode index = response.get("player_index");
        if (index == null || !index.isArray()) {
            return new PageResponse<>(List.of(), page, size, 0, 0);
        }
        String needle = search == null ? "" : search.trim().toLowerCase();
        List<PlayerSummaryDto> all = new ArrayList<>();
        for (JsonNode row : index) {
            String fullName = playerFullName(row);
            if (!needle.isEmpty() && (fullName == null || !fullName.toLowerCase().contains(needle))) {
                continue;
            }
            Integer playerId = JsonUtils.integer(row, "PERSON_ID");
            if (playerId == null) {
                continue;
            }
            all.add(new PlayerSummaryDto(
                    playerId,
                    fullName,
                    JsonUtils.str(row, "PLAYER_FIRST_NAME"),
                    JsonUtils.str(row, "PLAYER_LAST_NAME"),
                    JsonUtils.str(row, "POSITION"),
                    JsonUtils.integer(row, "TEAM_ID"),
                    JsonUtils.str(row, "TEAM_ABBREVIATION"),
                    isActive(row.get("ROSTER_STATUS")),
                    JsonUtils.integer(row, "FROM_YEAR"),
                    JsonUtils.integer(row, "TO_YEAR"),
                    headshotUrl(playerId)));
        }
        all.sort(Comparator.comparing(PlayerSummaryDto::fullName, Comparator.nullsLast(String::compareTo)));
        int total = all.size();
        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) total / size);
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        return new PageResponse<>(all.subList(from, to), page, size, total, totalPages);
    }

    public static List<PlayerSeasonStatsDto> parsePlayerSeasonsForPlayer(
            JsonNode baseStats, JsonNode advancedStats, int playerId) {
        Map<String, JsonNode> advancedBySeason = indexPlayerSeasons(advancedStats, playerId);
        List<PlayerSeasonStatsDto> result = new ArrayList<>();
        JsonNode records = baseStats.get("records");
        if (records == null || !records.isArray()) {
            return result;
        }
        String baseSeason = JsonUtils.str(baseStats, "season");
        for (JsonNode row : records) {
            if (!Objects.equals(JsonUtils.integer(row, "PLAYER_ID"), playerId)) {
                continue;
            }
            String season = seasonFromRow(row, baseSeason);
            if (season == null) {
                continue;
            }
            JsonNode adv = advancedBySeason.get(season);
            result.add(new PlayerSeasonStatsDto(
                    season,
                    JsonUtils.integer(row, "TEAM_ID"),
                    JsonUtils.integer(row, "GP"),
                    JsonUtils.dbl(row, "MIN"),
                    JsonUtils.dbl(row, "PTS"),
                    JsonUtils.dbl(row, "REB"),
                    JsonUtils.dbl(row, "AST"),
                    JsonUtils.dbl(row, "STL"),
                    JsonUtils.dbl(row, "BLK"),
                    JsonUtils.dbl(row, "TOV"),
                    JsonUtils.dbl(row, "FG_PCT"),
                    JsonUtils.dbl(row, "FG3_PCT"),
                    JsonUtils.dbl(row, "FT_PCT"),
                    adv != null ? JsonUtils.dbl(adv, "TS_PCT") : null,
                    adv != null ? JsonUtils.dbl(adv, "USG_PCT") : null,
                    JsonUtils.dbl(row, "PLUS_MINUS")));
        }
        result.sort(Comparator.comparing(PlayerSeasonStatsDto::season).reversed());
        return result;
    }

    public static List<RosterEntryDto> parseRoster(JsonNode playerStats, int teamId, String season) {
        JsonNode records = playerStats.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<RosterEntryDto> roster = new ArrayList<>();
        for (JsonNode row : records) {
            if (!Objects.equals(JsonUtils.integer(row, "TEAM_ID"), teamId)) {
                continue;
            }
            roster.add(new RosterEntryDto(
                    JsonUtils.integer(row, "PLAYER_ID"),
                    firstNonBlank(JsonUtils.str(row, "PLAYER_NAME"), JsonUtils.str(row, "PLAYER")),
                    null,
                    JsonUtils.integer(row, "GP"),
                    JsonUtils.dbl(row, "MIN"),
                    JsonUtils.dbl(row, "PTS"),
                    JsonUtils.dbl(row, "REB"),
                    JsonUtils.dbl(row, "AST"),
                    JsonUtils.dbl(row, "FG_PCT"),
                    JsonUtils.dbl(row, "FG3_PCT"),
                    JsonUtils.dbl(row, "TS_PCT"),
                    JsonUtils.dbl(row, "USG_PCT")));
        }
        roster.sort(Comparator.comparing(RosterEntryDto::pts, Comparator.nullsLast(Comparator.reverseOrder())));
        return roster;
    }

    public static List<TeamSeasonStatsDto> parseTeamSeasons(JsonNode response, int teamId) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<TeamSeasonStatsDto> seasons = new ArrayList<>();
        for (JsonNode row : records) {
            if (!Objects.equals(JsonUtils.integer(row, "TEAM_ID"), teamId)) {
                continue;
            }
            seasons.add(toTeamSeasonStatsDto(row));
        }
        seasons.sort(Comparator.comparing(TeamSeasonStatsDto::season).reversed());
        return seasons;
    }

    public static List<TeamMapDto> parseTeamMap(
            JsonNode teamStats, JsonNode clutchStats, String season, Map<Integer, TeamSummaryDto> teamsById) {
        Map<Integer, Double> clutchNet = new HashMap<>();
        JsonNode clutchRecords = clutchStats.get("records");
        if (clutchRecords != null && clutchRecords.isArray()) {
            for (JsonNode row : clutchRecords) {
                Integer tid = JsonUtils.integer(row, "TEAM_ID");
                if (tid != null) {
                    clutchNet.put(tid, JsonUtils.dbl(row, "NET_RATING"));
                }
            }
        }
        JsonNode records = teamStats.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<TeamMapDto> points = new ArrayList<>();
        for (JsonNode row : records) {
            Integer teamId = JsonUtils.integer(row, "TEAM_ID");
            if (teamId == null) {
                continue;
            }
            TeamSummaryDto team = teamsById.get(teamId);
            if (team == null) {
                continue;
            }
            TeamGeo.Geo geo = TeamGeo.forAbbreviation(team.abbreviation()).orElse(null);
            if (geo == null) {
                continue;
            }
            Integer wins = JsonUtils.integer(row, "W");
            Integer losses = JsonUtils.integer(row, "L");
            Double netRtg = JsonUtils.dbl(row, "NET_RATING");
            points.add(new TeamMapDto(
                    teamId,
                    team.abbreviation(),
                    team.name(),
                    team.fullName(),
                    geo.latitude(),
                    geo.longitude(),
                    wins,
                    losses,
                    netRtg,
                    clutchNet.get(teamId),
                    team.conference()));
        }
        return points;
    }

    public static List<StandingRowDto> parseStandingsRows(
            JsonNode standings,
            Map<Integer, Double> netByTeam,
            Map<Integer, TeamSummaryDto> teamsById,
            String conferenceFilter) {
        JsonNode records = standings.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<StandingRowDto> rows = new ArrayList<>();
        for (JsonNode row : records) {
            String conf = JsonUtils.str(row, "Conference");
            if (conferenceFilter != null && conf != null
                    && !conferenceFilter.equalsIgnoreCase(conf)) {
                continue;
            }
            Integer teamId = JsonUtils.integer(row, "TeamID");
            TeamSummaryDto team = teamId != null ? teamsById.get(teamId) : null;
            String abbreviation = firstNonBlank(
                    JsonUtils.str(row, "TeamAbbreviation"),
                    team != null ? team.abbreviation() : null);
            String fullName = firstNonBlank(
                    team != null ? team.fullName() : null,
                    joinTeamName(JsonUtils.str(row, "TeamCity"), JsonUtils.str(row, "TeamName")));
            rows.add(new StandingRowDto(
                    teamId,
                    abbreviation,
                    fullName,
                    conf,
                    JsonUtils.str(row, "Division"),
                    JsonUtils.integer(row, "PlayoffRank"),
                    JsonUtils.integer(row, "DivisionRank"),
                    JsonUtils.integer(row, "WINS"),
                    JsonUtils.integer(row, "LOSSES"),
                    JsonUtils.dbl(row, "WinPCT"),
                    JsonUtils.str(row, "HOME"),
                    JsonUtils.str(row, "ROAD"),
                    JsonUtils.str(row, "L10"),
                    trimStreak(JsonUtils.str(row, "strCurrentStreak")),
                    JsonUtils.dbl(row, "ConferenceGamesBack"),
                    trimStreak(JsonUtils.str(row, "ClinchIndicator")),
                    teamId != null ? netByTeam.get(teamId) : null));
        }
        return rows;
    }

    public static List<LeaderDto> parseLeaders(JsonNode response, int limit) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<LeaderDto> leaders = new ArrayList<>();
        int rank = 1;
        for (JsonNode row : records) {
            if (leaders.size() >= limit) {
                break;
            }
            Integer playerId = JsonUtils.integer(row, "PLAYER_ID");
            if (playerId == null) {
                playerId = JsonUtils.integer(row, "PLAYER");
            }
            leaders.add(new LeaderDto(
                    rank++,
                    playerId,
                    JsonUtils.str(row, "PLAYER"),
                    JsonUtils.str(row, "TEAM"),
                    leaderValue(row),
                    JsonUtils.integer(row, "GP")));
        }
        return leaders;
    }

    public static List<TeamLeaderDto> parseTopTeamsByNet(JsonNode teamStats, Map<Integer, TeamSummaryDto> teamsById, int limit) {
        JsonNode records = teamStats.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<JsonNode> sorted = new ArrayList<>();
        records.forEach(sorted::add);
        sorted.sort(Comparator.comparing(
                (JsonNode r) -> JsonUtils.dbl(r, "NET_RATING"),
                Comparator.nullsLast(Comparator.reverseOrder())));
        List<TeamLeaderDto> leaders = new ArrayList<>();
        int rank = 1;
        for (JsonNode row : sorted) {
            if (leaders.size() >= limit) {
                break;
            }
            Integer teamId = JsonUtils.integer(row, "TEAM_ID");
            TeamSummaryDto team = teamId != null ? teamsById.get(teamId) : null;
            if (team == null) {
                continue;
            }
            leaders.add(new TeamLeaderDto(
                    rank++,
                    teamId,
                    team.fullName(),
                    team.abbreviation(),
                    JsonUtils.dbl(row, "NET_RATING"),
                    JsonUtils.integer(row, "W"),
                    JsonUtils.integer(row, "L")));
        }
        return leaders;
    }

    public static LeagueAverages parseLeagueAverages(JsonNode playerStats, String season) {
        JsonNode records = playerStats.get("records");
        if (records == null || !records.isArray()) {
            return LeagueAverages.empty();
        }
        double sumPts = 0, sumReb = 0, sumAst = 0, sumFg = 0, sumFg3 = 0;
        int count = 0;
        for (JsonNode row : records) {
            Integer gp = JsonUtils.integer(row, "GP");
            if (gp == null || gp < 10) {
                continue;
            }
            sumPts += nz(JsonUtils.dbl(row, "PTS"));
            sumReb += nz(JsonUtils.dbl(row, "REB"));
            sumAst += nz(JsonUtils.dbl(row, "AST"));
            sumFg += nz(JsonUtils.dbl(row, "FG_PCT"));
            sumFg3 += nz(JsonUtils.dbl(row, "FG3_PCT"));
            count++;
        }
        if (count == 0) {
            return LeagueAverages.empty();
        }
        return new LeagueAverages(
                sumPts / count, sumReb / count, sumAst / count, sumFg / count, sumFg3 / count);
    }

    public static List<TrendPointDto> parseLeagueScoringTrend(DataClient client, int seasonsBack) {
        List<TrendPointDto> trend = new ArrayList<>();
        for (String season : com.hooplab.util.SeasonUtils.seasonRange(seasonsBack)) {
            try {
                JsonNode stats = client.fetchPlayerSeasonStats(season, "Base");
                LeagueAverages avgs = parseLeagueAverages(stats, season);
                trend.add(new TrendPointDto(season, avgs.avgPts()));
            } catch (Exception ignored) {
                // skip unavailable seasons
            }
        }
        return trend;
    }

    public static List<GameLogDto> parsePlayerGameLog(JsonNode response) {
        return parseGameLogRows(response, true);
    }

    public static List<TeamGameLogDto> parseTeamGameLog(JsonNode response) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<TeamGameLogDto> logs = new ArrayList<>();
        for (JsonNode row : records) {
            logs.add(new TeamGameLogDto(
                    JsonUtils.str(row, "GAME_ID"),
                    parseDate(JsonUtils.str(row, "GAME_DATE")),
                    JsonUtils.str(row, "MATCHUP"),
                    JsonUtils.str(row, "WL"),
                    JsonUtils.integer(row, "PTS"),
                    JsonUtils.integer(row, "REB"),
                    JsonUtils.integer(row, "AST"),
                    JsonUtils.integer(row, "PLUS_MINUS")));
        }
        logs.sort(Comparator.comparing(TeamGameLogDto::gameDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return logs;
    }

    public static List<ShotDto> parseShotChart(JsonNode response) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<ShotDto> shots = new ArrayList<>();
        for (JsonNode row : records) {
            shots.add(new ShotDto(
                    JsonUtils.integer(row, "LOC_X"),
                    JsonUtils.integer(row, "LOC_Y"),
                    shotMade(row.get("SHOT_MADE_FLAG")),
                    JsonUtils.str(row, "SHOT_ZONE_BASIC"),
                    JsonUtils.str(row, "SHOT_TYPE"),
                    JsonUtils.integer(row, "SHOT_DISTANCE")));
        }
        return shots;
    }

    /** ScoreboardV2 shape from the data service: {@code game_header} + {@code line_score}. */
    public static List<GameDto> parseScoreboardV2(JsonNode response) {
        JsonNode headers = response.get("game_header");
        if (headers == null || !headers.isArray() || headers.isEmpty()) {
            return List.of();
        }
        Map<String, Map<Integer, ScoreLine>> scoresByGame = new HashMap<>();
        JsonNode lineScore = response.get("line_score");
        if (lineScore != null && lineScore.isArray()) {
            for (JsonNode row : lineScore) {
                String gameId = JsonUtils.str(row, "GAME_ID");
                Integer teamId = JsonUtils.integer(row, "TEAM_ID");
                if (gameId == null || teamId == null) {
                    continue;
                }
                scoresByGame
                        .computeIfAbsent(gameId, id -> new HashMap<>())
                        .put(
                                teamId,
                                new ScoreLine(
                                        JsonUtils.str(row, "TEAM_ABBREVIATION"),
                                        JsonUtils.integer(row, "PTS")));
            }
        }
        List<GameDto> games = new ArrayList<>();
        for (JsonNode header : headers) {
            String gameId = JsonUtils.str(header, "GAME_ID");
            Integer homeId = JsonUtils.integer(header, "HOME_TEAM_ID");
            Integer awayId = JsonUtils.integer(header, "VISITOR_TEAM_ID");
            if (gameId == null || homeId == null || awayId == null) {
                continue;
            }
            Map<Integer, ScoreLine> teams = scoresByGame.getOrDefault(gameId, Map.of());
            ScoreLine home = teams.get(homeId);
            ScoreLine away = teams.get(awayId);
            LocalDate gameDate = parseDate(JsonUtils.str(header, "GAME_DATE_EST"));
            if (gameDate == null) {
                gameDate = parseDate(JsonUtils.str(header, "GAME_DATE"));
            }
            games.add(new GameDto(
                    gameId,
                    JsonUtils.str(header, "SEASON"),
                    gameDate,
                    homeId,
                    awayId,
                    home != null ? home.abbr() : null,
                    away != null ? away.abbr() : null,
                    home != null ? home.pts() : null,
                    away != null ? away.pts() : null,
                    null));
        }
        games.sort(Comparator.comparing(GameDto::gameDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return games;
    }

    public static List<GameDto> parseRecentGames(JsonNode response, int limit) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        Map<String, GameDto> unique = new LinkedHashMap<>();
        for (JsonNode row : records) {
            String gameId = JsonUtils.str(row, "GAME_ID");
            if (gameId == null) {
                continue;
            }
            Integer teamId = JsonUtils.integer(row, "TEAM_ID");
            Integer pts = JsonUtils.integer(row, "PTS");
            String matchup = JsonUtils.str(row, "MATCHUP");
            LocalDate gameDate = parseDate(JsonUtils.str(row, "GAME_DATE"));
            String season = JsonUtils.str(row, "SEASON_ID");
            if (season == null) {
                season = JsonUtils.str(row, "SEASON");
            }
            boolean isHome = matchup != null && matchup.contains(" vs. ");
            GameDto existing = unique.get(gameId);
            if (existing == null) {
                if (isHome) {
                    unique.put(gameId, new GameDto(
                            gameId, season, gameDate, teamId, null,
                            abbrFromMatchup(matchup, true), null, pts, null, matchup));
                } else {
                    unique.put(gameId, new GameDto(
                            gameId, season, gameDate, null, teamId,
                            null, abbrFromMatchup(matchup, false), null, pts, matchup));
                }
            } else {
                if (isHome) {
                    unique.put(gameId, new GameDto(
                            gameId, existing.season(), existing.gameDate(),
                            teamId, existing.awayTeamId(),
                            abbrFromMatchup(matchup, true), existing.awayAbbr(),
                            pts, existing.awayPts(), matchup));
                } else {
                    unique.put(gameId, new GameDto(
                            gameId, existing.season(), existing.gameDate(),
                            existing.homeTeamId(), teamId,
                            existing.homeAbbr(), abbrFromMatchup(matchup, false),
                            existing.homePts(), pts, matchup));
                }
            }
        }
        return unique.values().stream()
                .sorted(Comparator.comparing(GameDto::gameDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .toList();
    }

    public static List<TrendPointDto> parseTeamTrends(
            JsonNode teamStats, int teamId, String stat, String fallbackSeason) {
        JsonNode records = teamStats.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<TrendPointDto> points = new ArrayList<>();
        for (JsonNode row : records) {
            if (!Objects.equals(JsonUtils.integer(row, "TEAM_ID"), teamId)) {
                continue;
            }
            String season = JsonUtils.str(row, "SEASON_ID");
            if (season == null) {
                season = JsonUtils.str(row, "SEASON");
            }
            if (season == null) {
                season = fallbackSeason;
            }
            points.add(new TrendPointDto(season, teamTrendValue(row, stat)));
        }
        points.sort(Comparator.comparing(TrendPointDto::season));
        return points;
    }

    public static List<TrendPointDto> parsePlayerTrends(
            JsonNode playerStats, int playerId, String stat, String fallbackSeason) {
        JsonNode records = playerStats.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<TrendPointDto> points = new ArrayList<>();
        for (JsonNode row : records) {
            if (!Objects.equals(JsonUtils.integer(row, "PLAYER_ID"), playerId)) {
                continue;
            }
            String season = JsonUtils.str(row, "SEASON_ID");
            if (season == null) {
                season = JsonUtils.str(row, "SEASON");
            }
            if (season == null) {
                season = fallbackSeason;
            }
            points.add(new TrendPointDto(season, playerTrendValue(row, stat)));
        }
        points.sort(Comparator.comparing(TrendPointDto::season));
        return points;
    }

    public static Map<Integer, TeamSummaryDto> teamsById(List<TeamSummaryDto> teams) {
        Map<Integer, TeamSummaryDto> map = new HashMap<>();
        for (TeamSummaryDto team : teams) {
            map.put(team.id(), team);
        }
        return map;
    }

    public static Map<Integer, Double> netRatingByTeam(JsonNode teamStats) {
        Map<Integer, Double> net = new HashMap<>();
        JsonNode records = teamStats.get("records");
        if (records == null || !records.isArray()) {
            return net;
        }
        for (JsonNode row : records) {
            Integer teamId = JsonUtils.integer(row, "TEAM_ID");
            if (teamId != null) {
                net.put(teamId, JsonUtils.dbl(row, "NET_RATING"));
            }
        }
        return net;
    }

    public record LeagueAverages(
            double avgPts, double avgReb, double avgAst, double avgFgPct, double avgFg3Pct) {
        static LeagueAverages empty() {
            return new LeagueAverages(0, 0, 0, 0, 0);
        }
    }

    private static List<GameLogDto> parseGameLogRows(JsonNode response, boolean desc) {
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return List.of();
        }
        List<GameLogDto> logs = new ArrayList<>();
        for (JsonNode row : records) {
            logs.add(new GameLogDto(
                    JsonUtils.str(row, "GAME_ID"),
                    parseDate(JsonUtils.str(row, "GAME_DATE")),
                    JsonUtils.str(row, "MATCHUP"),
                    JsonUtils.str(row, "WL"),
                    JsonUtils.str(row, "MIN"),
                    JsonUtils.integer(row, "PTS"),
                    JsonUtils.integer(row, "REB"),
                    JsonUtils.integer(row, "AST"),
                    JsonUtils.integer(row, "STL"),
                    JsonUtils.integer(row, "BLK"),
                    JsonUtils.integer(row, "TOV"),
                    JsonUtils.integer(row, "PLUS_MINUS")));
        }
        Comparator<LocalDate> cmp = Comparator.nullsLast(Comparator.naturalOrder());
        logs.sort(desc
                ? Comparator.comparing(GameLogDto::gameDate, cmp.reversed())
                : Comparator.comparing(GameLogDto::gameDate, cmp));
        return logs;
    }

    private static TeamSeasonStatsDto toTeamSeasonStatsDto(JsonNode row) {
        return new TeamSeasonStatsDto(
                JsonUtils.str(row, "SEASON_ID") != null
                        ? JsonUtils.str(row, "SEASON_ID")
                        : JsonUtils.str(row, "SEASON"),
                JsonUtils.integer(row, "W"),
                JsonUtils.integer(row, "L"),
                JsonUtils.dbl(row, "OFF_RATING"),
                JsonUtils.dbl(row, "DEF_RATING"),
                JsonUtils.dbl(row, "NET_RATING"),
                JsonUtils.dbl(row, "PACE"),
                JsonUtils.dbl(row, "PTS"),
                JsonUtils.dbl(row, "REB"),
                JsonUtils.dbl(row, "AST"));
    }

    /**
     * LeagueDashPlayerStats rows omit SEASON; the fetch envelope carries it at the top level.
     * Index only the requested player's rows so advanced lookups are not overwritten by other players.
     */
    private static Map<String, JsonNode> indexPlayerSeasons(JsonNode response, int playerId) {
        Map<String, JsonNode> map = new HashMap<>();
        if (response == null) {
            return map;
        }
        String responseSeason = JsonUtils.str(response, "season");
        JsonNode records = response.get("records");
        if (records == null || !records.isArray()) {
            return map;
        }
        for (JsonNode row : records) {
            if (!Objects.equals(JsonUtils.integer(row, "PLAYER_ID"), playerId)) {
                continue;
            }
            String season = seasonFromRow(row, responseSeason);
            if (season != null) {
                map.put(season, row);
            }
        }
        return map;
    }

    private static String seasonFromRow(JsonNode row, String fallbackSeason) {
        String season = JsonUtils.str(row, "SEASON_ID");
        if (season == null) {
            season = JsonUtils.str(row, "SEASON");
        }
        if (season == null) {
            season = fallbackSeason;
        }
        return season;
    }

    private static Double leaderValue(JsonNode row) {
        for (String field : List.of("PTS", "REB", "AST", "STL", "BLK", "FG_PCT", "FG3M", "FG3_PCT")) {
            Double v = JsonUtils.dbl(row, field);
            if (v != null) {
                return v;
            }
        }
        return JsonUtils.dbl(row, "STAT_VALUE");
    }

    private static Double teamTrendValue(JsonNode row, String stat) {
        String key = stat == null ? "NET_RTG" : stat.trim().toUpperCase();
        return switch (key) {
            case "WIN_PCT", "W_PCT" -> teamWinPct(row);
            case "OFF_RTG", "OFF_RATING" -> JsonUtils.dbl(row, "OFF_RATING");
            case "DEF_RTG", "DEF_RATING" -> JsonUtils.dbl(row, "DEF_RATING");
            case "NET_RTG", "NET_RATING" -> JsonUtils.dbl(row, "NET_RATING");
            case "PACE" -> JsonUtils.dbl(row, "PACE");
            case "PTS", "PPG" -> JsonUtils.dbl(row, "PTS");
            case "OFFRTG" -> JsonUtils.dbl(row, "OFF_RATING");
            case "DEFRTG" -> JsonUtils.dbl(row, "DEF_RATING");
            default -> JsonUtils.dbl(row, "NET_RATING");
        };
    }

    private static Double teamWinPct(JsonNode row) {
        Double pct = JsonUtils.dbl(row, "W_PCT");
        if (pct != null) {
            return pct <= 1.0 ? pct : pct / 100.0;
        }
        Integer wins = JsonUtils.integer(row, "W");
        Integer losses = JsonUtils.integer(row, "L");
        if (wins == null || losses == null || wins + losses == 0) {
            return null;
        }
        return wins.doubleValue() / (wins + losses);
    }

    private static Double playerTrendValue(JsonNode row, String stat) {
        String key = stat == null ? "PTS" : stat.trim().toUpperCase();
        return switch (key) {
            case "REB", "RPG" -> JsonUtils.dbl(row, "REB");
            case "AST", "APG" -> JsonUtils.dbl(row, "AST");
            case "STL" -> JsonUtils.dbl(row, "STL");
            case "BLK" -> JsonUtils.dbl(row, "BLK");
            case "FG_PCT" -> JsonUtils.dbl(row, "FG_PCT");
            case "FG3_PCT", "FG3PCT" -> JsonUtils.dbl(row, "FG3_PCT");
            case "FG3M" -> JsonUtils.dbl(row, "FG3M");
            case "TS_PCT" -> JsonUtils.dbl(row, "TS_PCT");
            case "USG_PCT" -> JsonUtils.dbl(row, "USG_PCT");
            case "PTS", "PPG" -> JsonUtils.dbl(row, "PTS");
            default -> JsonUtils.dbl(row, "PTS");
        };
    }

    private static double nz(Double v) {
        return v == null ? 0.0 : v;
    }

    private static String playerFullName(JsonNode row) {
        String first = JsonUtils.str(row, "PLAYER_FIRST_NAME");
        String last = JsonUtils.str(row, "PLAYER_LAST_NAME");
        if (first != null || last != null) {
            return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        }
        return JsonUtils.str(row, "DISPLAY_FIRST_LAST");
    }

    private static boolean isActive(JsonNode status) {
        if (status == null || status.isNull()) {
            return false;
        }
        if (status.isNumber()) {
            return status.asInt() == 1;
        }
        return "ACTIVE".equalsIgnoreCase(status.asText());
    }

    private static Boolean shotMade(JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isBoolean()) {
            return value.booleanValue();
        }
        return "1".equals(value.asText());
    }

    private static String headshotUrl(int playerId) {
        return "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + playerId + ".png";
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String joinTeamName(String city, String name) {
        if (city == null && name == null) {
            return null;
        }
        if (city == null) {
            return name;
        }
        if (name == null) {
            return city;
        }
        return city + " " + name;
    }

    private static String trimStreak(String value) {
        return value == null ? null : value.trim();
    }

    private record ScoreLine(String abbr, Integer pts) {}

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.length() >= 10 && value.charAt(4) == '-') {
            return LocalDate.parse(value.substring(0, 10));
        }
        YearMonth ym = YearMonth.parse(value, java.time.format.DateTimeFormatter.ofPattern("MMM uuuu",
                Locale.ENGLISH));
        return ym.atDay(1);
    }

    private static String abbrFromMatchup(String matchup, boolean home) {
        if (matchup == null) {
            return null;
        }
        if (home && matchup.length() >= 3) {
            return matchup.substring(0, 3);
        }
        int at = matchup.indexOf("@ ");
        return at >= 0 && matchup.length() >= at + 5 ? matchup.substring(at + 2, at + 5) : null;
    }
}
