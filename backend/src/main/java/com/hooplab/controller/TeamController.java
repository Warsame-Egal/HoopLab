package com.hooplab.controller;

import com.hooplab.dto.LineupDto;
import com.hooplab.dto.OfficialRosterDto;
import com.hooplab.dto.RosterEntryDto;
import com.hooplab.dto.TeamGameLogDto;
import com.hooplab.dto.TeamMapDto;
import com.hooplab.dto.TeamSeasonStatsDto;
import com.hooplab.dto.TeamSummaryDto;
import com.hooplab.dto.TrendPointDto;
import com.hooplab.service.TeamService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<TeamSummaryDto> list() {
        return teamService.list();
    }

    @GetMapping("/map")
    public List<TeamMapDto> map(@RequestParam(required = false) String season) {
        return teamService.getMap(season);
    }

    @GetMapping("/{id}")
    public TeamSummaryDto get(@PathVariable int id) {
        return teamService.getById(id);
    }

    @GetMapping("/{id}/seasons")
    public List<TeamSeasonStatsDto> seasons(@PathVariable int id) {
        return teamService.getSeasons(id);
    }

    @GetMapping("/{id}/trends")
    public List<TrendPointDto> trends(
            @PathVariable int id,
            @RequestParam(defaultValue = "NET_RTG") String stat) {
        return teamService.getTrends(id, stat);
    }

    @GetMapping("/{id}/roster")
    public List<RosterEntryDto> roster(
            @PathVariable int id,
            @RequestParam(required = false) String season) {
        return teamService.getRoster(id, season);
    }

    @GetMapping("/{id}/gamelog")
    public List<TeamGameLogDto> gamelog(
            @PathVariable int id,
            @RequestParam(required = false) String season) {
        return teamService.getGameLog(id, season);
    }

    @GetMapping("/{id}/official-roster")
    public OfficialRosterDto officialRoster(
            @PathVariable int id,
            @RequestParam(required = false) String season) {
        return teamService.getOfficialRoster(id, season);
    }

    @GetMapping("/{id}/lineups")
    public List<LineupDto> lineups(
            @PathVariable int id,
            @RequestParam(required = false) String season) {
        return teamService.getLineups(id, season);
    }

    @GetMapping(value = "/{id}/info", produces = MediaType.APPLICATION_JSON_VALUE)
    public String info(@PathVariable int id, @RequestParam(required = false) String season) {
        return teamService.getInfo(id, season);
    }

    @GetMapping(value = "/{id}/year-by-year", produces = MediaType.APPLICATION_JSON_VALUE)
    public String yearByYear(@PathVariable int id) {
        return teamService.getYearByYear(id);
    }

    @GetMapping(value = "/{id}/splits", produces = MediaType.APPLICATION_JSON_VALUE)
    public String splits(
            @PathVariable int id,
            @RequestParam(defaultValue = "general") String type,
            @RequestParam(required = false) String season) {
        return teamService.getTeamSplits(id, type, season);
    }

    @GetMapping(value = "/{id}/on-off", produces = MediaType.APPLICATION_JSON_VALUE)
    public String onOff(@PathVariable int id, @RequestParam(required = false) String season) {
        return teamService.getOnOff(id, season);
    }

    @GetMapping(value = "/{id}/franchise-leaders", produces = MediaType.APPLICATION_JSON_VALUE)
    public String franchiseLeaders(@PathVariable int id) {
        return teamService.getFranchiseLeaders(id);
    }
}
