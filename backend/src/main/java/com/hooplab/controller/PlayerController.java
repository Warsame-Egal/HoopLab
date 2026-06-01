package com.hooplab.controller;

import com.hooplab.dto.CareerSeasonDto;
import com.hooplab.dto.GameLogDto;
import com.hooplab.dto.PageResponse;
import com.hooplab.dto.PlayerProfileDto;
import com.hooplab.dto.PlayerSeasonStatsDto;
import com.hooplab.dto.PlayerSummaryDto;
import com.hooplab.dto.ShotDto;
import com.hooplab.dto.TrendPointDto;
import com.hooplab.service.PlayerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping
    public PageResponse<PlayerSummaryDto> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return playerService.list(search, page, size);
    }

    @GetMapping("/{id}")
    public PlayerSummaryDto get(@PathVariable int id) {
        return playerService.getById(id);
    }

    @GetMapping("/{id}/profile")
    public PlayerProfileDto profile(@PathVariable int id) {
        return playerService.getProfile(id);
    }

    @GetMapping("/{id}/seasons")
    public List<PlayerSeasonStatsDto> seasons(@PathVariable int id) {
        return playerService.getSeasons(id);
    }

    @GetMapping("/{id}/career")
    public List<CareerSeasonDto> career(@PathVariable int id) {
        return playerService.getCareer(id);
    }

    @GetMapping("/{id}/gamelog")
    public List<GameLogDto> gameLog(@PathVariable int id, @RequestParam String season) {
        return playerService.getGameLog(id, season);
    }

    @GetMapping("/{id}/shotchart")
    public List<ShotDto> shotChart(@PathVariable int id, @RequestParam String season) {
        return playerService.getShotChart(id, season);
    }

    @GetMapping("/{id}/trends")
    public List<TrendPointDto> trends(
            @PathVariable int id,
            @RequestParam(defaultValue = "PTS") String stat) {
        return playerService.getTrends(id, stat);
    }
}
