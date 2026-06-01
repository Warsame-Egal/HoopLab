package com.hooplab.controller;

import com.hooplab.dto.StandingRowDto;
import com.hooplab.service.StandingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/standings")
public class StandingsController {

    private final StandingsService standingsService;

    public StandingsController(StandingsService standingsService) {
        this.standingsService = standingsService;
    }

    @GetMapping
    public List<StandingRowDto> standings(
            @RequestParam(required = false) String season,
            @RequestParam(required = false) String conference) {
        return standingsService.getStandings(season, conference);
    }
}
