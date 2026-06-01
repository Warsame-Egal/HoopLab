package com.hooplab.dto;

import java.util.List;

public record AdvancedRowDto(
        Integer teamId,
        Integer playerId,
        String name,
        String abbreviation,
        List<Double> values
) {
}
