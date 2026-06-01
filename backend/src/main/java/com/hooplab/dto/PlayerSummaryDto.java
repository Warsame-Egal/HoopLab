package com.hooplab.dto;

public record PlayerSummaryDto(
        Integer id,
        String fullName,
        String firstName,
        String lastName,
        String position,
        Integer teamId,
        String teamAbbreviation,
        boolean active,
        Integer fromYear,
        Integer toYear,
        String headshotUrl
) {
}
