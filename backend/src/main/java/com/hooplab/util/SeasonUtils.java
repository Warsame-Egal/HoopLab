package com.hooplab.util;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class SeasonUtils {

    private SeasonUtils() {
    }

    public static String currentSeason() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        if (now.getMonthValue() >= 10) {
            return formatSeason(year);
        }
        return formatSeason(year - 1);
    }

    public static List<String> seasonRange(int seasonsBack) {
        if (seasonsBack < 1) {
            throw new IllegalArgumentException("seasonsBack must be at least 1");
        }
        int currentStartYear = Integer.parseInt(currentSeason().substring(0, 4));
        List<String> seasons = new ArrayList<>(seasonsBack);
        for (int i = seasonsBack - 1; i >= 0; i--) {
            seasons.add(formatSeason(currentStartYear - i));
        }
        return seasons;
    }

    private static String formatSeason(int startYear) {
        return startYear + "-" + String.format("%02d", (startYear + 1) % 100);
    }
}
