package com.hooplab.service;

import com.hooplab.data.DataClient;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class CompareService {

    private final DataClient dataClient;

    public CompareService(DataClient dataClient) {
        this.dataClient = dataClient;
    }

    private static String resolve(String season) {
        return season != null ? season : SeasonUtils.currentSeason();
    }

    @Cacheable(value = "semiLive", key = "'cmp-p:' + #ids + ':' + (#season == null ? 'cur' : #season)")
    public String comparePlayers(String ids, String season) {
        return dataClient.getCompare("/compare/players?ids=" + ids + "&season=" + resolve(season));
    }

    @Cacheable(value = "semiLive", key = "'cmp-t:' + #ids + ':' + (#season == null ? 'cur' : #season)")
    public String compareTeams(String ids, String season) {
        return dataClient.getCompare("/compare/teams?ids=" + ids + "&season=" + resolve(season));
    }
}
