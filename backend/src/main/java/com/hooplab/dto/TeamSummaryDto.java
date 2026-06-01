package com.hooplab.dto;

public record TeamSummaryDto(
        Integer id,
        String abbreviation,
        String city,
        String name,
        String fullName,
        String conference,
        String division,
        Integer yearFounded
) {
}
