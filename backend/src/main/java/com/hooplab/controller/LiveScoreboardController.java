package com.hooplab.controller;

import com.hooplab.service.LiveService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Live feeds exposed over REST. The historical, typed box score lives on
 * {@code GameController} at {@code /api/games/{id}/boxscore}; the live raw box score is served here
 * at {@code /api/games/{id}/live-boxscore} so the two never collide.
 */
@RestController
@RequestMapping("/api")
public class LiveScoreboardController {

    private final LiveService liveService;

    public LiveScoreboardController(LiveService liveService) {
        this.liveService = liveService;
    }

    @GetMapping(value = "/scoreboard", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getScoreboard(@RequestParam(required = false) String date) {
        return liveService.scoreboard(date);
    }

    @GetMapping(value = "/games/{gameId}/play-by-play", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getPlayByPlay(@PathVariable String gameId) {
        return liveService.playByPlay(gameId);
    }

    @GetMapping(value = "/games/{gameId}/live-boxscore", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getLiveBoxScore(@PathVariable String gameId) {
        return liveService.boxScore(gameId);
    }
}
