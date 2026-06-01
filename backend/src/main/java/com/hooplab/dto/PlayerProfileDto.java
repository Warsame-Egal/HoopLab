package com.hooplab.dto;

public record PlayerProfileDto(
        Integer playerId,
        String fullName,
        String position,
        Integer teamId,
        String teamAbbreviation,
        String height,
        String weight,
        String jersey,
        String country,
        String school,
        Integer draftYear,
        String draftRound,
        String draftNumber,
        Integer seasonExp,
        String birthdate,
        String headshotUrl
) {
}
