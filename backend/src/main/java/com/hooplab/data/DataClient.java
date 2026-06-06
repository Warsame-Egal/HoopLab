package com.hooplab.data;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class DataClient {

    private final RestClient restClient;

    public DataClient(RestClient dataRestClient) {
        this.restClient = dataRestClient;
    }

    public JsonNode fetchPlayers() {
        return getJson("/fetch/players");
    }

    public JsonNode fetchTeams() {
        return getJson("/fetch/teams");
    }

    public JsonNode fetchPlayerSeasonStats(String season, String measure) {
        return getJson("/fetch/player-season-stats?season=" + season + "&measure=" + measure);
    }

    public JsonNode fetchTeamSeasonStats(String season, String measure) {
        return getJson("/fetch/team-season-stats?season=" + season + "&measure=" + measure);
    }

    public JsonNode fetchPlayerGameLog(int playerId, String season) {
        return getJson("/fetch/player-gamelog?player_id=" + playerId + "&season=" + season);
    }

    public JsonNode fetchTeamGameLog(int teamId, String season) {
        return getJson("/fetch/team-gamelog?team_id=" + teamId + "&season=" + season);
    }

    public JsonNode fetchPlayerCareer(int playerId) {
        return getJson("/fetch/player-career?player_id=" + playerId);
    }

    public JsonNode fetchPlayerInfo(int playerId) {
        return getJson("/fetch/player-info?player_id=" + playerId);
    }

    public JsonNode fetchTeamRoster(int teamId, String season) {
        return getJson("/fetch/team-roster?team_id=" + teamId + "&season=" + season);
    }

    public JsonNode fetchBoxScore(String gameId) {
        return getJson("/fetch/boxscore?game_id=" + gameId);
    }

    public JsonNode fetchBoxScore(String gameId, String measure) {
        return getJson("/fetch/boxscore?game_id=" + gameId + "&measure=" + measure);
    }

    public JsonNode fetchShotChart(int playerId, String season) {
        return getJson("/fetch/shotchart?player_id=" + playerId + "&season=" + season);
    }

    public JsonNode fetchStandings(String season) {
        return getJson("/fetch/standings?season=" + season);
    }

    public JsonNode fetchGames(String season) {
        return getJson("/fetch/games?season=" + season);
    }

    public JsonNode fetchScoreboard(String gameDate) {
        return getJson("/fetch/scoreboard?game_date=" + gameDate);
    }

    public JsonNode fetchTeamClutch(String season, String measure) {
        return getJson("/fetch/team-clutch?season=" + season + "&measure=" + measure);
    }

    public JsonNode fetchLineups(int teamId, String season) {
        return getJson("/fetch/lineups?season=" + season + "&team_id=" + teamId);
    }

    public JsonNode fetchLeaders(String season, String category) {
        return getJson("/fetch/leaders?season=" + season + "&category=" + category);
    }

    public String getLiveScoreboard(String date) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromPath("/live/scoreboard");
        if (date != null && !date.isBlank()) {
            builder.queryParam("date", date);
        }
        return getString(builder.toUriString());
    }

    public String getLivePlayByPlay(String gameId) {
        return getString("/live/games/" + gameId + "/play-by-play");
    }

    public String getLiveBoxScore(String gameId) {
        return getString("/live/games/" + gameId + "/boxscore");
    }

    public String getLeagueHustle(String season, String entity) {
        return getString("/league/hustle?season=" + season + "&entity=" + entity);
    }

    public String getLeagueShotZones(String season, String scope) {
        return getString("/league/shot-zones?season=" + season + "&scope=" + scope);
    }

    public String getLeaguePlaytypes(int teamId, String season) {
        return getString("/league/playtypes?team_id=" + teamId + "&season=" + season);
    }

    public String getLeaguePlayoffPicture(String season) {
        return getString("/league/playoff-picture?season=" + season);
    }

    public String getLeagueEstimatedMetrics(String season) {
        return getString("/league/estimated-metrics?season=" + season);
    }

    public String getLeagueLineups(String season, Integer teamId) {
        String path = "/league/lineups?season=" + season;
        if (teamId != null) {
            path += "&team_id=" + teamId;
        }
        return getString(path);
    }

    public String getGameBoxScoreVariant(String gameId, String variant) {
        return getString("/games/" + gameId + "/boxscore/" + variant);
    }

    public String getGameSummary(String gameId) {
        return getString("/games/" + gameId + "/summary");
    }

    public String getGameWinProbability(String gameId) {
        return getString("/games/" + gameId + "/win-probability");
    }

    public String getGameRotation(String gameId) {
        return getString("/games/" + gameId + "/rotation");
    }

    public String getPlayerDepth(String path) {
        return getString(path);
    }

    public String getTeamDepth(String path) {
        return getString(path);
    }

    public String getCompare(String path) {
        return getString(path);
    }

    private JsonNode getJson(String path) {
        return restClient.get()
                .uri(path)
                .retrieve()
                .body(JsonNode.class);
    }

    private String getString(String path) {
        return restClient.get()
                .uri(path)
                .retrieve()
                .body(String.class);
    }
}
