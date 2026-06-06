package com.hooplab.controller;

import com.hooplab.service.LeagueService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/league")
public class LeagueController {

    private final LeagueService leagueService;

    public LeagueController(LeagueService leagueService) {
        this.leagueService = leagueService;
    }

    @GetMapping(value = "/hustle", produces = MediaType.APPLICATION_JSON_VALUE)
    public String hustle(
            @RequestParam(required = false) String season,
            @RequestParam(defaultValue = "player") String entity) {
        return leagueService.hustle(season, entity);
    }

    @GetMapping(value = "/shot-zones", produces = MediaType.APPLICATION_JSON_VALUE)
    public String shotZones(
            @RequestParam(required = false) String season,
            @RequestParam(defaultValue = "team") String scope) {
        return leagueService.shotZones(season, scope);
    }

    @GetMapping(value = "/playtypes", produces = MediaType.APPLICATION_JSON_VALUE)
    public String playtypes(
            @RequestParam int teamId,
            @RequestParam(required = false) String season) {
        return leagueService.playtypes(teamId, season);
    }

    @GetMapping(value = "/playoff-picture", produces = MediaType.APPLICATION_JSON_VALUE)
    public String playoffPicture(@RequestParam(required = false) String season) {
        return leagueService.playoffPicture(season);
    }

    @GetMapping(value = "/estimated-metrics", produces = MediaType.APPLICATION_JSON_VALUE)
    public String estimatedMetrics(@RequestParam(required = false) String season) {
        return leagueService.estimatedMetrics(season);
    }

    @GetMapping(value = "/lineups", produces = MediaType.APPLICATION_JSON_VALUE)
    public String lineups(
            @RequestParam(required = false) String season,
            @RequestParam(required = false) Integer teamId) {
        return leagueService.lineups(season, teamId);
    }
}
