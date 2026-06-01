package com.hooplab.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.domain.Player;
import com.hooplab.domain.PlayerGameLog;
import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.domain.PlayerSeasonStatsId;
import com.hooplab.domain.Season;
import com.hooplab.domain.Shot;
import com.hooplab.domain.Team;
import com.hooplab.domain.TeamClutchStats;
import com.hooplab.domain.TeamGameLog;
import com.hooplab.domain.TeamSeasonStats;
import com.hooplab.domain.TeamSeasonStatsId;
import com.hooplab.domain.TeamStanding;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;

@Component
public class IngestionMapper {

    public Season toSeason(String seasonLabel, boolean isCurrent) {
        int startYear = Integer.parseInt(seasonLabel.substring(0, 4));
        return new Season(seasonLabel, startYear, isCurrent);
    }

    public Team toTeam(JsonNode node) {
        Team team = new Team(
                intVal(node, "team_id"),
                text(node, "abbreviation"),
                text(node, "city"),
                text(node, "name"),
                text(node, "full_name"),
                null,
                null,
                intVal(node, "year_founded"),
                null,
                null
        );
        TeamGeoCoordinates.apply(team);
        return team;
    }

    public Player toPlayer(JsonNode node, Team team) {
        String first = text(node, "PLAYER_FIRST_NAME");
        String last = text(node, "PLAYER_LAST_NAME");
        String fullName = (first + " " + last).trim();
        int playerId = intVal(node, "PERSON_ID");

        return buildPlayer(playerId, fullName, first, last, text(node, "POSITION"), team,
                isActive(node.get("ROSTER_STATUS")), intVal(node, "FROM_YEAR"),
                intVal(node, "TO_YEAR"), headshotUrl(playerId));
    }

    public Player toPlayerFromCommon(JsonNode node, Team team) {
        int playerId = intVal(node, "PERSON_ID");
        String fullName = text(node, "DISPLAY_FIRST_LAST");
        if (fullName == null) {
            fullName = text(node, "PLAYERCODE");
        }
        return buildPlayer(playerId, fullName, null, null, null, team,
                "Y".equalsIgnoreCase(text(node, "RosterStatus")),
                intVal(node, "FROM_YEAR"), intVal(node, "TO_YEAR"), headshotUrl(playerId));
    }

    private Player buildPlayer(int playerId, String fullName, String first, String last,
                               String position, Team team, boolean active,
                               Integer fromYear, Integer toYear, String headshotUrl) {
        Player player = new Player();
        player.setPlayerId(playerId);
        player.setFullName(fullName);
        player.setFirstName(first);
        player.setLastName(last);
        player.setPosition(position);
        player.setTeam(team);
        player.setActive(active);
        player.setFromYear(fromYear);
        player.setToYear(toYear);
        player.setHeadshotUrl(headshotUrl);
        return player;
    }

    public PlayerSeasonStats toPlayerSeasonStats(JsonNode node, String season, Team team, Player player) {
        PlayerSeasonStats stats = new PlayerSeasonStats();
        stats.setId(new PlayerSeasonStatsId(intVal(node, "PLAYER_ID"), season));
        stats.setPlayer(player);
        stats.setTeam(team);
        stats.setGp(intVal(node, "GP"));
        stats.setMin(dbl(node, "MIN"));
        stats.setPts(dbl(node, "PTS"));
        stats.setReb(dbl(node, "REB"));
        stats.setAst(dbl(node, "AST"));
        stats.setStl(dbl(node, "STL"));
        stats.setBlk(dbl(node, "BLK"));
        stats.setTov(dbl(node, "TOV"));
        stats.setFgPct(dbl(node, "FG_PCT"));
        stats.setFg3Pct(dbl(node, "FG3_PCT"));
        stats.setFtPct(dbl(node, "FT_PCT"));
        stats.setPlusMinus(dbl(node, "PLUS_MINUS"));
        return stats;
    }

    public void mergeAdvanced(PlayerSeasonStats stats, JsonNode node) {
        stats.setTsPct(dbl(node, "TS_PCT"));
        stats.setUsgPct(dbl(node, "USG_PCT"));
    }

    public TeamSeasonStats toTeamSeasonStats(JsonNode node, String season, Team team) {
        TeamSeasonStats stats = new TeamSeasonStats();
        stats.setId(new TeamSeasonStatsId(intVal(node, "TEAM_ID"), season));
        stats.setTeam(team);
        stats.setWins(intVal(node, "W"));
        stats.setLosses(intVal(node, "L"));
        stats.setOffRtg(dbl(node, "OFF_RATING"));
        stats.setDefRtg(dbl(node, "DEF_RATING"));
        stats.setNetRtg(dbl(node, "NET_RATING"));
        stats.setPace(dbl(node, "PACE"));
        stats.setPts(dbl(node, "PTS"));
        stats.setReb(dbl(node, "REB"));
        stats.setAst(dbl(node, "AST"));
        return stats;
    }

    public PlayerGameLog toGameLog(JsonNode node, Player player, String season) {
        PlayerGameLog log = new PlayerGameLog();
        log.setPlayer(player);
        log.setSeason(season);
        log.setGameId(text(node, "GAME_ID"));
        log.setGameDate(parseDate(text(node, "GAME_DATE")));
        log.setMatchup(text(node, "MATCHUP"));
        log.setWl(text(node, "WL"));
        log.setMin(text(node, "MIN"));
        log.setPts(intVal(node, "PTS"));
        log.setReb(intVal(node, "REB"));
        log.setAst(intVal(node, "AST"));
        log.setStl(intVal(node, "STL"));
        log.setBlk(intVal(node, "BLK"));
        log.setTov(intVal(node, "TOV"));
        log.setPlusMinus(intVal(node, "PLUS_MINUS"));
        return log;
    }

    public TeamGameLog toTeamGameLog(JsonNode node, Team team, String season) {
        TeamGameLog log = new TeamGameLog();
        log.setTeam(team);
        log.setSeason(season);
        log.setGameId(text(node, "GAME_ID"));
        log.setGameDate(parseDate(text(node, "GAME_DATE")));
        log.setMatchup(text(node, "MATCHUP"));
        log.setWl(text(node, "WL"));
        log.setPts(intVal(node, "PTS"));
        log.setReb(intVal(node, "REB"));
        log.setAst(intVal(node, "AST"));
        log.setPlusMinus(intVal(node, "PLUS_MINUS"));
        return log;
    }

    public TeamStanding toTeamStanding(JsonNode node, Team team, String season) {
        TeamStanding standing = new TeamStanding();
        standing.setId(new TeamSeasonStatsId(team.getTeamId(), season));
        standing.setTeam(team);
        standing.setConference(text(node, "Conference"));
        standing.setDivision(text(node, "Division"));
        standing.setConfRank(intVal(node, "PlayoffRank"));
        standing.setDivRank(intVal(node, "DivisionRank"));
        standing.setWins(intVal(node, "WINS"));
        standing.setLosses(intVal(node, "LOSSES"));
        standing.setWinPct(dbl(node, "WinPCT"));
        standing.setHomeRecord(text(node, "HOME"));
        standing.setRoadRecord(text(node, "ROAD"));
        standing.setLastTen(text(node, "L10"));
        String streak = text(node, "strCurrentStreak");
        standing.setStreak(streak == null ? null : streak.trim());
        standing.setGamesBack(dbl(node, "ConferenceGamesBack"));
        String clinch = text(node, "ClinchIndicator");
        standing.setClinch(clinch == null ? null : clinch.trim());
        return standing;
    }

    public TeamClutchStats toTeamClutch(JsonNode node, Team team, String season) {
        TeamClutchStats clutch = new TeamClutchStats();
        clutch.setId(new TeamSeasonStatsId(team.getTeamId(), season));
        clutch.setTeam(team);
        clutch.setGp(intVal(node, "GP"));
        clutch.setWins(intVal(node, "W"));
        clutch.setLosses(intVal(node, "L"));
        clutch.setOffRtg(dbl(node, "OFF_RATING"));
        clutch.setDefRtg(dbl(node, "DEF_RATING"));
        clutch.setNetRtg(dbl(node, "NET_RATING"));
        return clutch;
    }

    public Shot toShot(JsonNode node, Player player, String season) {
        Shot shot = new Shot();
        shot.setPlayer(player);
        shot.setSeason(season);
        shot.setGameId(text(node, "GAME_ID"));
        shot.setLocX(intVal(node, "LOC_X"));
        shot.setLocY(intVal(node, "LOC_Y"));
        shot.setShotMade(bool(node, "SHOT_MADE_FLAG"));
        shot.setShotZone(text(node, "SHOT_ZONE_BASIC"));
        shot.setShotType(text(node, "SHOT_TYPE"));
        shot.setShotDistance(intVal(node, "SHOT_DISTANCE"));
        return shot;
    }

    public Map<Integer, JsonNode> indexByPlayerId(JsonNode records) {
        return indexBy(records, "PLAYER_ID");
    }

    public Map<Integer, JsonNode> indexByTeamId(JsonNode records) {
        return indexBy(records, "TEAM_ID");
    }

    private Map<Integer, JsonNode> indexBy(JsonNode records, String field) {
        Map<Integer, JsonNode> map = new HashMap<>();
        if (records == null || !records.isArray()) {
            return map;
        }
        for (JsonNode row : records) {
            Integer key = intVal(row, field);
            if (key != null) {
                map.put(key, row);
            }
        }
        return map;
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

    private static String headshotUrl(int playerId) {
        return "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/"
                + playerId + ".png";
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return LocalDate.now();
        }
        // Handle ISO datetimes like "2024-10-24T00:00:00" by taking the date part.
        if (value.length() >= 10 && value.charAt(4) == '-') {
            return LocalDate.parse(value.substring(0, 10));
        }
        YearMonth ym = YearMonth.parse(value, java.time.format.DateTimeFormatter.ofPattern("MMM uuuu",
                java.util.Locale.ENGLISH));
        return ym.atDay(1);
    }

    static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    static Integer intVal(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.isNumber() ? value.intValue() : Integer.parseInt(value.asText());
    }

    static Double dbl(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.isNumber() ? value.doubleValue() : Double.parseDouble(value.asText());
    }

    static Boolean bool(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isBoolean()) {
            return value.booleanValue();
        }
        return "1".equals(value.asText()) || "true".equalsIgnoreCase(value.asText());
    }
}
