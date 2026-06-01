package com.hooplab.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SeasonUtilsTest {

    @Test
    void seasonRangeReturnsOrderedLabels() {
        List<String> seasons = SeasonUtils.seasonRange(3);
        assertEquals(3, seasons.size());
        assertEquals("2023-24", seasons.get(0));
        assertEquals("2024-25", seasons.get(1));
        assertEquals("2025-26", seasons.get(2));
    }

    @Test
    void seasonRangeRejectsInvalidInput() {
        assertThrows(IllegalArgumentException.class, () -> SeasonUtils.seasonRange(0));
    }
}
