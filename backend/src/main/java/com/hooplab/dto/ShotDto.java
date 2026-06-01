package com.hooplab.dto;

public record ShotDto(
        Integer locX,
        Integer locY,
        Boolean made,
        String zone,
        String type,
        Integer distance
) {
}
