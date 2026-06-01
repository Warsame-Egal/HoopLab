package com.hooplab.dto;

public record RosterEntryDto(
        Integer playerId,
        String fullName,
        String position,
        Integer gp,
        Double min,
        Double pts,
        Double reb,
        Double ast,
        Double fgPct,
        Double fg3Pct,
        Double tsPct,
        Double usgPct
) {
}
