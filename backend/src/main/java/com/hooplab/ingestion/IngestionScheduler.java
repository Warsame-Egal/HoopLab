package com.hooplab.ingestion;

import com.hooplab.util.SeasonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class IngestionScheduler {

    private static final Logger log = LoggerFactory.getLogger(IngestionScheduler.class);

    private final IngestionService ingestionService;

    public IngestionScheduler(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @Scheduled(cron = "0 0 6 * * *")
    public void nightlyIngest() {
        String season = SeasonUtils.currentSeason();
        log.info("Starting scheduled ingestion for season {}", season);
        try {
            ingestionService.ingestSeason(season);
        } catch (Exception ex) {
            log.error("Scheduled ingestion failed for season {}", season, ex);
        }
    }
}
