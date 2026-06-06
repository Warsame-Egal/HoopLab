package com.hooplab.live;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Component
public class LiveDataHub {

    private static final String EMPTY_SCOREBOARD =
            "{\"scoreboard\":{\"gameDate\":\"\",\"games\":[]}}";

    private final ObjectMapper mapper = new ObjectMapper();
    private final CopyOnWriteArraySet<WebSocketSession> scoreboardSessions = new CopyOnWriteArraySet<>();
    private final ConcurrentHashMap<String, CopyOnWriteArraySet<WebSocketSession>> playByPlaySessions =
            new ConcurrentHashMap<>();
    private final AtomicInteger scoreboardSubscribers = new AtomicInteger(0);
    private final ConcurrentHashMap<String, AtomicInteger> playByPlaySubscribers = new ConcurrentHashMap<>();
    private final Map<String, Double> scoreboardGameTimestamps = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Map<String, Double>> playByPlayTimestamps =
            new ConcurrentHashMap<>();

    private volatile List<JsonNode> currentGames = List.of();
    private volatile String lastScoreboardJson = EMPTY_SCOREBOARD;
    private final ConcurrentHashMap<String, List<JsonNode>> currentPlaysByGame = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> lastPlayByPlayJsonByGame = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> lastBoxScoreJsonByGame = new ConcurrentHashMap<>();

    public boolean onScoreboardSubscribed() {
        return scoreboardSubscribers.incrementAndGet() == 1;
    }

    public void onScoreboardUnsubscribed() {
        scoreboardSubscribers.decrementAndGet();
    }

    public boolean onPlayByPlaySubscribed(String gameId) {
        return playByPlaySubscribers
                        .computeIfAbsent(gameId, id -> new AtomicInteger(0))
                        .incrementAndGet()
                == 1;
    }

    public void onPlayByPlayUnsubscribed(String gameId) {
        AtomicInteger count = playByPlaySubscribers.get(gameId);
        if (count != null && count.decrementAndGet() <= 0) {
            playByPlaySubscribers.remove(gameId);
            playByPlaySessions.remove(gameId);
            currentPlaysByGame.remove(gameId);
            lastPlayByPlayJsonByGame.remove(gameId);
            lastBoxScoreJsonByGame.remove(gameId);
            playByPlayTimestamps.remove(gameId);
        }
    }

    public boolean hasScoreboardSubscribers() {
        return scoreboardSubscribers.get() > 0;
    }

    public boolean hasPlayByPlaySubscribers() {
        return playByPlaySubscribers.values().stream().anyMatch(c -> c.get() > 0);
    }

    public Iterable<String> activePlayByPlayGameIds() {
        List<String> ids = new ArrayList<>();
        playByPlaySubscribers.forEach((gameId, count) -> {
            if (count.get() > 0) {
                ids.add(gameId);
            }
        });
        return ids;
    }

    public void registerScoreboardSession(WebSocketSession session) {
        scoreboardSessions.add(session);
    }

    public void unregisterScoreboardSession(WebSocketSession session) {
        scoreboardSessions.remove(session);
    }

    public void registerPlayByPlaySession(String gameId, WebSocketSession session) {
        playByPlaySessions.computeIfAbsent(gameId, id -> new CopyOnWriteArraySet<>()).add(session);
    }

    public void unregisterPlayByPlaySession(String gameId, WebSocketSession session) {
        CopyOnWriteArraySet<WebSocketSession> sessions = playByPlaySessions.get(gameId);
        if (sessions != null) {
            sessions.remove(session);
        }
    }

    public String getLastScoreboardJson() {
        return lastScoreboardJson;
    }

    public String getLastPlayByPlayJson(String gameId) {
        return lastPlayByPlayJsonByGame.getOrDefault(gameId, emptyPlayByPlayJson(gameId));
    }

    public String getLastBoxScoreJson(String gameId) {
        return lastBoxScoreJsonByGame.get(gameId);
    }

    public void updateScoreboardSnapshot(String json) {
        lastScoreboardJson = json;
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode games = root.path("scoreboard").path("games");
            if (games.isArray()) {
                List<JsonNode> next = new ArrayList<>();
                games.forEach(next::add);
                currentGames = List.copyOf(next);
            }
        } catch (IOException ignored) {
            // keep previous games for interval calculation
        }
    }

    public void broadcastScoreboard(String json) {
        broadcast(scoreboardSessions, json);
    }

    public boolean shouldBroadcastScoreboard(String json) {
        try {
            JsonNode root = mapper.readTree(json);
            List<JsonNode> newGames = new ArrayList<>();
            root.path("scoreboard").path("games").forEach(newGames::add);
            return LiveChangeDetector.hasGameDataChanged(newGames, currentGames, scoreboardGameTimestamps);
        } catch (IOException e) {
            return true;
        }
    }

    public void updatePlayByPlaySnapshot(String gameId, String json) {
        lastPlayByPlayJsonByGame.put(gameId, json);
        try {
            List<JsonNode> plays = new ArrayList<>();
            mapper.readTree(json).path("plays").forEach(plays::add);
            currentPlaysByGame.put(gameId, List.copyOf(plays));
        } catch (IOException ignored) {
            // ignore parse errors
        }
    }

    public void broadcastPlayByPlay(String gameId, String json) {
        CopyOnWriteArraySet<WebSocketSession> sessions = playByPlaySessions.get(gameId);
        if (sessions != null) {
            broadcast(sessions, json);
        }
    }

    public void updateBoxScoreSnapshot(String gameId, String json) {
        lastBoxScoreJsonByGame.put(gameId, json);
    }

    public boolean shouldBroadcastBoxScore(String gameId, String json) {
        String prev = lastBoxScoreJsonByGame.get(gameId);
        return prev == null || !prev.equals(json);
    }

    public void broadcastBoxScore(String gameId, String json) {
        CopyOnWriteArraySet<WebSocketSession> sessions = playByPlaySessions.get(gameId);
        if (sessions != null) {
            broadcast(sessions, json);
        }
    }

    public boolean shouldBroadcastPlayByPlay(String gameId, String json) {
        try {
            List<JsonNode> newPlays = new ArrayList<>();
            mapper.readTree(json).path("plays").forEach(newPlays::add);
            List<JsonNode> oldPlays = currentPlaysByGame.getOrDefault(gameId, List.of());
            Map<String, Double> timestamps =
                    playByPlayTimestamps.computeIfAbsent(gameId, id -> new ConcurrentHashMap<>());
            return LiveChangeDetector.hasPlayByPlayChanged(newPlays, oldPlays, timestamps);
        } catch (IOException e) {
            return true;
        }
    }

    public long nextScoreboardPollIntervalMs() {
        if (currentGames.isEmpty()) {
            return 900_000L;
        }
        boolean anyLive = false;
        boolean allFinal = true;
        for (JsonNode game : currentGames) {
            int status = game.path("gameStatus").asInt();
            if (status == LiveGameStatus.LIVE) {
                anyLive = true;
            }
            if (status != LiveGameStatus.FINAL) {
                allFinal = false;
            }
        }
        if (anyLive) {
            return 8_000L;
        }
        if (allFinal) {
            return 300_000L;
        }
        return 60_000L;
    }

    public String emptyPlayByPlayJson(String gameId) {
        return "{\"game_id\":\"" + gameId + "\",\"plays\":[]}";
    }

    private void broadcast(Set<WebSocketSession> sessions, String json) {
        TextMessage message = new TextMessage(json);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException ignored) {
                    // session will be cleaned up on close
                }
            }
        }
    }
}
