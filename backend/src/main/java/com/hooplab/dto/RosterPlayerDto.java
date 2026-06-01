package com.hooplab.dto;

public record RosterPlayerDto(
        Integer playerId,
        String name,
        String jersey,
        String position,
        String height,
        String weight,
        String age,
        String exp,
        String school
) {
}
