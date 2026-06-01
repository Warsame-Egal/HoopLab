package com.hooplab.dto;

public record BoxScorePlayerDto(
        Integer playerId,
        String name,
        String startPosition,
        String min,
        Integer pts,
        Integer reb,
        Integer ast,
        Integer stl,
        Integer blk,
        Integer tov,
        Integer fgm,
        Integer fga,
        Integer fg3m,
        Integer fg3a,
        Integer ftm,
        Integer fta,
        Integer plusMinus
) {
}
