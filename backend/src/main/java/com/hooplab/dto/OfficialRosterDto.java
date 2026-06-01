package com.hooplab.dto;

import java.util.List;

public record OfficialRosterDto(
        List<RosterPlayerDto> players,
        List<CoachDto> coaches
) {
}
