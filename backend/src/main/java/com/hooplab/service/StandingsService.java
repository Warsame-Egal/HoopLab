package com.hooplab.service;

import com.hooplab.domain.TeamSeasonStats;
import com.hooplab.domain.TeamStanding;
import com.hooplab.dto.StandingRowDto;
import com.hooplab.repository.TeamSeasonStatsRepository;
import com.hooplab.repository.TeamStandingRepository;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StandingsService {

    private final TeamStandingRepository teamStandingRepository;
    private final TeamSeasonStatsRepository teamSeasonStatsRepository;

    public StandingsService(TeamStandingRepository teamStandingRepository,
                            TeamSeasonStatsRepository teamSeasonStatsRepository) {
        this.teamStandingRepository = teamStandingRepository;
        this.teamSeasonStatsRepository = teamSeasonStatsRepository;
    }

    @Cacheable(value = "teamStandings", key = "#season + ':' + (#conference == null ? 'all' : #conference)")
    public List<StandingRowDto> getStandings(String season, String conference) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();

        Map<Integer, Double> netByTeam = new HashMap<>();
        for (TeamSeasonStats stats : teamSeasonStatsRepository.findAllBySeason(resolvedSeason)) {
            netByTeam.put(stats.getId().getTeamId(), stats.getNetRtg());
        }

        return teamStandingRepository.findBySeason(resolvedSeason, conference).stream()
                .map(standing -> toRow(standing, netByTeam.get(standing.getId().getTeamId())))
                .toList();
    }

    private StandingRowDto toRow(TeamStanding standing, Double netRtg) {
        return new StandingRowDto(
                standing.getId().getTeamId(),
                standing.getTeam().getAbbreviation(),
                standing.getTeam().getFullName(),
                standing.getConference(),
                standing.getDivision(),
                standing.getConfRank(),
                standing.getDivRank(),
                standing.getWins(),
                standing.getLosses(),
                standing.getWinPct(),
                standing.getHomeRecord(),
                standing.getRoadRecord(),
                standing.getLastTen(),
                standing.getStreak(),
                standing.getGamesBack(),
                standing.getClinch(),
                netRtg
        );
    }
}
