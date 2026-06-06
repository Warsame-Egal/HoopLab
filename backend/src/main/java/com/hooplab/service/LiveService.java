package com.hooplab.service;

import com.hooplab.data.DataClient;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Edge access to the live feeds. The scoreboard is cached briefly (about 5s); play-by-play and the
 * live box score are never cached so a polling client always sees the latest snapshot. The live
 * WebSocket poller fetches the same feeds directly via {@link DataClient}, bypassing this cache.
 */
@Service
public class LiveService {

    private final DataClient dataClient;

    public LiveService(DataClient dataClient) {
        this.dataClient = dataClient;
    }

    @Cacheable(value = "live", key = "'scoreboard:' + (#date == null || #date.isBlank() ? 'today' : #date)")
    public String scoreboard(String date) {
        return dataClient.getLiveScoreboard(date);
    }

    public String playByPlay(String gameId) {
        return dataClient.getLivePlayByPlay(gameId);
    }

    public String boxScore(String gameId) {
        return dataClient.getLiveBoxScore(gameId);
    }
}
