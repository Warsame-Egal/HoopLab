package com.hooplab.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.data.DataClient;
import com.hooplab.data.FetchParser;
import com.hooplab.dto.StandingRowDto;
import com.hooplab.dto.TeamSummaryDto;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class StandingsService {

    private final DataClient dataClient;
    private final TeamService teamService;

    public StandingsService(DataClient dataClient, TeamService teamService) {
        this.dataClient = dataClient;
        this.teamService = teamService;
    }

    @Cacheable(value = "standings", key = "#season + ':' + (#conference == null ? 'all' : #conference)")
    public List<StandingRowDto> getStandings(String season, String conference) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode standings = dataClient.fetchStandings(resolvedSeason);
        JsonNode teamStats = dataClient.fetchTeamSeasonStats(resolvedSeason, "Advanced");
        Map<Integer, TeamSummaryDto> teamsById = FetchParser.teamsById(teamService.list());
        Map<Integer, Double> netByTeam = FetchParser.netRatingByTeam(teamStats);
        return FetchParser.parseStandingsRows(standings, netByTeam, teamsById, conference);
    }
}
