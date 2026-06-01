package com.hooplab.dto;

import java.time.LocalDate;

public record GameDto(
        String gameId,
        String season,
        LocalDate gameDate,
        Integer homeTeamId,
        Integer awayTeamId,
        String homeAbbr,
        String awayAbbr,
        Integer homePts,
        Integer awayPts,
        String matchup
) {
}
