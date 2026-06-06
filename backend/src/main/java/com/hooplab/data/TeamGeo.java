package com.hooplab.data;

import java.util.Map;
import java.util.Optional;

/**
 * Static arena coordinates and conference metadata (ported from Flyway V3 + NBA structure).
 */
public final class TeamGeo {

    public record Geo(double latitude, double longitude, String conference, String division) {}

    private static final Map<String, Geo> BY_ABBR = Map.ofEntries(
            Map.entry("ATL", geo(33.7573, -84.3963, "East", "Southeast")),
            Map.entry("BOS", geo(42.3662, -71.0621, "East", "Atlantic")),
            Map.entry("BKN", geo(40.6826, -73.9754, "East", "Atlantic")),
            Map.entry("CHA", geo(35.2251, -80.8392, "East", "Southeast")),
            Map.entry("CHI", geo(41.8807, -87.6742, "East", "Central")),
            Map.entry("CLE", geo(41.4965, -81.6882, "East", "Central")),
            Map.entry("DAL", geo(32.7905, -96.8103, "West", "Southwest")),
            Map.entry("DEN", geo(39.7487, -105.0077, "West", "Northwest")),
            Map.entry("DET", geo(42.3410, -83.0550, "East", "Central")),
            Map.entry("GSW", geo(37.7680, -122.3877, "West", "Pacific")),
            Map.entry("HOU", geo(29.7508, -95.3621, "West", "Southwest")),
            Map.entry("IND", geo(39.7640, -86.1555, "East", "Central")),
            Map.entry("LAC", geo(33.9587, -118.3412, "West", "Pacific")),
            Map.entry("LAL", geo(34.0430, -118.2673, "West", "Pacific")),
            Map.entry("MEM", geo(35.1382, -90.0506, "West", "Southwest")),
            Map.entry("MIA", geo(25.7814, -80.1870, "East", "Southeast")),
            Map.entry("MIL", geo(43.0436, -87.9169, "East", "Central")),
            Map.entry("MIN", geo(44.9795, -93.2760, "West", "Northwest")),
            Map.entry("NOP", geo(29.9490, -90.0821, "West", "Southwest")),
            Map.entry("NYK", geo(40.7505, -73.9934, "East", "Atlantic")),
            Map.entry("OKC", geo(35.4634, -97.5151, "West", "Northwest")),
            Map.entry("ORL", geo(28.5392, -81.3839, "East", "Southeast")),
            Map.entry("PHI", geo(39.9012, -75.1720, "East", "Atlantic")),
            Map.entry("PHX", geo(33.4457, -112.0712, "West", "Pacific")),
            Map.entry("POR", geo(45.5316, -122.6668, "West", "Northwest")),
            Map.entry("SAC", geo(38.6490, -121.5180, "West", "Pacific")),
            Map.entry("SAS", geo(29.4270, -98.4375, "West", "Southwest")),
            Map.entry("TOR", geo(43.6435, -79.3791, "East", "Atlantic")),
            Map.entry("UTA", geo(40.7683, -111.9011, "West", "Northwest")),
            Map.entry("WAS", geo(38.8981, -77.0209, "East", "Southeast"))
    );

    private TeamGeo() {
    }

    public static Optional<Geo> forAbbreviation(String abbreviation) {
        if (abbreviation == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_ABBR.get(abbreviation.toUpperCase()));
    }

    private static Geo geo(double lat, double lon, String conference, String division) {
        return new Geo(lat, lon, conference, division);
    }
}
