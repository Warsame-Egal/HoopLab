package com.hooplab.controller;

import com.hooplab.service.CompareService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/compare")
public class CompareController {

    private final CompareService compareService;

    public CompareController(CompareService compareService) {
        this.compareService = compareService;
    }

    @GetMapping(value = "/players", produces = MediaType.APPLICATION_JSON_VALUE)
    public String comparePlayers(
            @RequestParam String ids,
            @RequestParam(required = false) String season) {
        return compareService.comparePlayers(ids, season);
    }

    @GetMapping(value = "/teams", produces = MediaType.APPLICATION_JSON_VALUE)
    public String compareTeams(
            @RequestParam String ids,
            @RequestParam(required = false) String season) {
        return compareService.compareTeams(ids, season);
    }
}
