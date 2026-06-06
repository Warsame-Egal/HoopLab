package com.hooplab.controller;

import com.hooplab.dto.LeaderDto;
import com.hooplab.service.LeaderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaders")
public class LeaderController {

    private final LeaderService leaderService;

    public LeaderController(LeaderService leaderService) {
        this.leaderService = leaderService;
    }

    @GetMapping
    public List<LeaderDto> leaders(
            @RequestParam(required = false) String season,
            @RequestParam(defaultValue = "PTS") String category,
            @RequestParam(required = false) String statCategory,
            @RequestParam(defaultValue = "25") int limit) {
        String resolved = statCategory != null ? statCategory : category;
        return leaderService.getLeaders(season, resolved, limit);
    }
}
