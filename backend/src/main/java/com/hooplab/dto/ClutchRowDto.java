package com.hooplab.dto;

public record ClutchRowDto(
        Integer rank,
        Integer teamId,
        String abbreviation,
        String fullName,
        Integer gp,
        Integer wins,
        Integer losses,
        Double offRtg,
        Double defRtg,
        Double netRtg
) {
}
