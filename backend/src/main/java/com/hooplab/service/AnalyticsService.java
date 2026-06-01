package com.hooplab.service;

import com.hooplab.dto.ClutchRowDto;
import com.hooplab.dto.LeaderDto;
import com.hooplab.dto.OverviewResponseDto;
import com.hooplab.dto.TeamLeaderDto;
import com.hooplab.dto.TrendPointDto;
import com.hooplab.repository.PlayerSeasonStatsRepository;
import com.hooplab.repository.TeamClutchStatsRepository;
import com.hooplab.repository.TeamSeasonStatsRepository;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AnalyticsService {

    private final PlayerSeasonStatsRepository playerSeasonStatsRepository;
    private final TeamSeasonStatsRepository teamSeasonStatsRepository;
    private final TeamClutchStatsRepository teamClutchStatsRepository;
    private final LeaderService leaderService;

    public AnalyticsService(PlayerSeasonStatsRepository playerSeasonStatsRepository,
                            TeamSeasonStatsRepository teamSeasonStatsRepository,
                            TeamClutchStatsRepository teamClutchStatsRepository,
                            LeaderService leaderService) {
        this.playerSeasonStatsRepository = playerSeasonStatsRepository;
        this.teamSeasonStatsRepository = teamSeasonStatsRepository;
        this.teamClutchStatsRepository = teamClutchStatsRepository;
        this.leaderService = leaderService;
    }

    @Cacheable(value = "clutch", key = "#season == null ? 'current' : #season")
    public List<ClutchRowDto> clutch(String season) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        AtomicInteger rank = new AtomicInteger(1);
        return teamClutchStatsRepository.findBySeason(resolvedSeason).stream()
                .map(stats -> new ClutchRowDto(
                        rank.getAndIncrement(),
                        stats.getId().getTeamId(),
                        stats.getTeam().getAbbreviation(),
                        stats.getTeam().getFullName(),
                        stats.getGp(),
                        stats.getWins(),
                        stats.getLosses(),
                        stats.getOffRtg(),
                        stats.getDefRtg(),
                        stats.getNetRtg()))
                .toList();
    }

    @Cacheable("overview")
    public OverviewResponseDto overview(String season) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        List<Object[]> avgRows = playerSeasonStatsRepository.leagueAverages(resolvedSeason);
        Object[] avgs = avgRows.isEmpty() ? new Object[0] : avgRows.get(0);
        List<LeaderDto> topScorers = leaderService.getLeaders(resolvedSeason, "PTS", 5);
        List<TeamLeaderDto> topTeams = topTeamsByNetRating(resolvedSeason, 5);
        List<TrendPointDto> leagueScoringTrend = leagueScoringTrend();

        Double avgPts = avgs.length > 0 && avgs[0] != null ? ((Number) avgs[0]).doubleValue() : 0.0;
        Double avgReb = avgs.length > 1 && avgs[1] != null ? ((Number) avgs[1]).doubleValue() : 0.0;
        Double avgAst = avgs.length > 2 && avgs[2] != null ? ((Number) avgs[2]).doubleValue() : 0.0;
        Double avgFgPct = avgs.length > 3 && avgs[3] != null ? ((Number) avgs[3]).doubleValue() : 0.0;
        Double avgFg3Pct = avgs.length > 4 && avgs[4] != null ? ((Number) avgs[4]).doubleValue() : 0.0;

        return new OverviewResponseDto(
                resolvedSeason,
                avgPts,
                avgReb,
                avgAst,
                avgFgPct,
                avgFg3Pct,
                topScorers,
                topTeams,
                leagueScoringTrend
        );
    }

    private List<TeamLeaderDto> topTeamsByNetRating(String season, int limit) {
        AtomicInteger rank = new AtomicInteger(1);
        return teamSeasonStatsRepository.findByIdSeasonWithTeamOrderByNetRtgDesc(season, PageRequest.of(0, limit))
                .stream()
                .map(stats -> new TeamLeaderDto(
                        rank.getAndIncrement(),
                        stats.getTeam().getTeamId(),
                        stats.getTeam().getFullName(),
                        stats.getTeam().getAbbreviation(),
                        stats.getNetRtg(),
                        stats.getWins(),
                        stats.getLosses()))
                .toList();
    }

    private List<TrendPointDto> leagueScoringTrend() {
        return playerSeasonStatsRepository.leagueScoringTrendBySeason().stream()
                .map(row -> new TrendPointDto(
                        (String) row[0],
                        row[1] == null ? null : ((Number) row[1]).doubleValue()))
                .toList();
    }
}
