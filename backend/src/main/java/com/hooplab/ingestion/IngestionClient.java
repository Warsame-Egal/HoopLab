package com.hooplab.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class IngestionClient {

    private final RestClient restClient;

    public IngestionClient(RestClient ingestionRestClient) {
        this.restClient = ingestionRestClient;
    }

    public JsonNode fetchPlayers() {
        return get("/fetch/players");
    }

    public JsonNode fetchTeams() {
        return get("/fetch/teams");
    }

    public JsonNode fetchPlayerSeasonStats(String season, String measure) {
        return get("/fetch/player-season-stats?season=" + season + "&measure=" + measure);
    }

    public JsonNode fetchTeamSeasonStats(String season, String measure) {
        return get("/fetch/team-season-stats?season=" + season + "&measure=" + measure);
    }

    public JsonNode fetchPlayerGameLog(int playerId, String season) {
        return get("/fetch/player-gamelog?player_id=" + playerId + "&season=" + season);
    }

    public JsonNode fetchTeamGameLog(int teamId, String season) {
        return get("/fetch/team-gamelog?team_id=" + teamId + "&season=" + season);
    }

    public JsonNode fetchPlayerCareer(int playerId) {
        return get("/fetch/player-career?player_id=" + playerId);
    }

    public JsonNode fetchPlayerInfo(int playerId) {
        return get("/fetch/player-info?player_id=" + playerId);
    }

    public JsonNode fetchTeamRoster(int teamId, String season) {
        return get("/fetch/team-roster?team_id=" + teamId + "&season=" + season);
    }

    public JsonNode fetchBoxScore(String gameId) {
        return get("/fetch/boxscore?game_id=" + gameId);
    }

    public JsonNode fetchBoxScore(String gameId, String measure) {
        return get("/fetch/boxscore?game_id=" + gameId + "&measure=" + measure);
    }

    public JsonNode fetchShotChart(int playerId, String season) {
        return get("/fetch/shotchart?player_id=" + playerId + "&season=" + season);
    }

    public JsonNode fetchStandings(String season) {
        return get("/fetch/standings?season=" + season);
    }

    public JsonNode fetchGames(String season) {
        return get("/fetch/games?season=" + season);
    }

    public JsonNode fetchTeamClutch(String season, String measure) {
        return get("/fetch/team-clutch?season=" + season + "&measure=" + measure);
    }

    public JsonNode fetchLineups(int teamId, String season) {
        return get("/fetch/lineups?season=" + season + "&team_id=" + teamId);
    }

    private JsonNode get(String path) {
        return restClient.get()
                .uri(path)
                .retrieve()
                .body(JsonNode.class);
    }
}
