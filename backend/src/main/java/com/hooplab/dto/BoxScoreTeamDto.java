package com.hooplab.dto;

import java.util.List;

public record BoxScoreTeamDto(
        Integer teamId,
        String abbreviation,
        String teamName,
        Integer pts,
        Integer reb,
        Integer ast,
        List<BoxScorePlayerDto> players
) {
}
