package com.hooplab.dto;

public record StandingRowDto(
        Integer teamId,
        String abbreviation,
        String fullName,
        String conference,
        String division,
        Integer confRank,
        Integer divRank,
        Integer wins,
        Integer losses,
        Double winPct,
        String homeRecord,
        String roadRecord,
        String lastTen,
        String streak,
        Double gamesBack,
        String clinch,
        Double netRtg
) {
}
