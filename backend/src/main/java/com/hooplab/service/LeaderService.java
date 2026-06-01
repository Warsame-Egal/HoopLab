package com.hooplab.service;

import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.dto.LeaderDto;
import com.hooplab.repository.PlayerSeasonStatsRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class LeaderService {

    private final PlayerSeasonStatsRepository playerSeasonStatsRepository;

    public LeaderService(PlayerSeasonStatsRepository playerSeasonStatsRepository) {
        this.playerSeasonStatsRepository = playerSeasonStatsRepository;
    }

    @Cacheable("leaders")
    public List<LeaderDto> getLeaders(String season, String category, int limit) {
        String resolvedSeason = season != null ? season : currentSeason();
        String sortField = sortField(category);
        var page = playerSeasonStatsRepository.findByIdSeason(
                resolvedSeason,
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, sortField)));

        List<LeaderDto> leaders = new ArrayList<>();
        int rank = 1;
        for (PlayerSeasonStats stats : page.getContent()) {
            leaders.add(new LeaderDto(
                    rank++,
                    stats.getId().getPlayerId(),
                    stats.getPlayer().getFullName(),
                    stats.getTeam() == null ? null : stats.getTeam().getAbbreviation(),
                    valueFor(stats, category),
                    stats.getGp()
            ));
        }
        return leaders;
    }

    private Double valueFor(PlayerSeasonStats stats, String category) {
        return switch (category == null ? "PTS" : category.toUpperCase()) {
            case "REB" -> stats.getReb();
            case "AST" -> stats.getAst();
            case "STL" -> stats.getStl();
            case "BLK" -> stats.getBlk();
            default -> stats.getPts();
        };
    }

    private String sortField(String category) {
        return switch (category == null ? "PTS" : category.toUpperCase()) {
            case "REB" -> "reb";
            case "AST" -> "ast";
            case "STL" -> "stl";
            case "BLK" -> "blk";
            default -> "pts";
        };
    }

    private String currentSeason() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        if (now.getMonthValue() >= 10) {
            return year + "-" + String.format("%02d", (year + 1) % 100);
        }
        return (year - 1) + "-" + String.format("%02d", year % 100);
    }
}
