package com.hooplab.dto;

public record TeamSeasonStatsDto(
        String season,
        Integer wins,
        Integer losses,
        Double offRtg,
        Double defRtg,
        Double netRtg,
        Double pace,
        Double pts,
        Double reb,
        Double ast
) {
}
