package com.hooplab.dto;

public record CareerSeasonDto(
        String season,
        String teamAbbreviation,
        Integer age,
        Integer gp,
        Double min,
        Double pts,
        Double reb,
        Double ast,
        Double stl,
        Double blk,
        Double fgPct,
        Double fg3Pct,
        Double ftPct
) {
}
