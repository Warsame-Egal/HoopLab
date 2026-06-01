package com.hooplab.controller;

import com.hooplab.ingestion.IngestionService;
import com.hooplab.util.SeasonUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class IngestionController {

    private final IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/ingest")
    public Map<String, Object> ingest(@RequestParam(required = false) String season) {
        String targetSeason = season != null ? season : SeasonUtils.currentSeason();
        return ingestionService.ingestSeason(targetSeason);
    }

    @PostMapping("/ingest/backfill")
    public Map<String, Object> backfill(@RequestParam(required = false) Integer seasonsBack) {
        int back = seasonsBack != null ? seasonsBack : ingestionService.getDefaultSeasonsBack();
        return ingestionService.ingestSeasonRange(back);
    }
}
