package com.hooplab.service;

import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.domain.TeamSeasonStats;
import com.hooplab.exception.ApiException;
import org.springframework.http.HttpStatus;

final class StatTrendExtractor {

    private StatTrendExtractor() {
    }

    static Double playerValue(PlayerSeasonStats stats, String stat) {
        return switch (stat.toUpperCase()) {
            case "PTS" -> stats.getPts();
            case "REB" -> stats.getReb();
            case "AST" -> stats.getAst();
            case "STL" -> stats.getStl();
            case "BLK" -> stats.getBlk();
            case "FG_PCT", "FGPCT" -> stats.getFgPct();
            case "FG3_PCT", "FG3PCT" -> stats.getFg3Pct();
            case "FT_PCT", "FTPCT" -> stats.getFtPct();
            case "TS_PCT", "TSPCT" -> stats.getTsPct();
            case "USG_PCT", "USGPCT" -> stats.getUsgPct();
            case "PLUS_MINUS", "PLUSMINUS" -> stats.getPlusMinus();
            default -> throw new ApiException(HttpStatus.BAD_REQUEST.value(), "Unsupported player stat: " + stat);
        };
    }

    static Double teamValue(TeamSeasonStats stats, String stat) {
        return switch (stat.toUpperCase()) {
            case "WINS", "W" -> stats.getWins() == null ? null : stats.getWins().doubleValue();
            case "LOSSES", "L" -> stats.getLosses() == null ? null : stats.getLosses().doubleValue();
            case "WIN_PCT", "WINPCT" -> winPct(stats);
            case "OFF_RTG", "OFFRTG" -> stats.getOffRtg();
            case "DEF_RTG", "DEFRTG" -> stats.getDefRtg();
            case "NET_RTG", "NETRTG" -> stats.getNetRtg();
            case "PACE" -> stats.getPace();
            case "PTS" -> stats.getPts();
            case "REB" -> stats.getReb();
            case "AST" -> stats.getAst();
            default -> throw new ApiException(HttpStatus.BAD_REQUEST.value(), "Unsupported team stat: " + stat);
        };
    }

    static Double winPct(TeamSeasonStats stats) {
        if (stats.getWins() == null || stats.getLosses() == null) {
            return null;
        }
        int total = stats.getWins() + stats.getLosses();
        if (total == 0) {
            return null;
        }
        return stats.getWins() / (double) total;
    }
}
