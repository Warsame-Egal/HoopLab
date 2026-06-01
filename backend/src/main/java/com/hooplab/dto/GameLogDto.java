package com.hooplab.dto;

import java.time.LocalDate;

public record GameLogDto(
        String gameId,
        LocalDate gameDate,
        String matchup,
        String wl,
        String min,
        Integer pts,
        Integer reb,
        Integer ast,
        Integer stl,
        Integer blk,
        Integer tov,
        Integer plusMinus
) {
}
