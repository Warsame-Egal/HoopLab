package com.hooplab.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.data.DataClient;
import com.hooplab.data.FetchParser;
import com.hooplab.dto.OverviewResponseDto;
import com.hooplab.dto.TeamSummaryDto;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AnalyticsService {

    private final DataClient dataClient;
    private final LeaderService leaderService;
    private final TeamService teamService;

    public AnalyticsService(DataClient dataClient,
                            LeaderService leaderService,
                            TeamService teamService) {
        this.dataClient = dataClient;
        this.leaderService = leaderService;
        this.teamService = teamService;
    }

    @Cacheable(value = "overview", key = "#season == null ? 'current' : #season")
    public OverviewResponseDto overview(String season) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode playerStats = dataClient.fetchPlayerSeasonStats(resolvedSeason, "Base");
        FetchParser.LeagueAverages avgs = FetchParser.parseLeagueAverages(playerStats, resolvedSeason);
        JsonNode teamStats = dataClient.fetchTeamSeasonStats(resolvedSeason, "Advanced");
        Map<Integer, TeamSummaryDto> teamsById = FetchParser.teamsById(teamService.list());

        return new OverviewResponseDto(
                resolvedSeason,
                avgs.avgPts(),
                avgs.avgReb(),
                avgs.avgAst(),
                avgs.avgFgPct(),
                avgs.avgFg3Pct(),
                leaderService.getLeaders(resolvedSeason, "PTS", 5),
                FetchParser.parseTopTeamsByNet(teamStats, teamsById, 5),
                FetchParser.parseLeagueScoringTrend(dataClient, 4)
        );
    }
}
