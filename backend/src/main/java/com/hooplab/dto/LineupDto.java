package com.hooplab.dto;

public record LineupDto(
        String lineupName,
        Integer gp,
        Double min,
        Double offRtg,
        Double defRtg,
        Double netRtg
) {
}
