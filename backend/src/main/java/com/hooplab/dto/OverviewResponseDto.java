package com.hooplab.dto;

import java.util.List;

public record OverviewResponseDto(
        String season,
        Double avgPts,
        Double avgReb,
        Double avgAst,
        Double avgFgPct,
        Double avgFg3Pct,
        List<LeaderDto> topScorers,
        List<TeamLeaderDto> topTeams,
        List<TrendPointDto> leagueScoringTrend
) {
}
