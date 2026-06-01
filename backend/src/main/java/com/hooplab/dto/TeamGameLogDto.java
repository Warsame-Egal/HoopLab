package com.hooplab.dto;

import java.time.LocalDate;

public record TeamGameLogDto(
        String gameId,
        LocalDate gameDate,
        String matchup,
        String wl,
        Integer pts,
        Integer reb,
        Integer ast,
        Integer plusMinus
) {
}
