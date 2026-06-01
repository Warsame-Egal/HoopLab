package com.hooplab.util;

import com.fasterxml.jackson.databind.JsonNode;

public final class JsonUtils {

    private JsonUtils() {
    }

    public static String str(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    public static Integer integer(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.intValue();
        }
        try {
            return (int) Double.parseDouble(value.asText());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    public static Double dbl(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.doubleValue();
        }
        try {
            return Double.parseDouble(value.asText());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
