package com.hooplab.controller;

import com.hooplab.dto.ClutchRowDto;
import com.hooplab.dto.OverviewResponseDto;
import com.hooplab.service.AnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public OverviewResponseDto overview(@RequestParam(required = false) String season) {
        return analyticsService.overview(season);
    }

    @GetMapping("/clutch")
    public List<ClutchRowDto> clutch(@RequestParam(required = false) String season) {
        return analyticsService.clutch(season);
    }
}
