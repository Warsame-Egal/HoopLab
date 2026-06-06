package com.hooplab.service;

import com.hooplab.data.DataClient;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * League-wide pass-through endpoints. Each method forwards to the data service and caches the raw
 * JSON; the frontend consumes these shapes directly.
 */
@Service
public class LeagueService {

    private final DataClient dataClient;

    public LeagueService(DataClient dataClient) {
        this.dataClient = dataClient;
    }

    private static String resolve(String season) {
        return season != null ? season : SeasonUtils.currentSeason();
    }

    @Cacheable(value = "leagueLong", key = "'hustle:' + #season + ':' + #entity")
    public String hustle(String season, String entity) {
        return dataClient.getLeagueHustle(resolve(season), entity);
    }

    @Cacheable(value = "leagueLong", key = "'shotzones:' + #season + ':' + #scope")
    public String shotZones(String season, String scope) {
        return dataClient.getLeagueShotZones(resolve(season), scope);
    }

    @Cacheable(value = "leagueLong", key = "'playtypes:' + #teamId + ':' + #season")
    public String playtypes(int teamId, String season) {
        return dataClient.getLeaguePlaytypes(teamId, resolve(season));
    }

    @Cacheable(value = "semiLive", key = "'playoff:' + #season")
    public String playoffPicture(String season) {
        return dataClient.getLeaguePlayoffPicture(resolve(season));
    }

    @Cacheable(value = "semiLive", key = "'estimated:' + #season")
    public String estimatedMetrics(String season) {
        return dataClient.getLeagueEstimatedMetrics(resolve(season));
    }

    @Cacheable(value = "leagueLong", key = "'lineups:' + #season + ':' + (#teamId == null ? 'all' : #teamId)")
    public String lineups(String season, Integer teamId) {
        return dataClient.getLeagueLineups(resolve(season), teamId);
    }
}
