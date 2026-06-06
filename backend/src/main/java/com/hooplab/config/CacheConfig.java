package com.hooplab.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    /** Live scoreboard / in-game data: about 5s. */
    public static final String LIVE = "live";
    /** Standings, season stats, leaders: about 10 min. */
    public static final String SEMI_LIVE = "semiLive";
    /** Rosters, bios, completed seasons: about 1 hour. */
    public static final String STATIC = "static";

    @Bean
    CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                cache(LIVE, 5, TimeUnit.SECONDS),
                cache(SEMI_LIVE, 10, TimeUnit.MINUTES),
                cache(STATIC, 1, TimeUnit.HOURS),
                cache("players", 1, TimeUnit.HOURS),
                cache("teams", 1, TimeUnit.HOURS),
                cache("leaders", 10, TimeUnit.MINUTES),
                cache("overview", 10, TimeUnit.MINUTES),
                cache("teamMap", 10, TimeUnit.MINUTES),
                cache("standings", 10, TimeUnit.MINUTES),
                cache("trends", 10, TimeUnit.MINUTES),
                cache("roster", 1, TimeUnit.HOURS),
                cache("career", 6, TimeUnit.HOURS),
                cache("profile", 6, TimeUnit.HOURS),
                cache("boxscore", 24, TimeUnit.HOURS),
                cache("officialRoster", 1, TimeUnit.HOURS),
                cache("games", 10, TimeUnit.MINUTES),
                cache("advancedBoxscore", 10, TimeUnit.SECONDS),
                cache("lineups", 30, TimeUnit.MINUTES),
                cache("gameFinal", 24, TimeUnit.HOURS),
                cache("leagueLong", 30, TimeUnit.MINUTES)
        ));
        return manager;
    }

    private static CaffeineCache cache(String name, long duration, TimeUnit unit) {
        return new CaffeineCache(name, Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(duration, unit)
                .build());
    }
}
