package com.hooplab.controller;

import com.hooplab.dto.AdvancedBoxScoreDto;
import com.hooplab.dto.BoxScoreDto;
import com.hooplab.dto.GameDto;
import com.hooplab.service.GameService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public List<GameDto> recent(
            @RequestParam(required = false) String season,
            @RequestParam(defaultValue = "10") int limit) {
        return gameService.getRecentGames(season, limit);
    }

    @GetMapping("/by-date")
    public List<GameDto> byDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return gameService.getGamesByDate(date);
    }

    @GetMapping("/{gameId}/boxscore")
    public BoxScoreDto boxScore(@PathVariable String gameId) {
        return gameService.getBoxScore(gameId);
    }

    @GetMapping("/{gameId}/boxscore/advanced")
    public AdvancedBoxScoreDto advancedBoxScore(
            @PathVariable String gameId,
            @RequestParam(defaultValue = "advanced") String measure) {
        return gameService.getAdvancedBoxScore(gameId, measure);
    }
}
