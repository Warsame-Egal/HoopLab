package com.hooplab.dto;

public record TeamMapDto(
        Integer teamId,
        String abbreviation,
        String name,
        String fullName,
        Double latitude,
        Double longitude,
        Integer wins,
        Integer losses,
        Double netRtg,
        Double clutchNetRtg,
        String conference
) {
}
