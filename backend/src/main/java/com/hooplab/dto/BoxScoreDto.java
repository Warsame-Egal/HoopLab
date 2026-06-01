package com.hooplab.dto;

import java.util.List;

public record BoxScoreDto(
        String gameId,
        List<BoxScoreTeamDto> teams
) {
}
