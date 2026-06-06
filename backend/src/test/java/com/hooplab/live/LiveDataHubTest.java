package com.hooplab.live;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LiveDataHubTest {

    private final LiveDataHub hub = new LiveDataHub();

    @Test
    void firstScoreboardSubscriberReportsTrueThenFalse() {
        assertThat(hub.onScoreboardSubscribed()).isTrue();
        assertThat(hub.onScoreboardSubscribed()).isFalse();
        assertThat(hub.hasScoreboardSubscribers()).isTrue();
        hub.onScoreboardUnsubscribed();
        hub.onScoreboardUnsubscribed();
        assertThat(hub.hasScoreboardSubscribers()).isFalse();
    }

    @Test
    void pollIntervalIsSlowWhenNoGames() {
        assertThat(hub.nextScoreboardPollIntervalMs()).isEqualTo(900_000L);
    }

    @Test
    void pollIntervalIsFastWhenAnyGameLive() {
        hub.updateScoreboardSnapshot(scoreboardWith(LiveGameStatus.LIVE, LiveGameStatus.FINAL));
        assertThat(hub.nextScoreboardPollIntervalMs()).isEqualTo(8_000L);
    }

    @Test
    void pollIntervalBacksOffWhenAllFinal() {
        hub.updateScoreboardSnapshot(scoreboardWith(LiveGameStatus.FINAL, LiveGameStatus.FINAL));
        assertThat(hub.nextScoreboardPollIntervalMs()).isEqualTo(300_000L);
    }

    @Test
    void pollIntervalIsMediumWhenScheduledButNotLive() {
        hub.updateScoreboardSnapshot(scoreboardWith(LiveGameStatus.SCHEDULED, LiveGameStatus.FINAL));
        assertThat(hub.nextScoreboardPollIntervalMs()).isEqualTo(60_000L);
    }

    @Test
    void firstPlayByPlaySubscriberPerGameReportsTrue() {
        assertThat(hub.onPlayByPlaySubscribed("g1")).isTrue();
        assertThat(hub.onPlayByPlaySubscribed("g1")).isFalse();
        assertThat(hub.onPlayByPlaySubscribed("g2")).isTrue();
        assertThat(hub.hasPlayByPlaySubscribers()).isTrue();
    }

    private static String scoreboardWith(int... statuses) {
        StringBuilder games = new StringBuilder();
        for (int i = 0; i < statuses.length; i++) {
            if (i > 0) {
                games.append(',');
            }
            games.append("{\"gameStatus\":").append(statuses[i]).append('}');
        }
        return "{\"scoreboard\":{\"gameDate\":\"\",\"games\":[" + games + "]}}";
    }
}
