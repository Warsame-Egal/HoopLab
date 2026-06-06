package com.hooplab.live;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiveChangeDetectorTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void detectsNewGame() throws Exception {
        JsonNode game = mapper.readTree("""
                {"gameId":"0022500001","gameStatus":2,"period":1,
                 "homeTeam":{"score":10},"awayTeam":{"score":8}}
                """);
        Map<String, Double> timestamps = new HashMap<>();
        assertTrue(LiveChangeDetector.hasGameDataChanged(List.of(game), List.of(), timestamps));
    }

    @Test
    void ignoresUnchangedScoreWithinDebounceWindow() throws Exception {
        JsonNode game = mapper.readTree("""
                {"gameId":"0022500001","gameStatus":2,"period":1,
                 "homeTeam":{"score":10},"awayTeam":{"score":8}}
                """);
        Map<String, Double> timestamps = new HashMap<>();
        timestamps.put("0022500001", System.currentTimeMillis() / 1000.0);
        assertFalse(LiveChangeDetector.hasGameDataChanged(List.of(game), List.of(game), timestamps));
    }

    @Test
    void detectsNewPlayByPlayAction() throws Exception {
        JsonNode play = mapper.readTree("{\"action_number\":1,\"description\":\"Made shot\"}");
        Map<String, Double> timestamps = new HashMap<>();
        assertTrue(LiveChangeDetector.hasPlayByPlayChanged(List.of(play), List.of(), timestamps));
    }
}
