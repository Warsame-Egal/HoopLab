package com.hooplab.dto;

public record LeaderDto(
        Integer rank,
        Integer playerId,
        String playerName,
        String teamAbbreviation,
        Double value,
        Integer gamesPlayed
) {
}
