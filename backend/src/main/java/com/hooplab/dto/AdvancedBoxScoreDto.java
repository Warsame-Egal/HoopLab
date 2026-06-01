package com.hooplab.dto;

import java.util.List;

public record AdvancedBoxScoreDto(
        String gameId,
        String measure,
        List<String> columns,
        List<AdvancedRowDto> teams,
        List<AdvancedRowDto> players
) {
}
