package com.hooplab.service;

import com.hooplab.data.DataClient;
import com.hooplab.data.FetchParser;
import com.hooplab.dto.LeaderDto;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaderService {

    private final DataClient dataClient;

    public LeaderService(DataClient dataClient) {
        this.dataClient = dataClient;
    }

    @Cacheable(value = "leaders", key = "#season + ':' + #category + ':' + #limit")
    public List<LeaderDto> getLeaders(String season, String category, int limit) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        String cat = category != null ? category : "PTS";
        return FetchParser.parseLeaders(
                dataClient.fetchLeaders(resolvedSeason, cat), limit);
    }
}
