package com.hooplab.dto;

public record PlayerSeasonStatsDto(
        String season,
        Integer teamId,
        Integer gp,
        Double min,
        Double pts,
        Double reb,
        Double ast,
        Double stl,
        Double blk,
        Double tov,
        Double fgPct,
        Double fg3Pct,
        Double ftPct,
        Double tsPct,
        Double usgPct,
        Double plusMinus
) {
}
