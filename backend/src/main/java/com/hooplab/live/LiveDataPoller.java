package com.hooplab.live;

import com.hooplab.data.DataClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LiveDataPoller {

    private static final Logger log = LoggerFactory.getLogger(LiveDataPoller.class);

    private final DataClient dataClient;
    private final LiveDataHub hub;
    private volatile long lastScoreboardPollMs;
    private volatile long lastPlayByPlayPollMs;

    public LiveDataPoller(DataClient dataClient, LiveDataHub hub) {
        this.dataClient = dataClient;
        this.hub = hub;
    }

    /**
     * Seed the scoreboard stream for the first subscriber. Runs off the WebSocket handshake
     * thread so the connection is never blocked on a remote call.
     */
    @Async("liveRefreshExecutor")
    public void requestScoreboardRefresh() {
        pollScoreboard();
    }

    /**
     * Seed a game's live play-by-play and box score for the first subscriber. Runs off the
     * WebSocket handshake thread (see {@link #requestScoreboardRefresh()}).
     */
    @Async("liveRefreshExecutor")
    public void requestGameLiveRefresh(String gameId) {
        pollPlayByPlay(gameId);
        pollBoxScore(gameId);
    }

    @Scheduled(fixedDelay = 1000)
    public void tick() {
        long now = System.currentTimeMillis();
        if (hub.hasScoreboardSubscribers()) {
            long interval = hub.nextScoreboardPollIntervalMs();
            if (now - lastScoreboardPollMs >= interval) {
                pollScoreboard();
            }
        }
        if (hub.hasPlayByPlaySubscribers()) {
            if (now - lastPlayByPlayPollMs >= 2_000L) {
                for (String gameId : hub.activePlayByPlayGameIds()) {
                    pollPlayByPlay(gameId);
                    pollBoxScore(gameId);
                }
                lastPlayByPlayPollMs = now;
            }
        }
    }

    private void pollScoreboard() {
        if (!hub.hasScoreboardSubscribers()) {
            return;
        }
        try {
            String json = dataClient.getLiveScoreboard(null);
            boolean shouldBroadcast = hub.shouldBroadcastScoreboard(json);
            hub.updateScoreboardSnapshot(json);
            if (shouldBroadcast) {
                hub.broadcastScoreboard(json);
            }
            lastScoreboardPollMs = System.currentTimeMillis();
        } catch (Exception e) {
            log.warn("Scoreboard poll failed: {}", e.getMessage());
        }
    }

    private void pollPlayByPlay(String gameId) {
        try {
            String json = dataClient.getLivePlayByPlay(gameId);
            boolean shouldBroadcast = hub.shouldBroadcastPlayByPlay(gameId, json);
            hub.updatePlayByPlaySnapshot(gameId, json);
            if (shouldBroadcast) {
                hub.broadcastPlayByPlay(gameId, json);
            }
        } catch (Exception e) {
            log.debug("Play-by-play fetch failed for {}: {}", gameId, e.getMessage());
        }
    }

    private void pollBoxScore(String gameId) {
        try {
            String json = dataClient.getLiveBoxScore(gameId);
            boolean shouldBroadcast = hub.shouldBroadcastBoxScore(gameId, json);
            hub.updateBoxScoreSnapshot(gameId, json);
            if (shouldBroadcast) {
                hub.broadcastBoxScore(gameId, json);
            }
        } catch (Exception e) {
            log.debug("Box score fetch failed for {}: {}", gameId, e.getMessage());
        }
    }
}
