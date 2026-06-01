package com.hooplab.dto;

public record TeamLeaderDto(
        Integer rank,
        Integer teamId,
        String teamName,
        String abbreviation,
        Double netRtg,
        Integer wins,
        Integer losses
) {
}
