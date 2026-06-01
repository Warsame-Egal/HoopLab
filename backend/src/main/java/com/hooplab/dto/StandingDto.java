package com.hooplab.dto;

public record StandingDto(
        Integer rank,
        Integer teamId,
        String abbreviation,
        String fullName,
        String conference,
        Integer wins,
        Integer losses,
        Double winPct,
        Double netRtg
) {
}
