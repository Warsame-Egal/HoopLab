package com.hooplab.ingestion;

import com.hooplab.domain.Team;

import java.util.Map;

final class TeamGeoCoordinates {

    private static final Map<String, double[]> COORDINATES = Map.ofEntries(
            Map.entry("ATL", coords(33.7573, -84.3963)),
            Map.entry("BOS", coords(42.3662, -71.0621)),
            Map.entry("BKN", coords(40.6826, -73.9754)),
            Map.entry("CHA", coords(35.2251, -80.8392)),
            Map.entry("CHI", coords(41.8807, -87.6742)),
            Map.entry("CLE", coords(41.4965, -81.6882)),
            Map.entry("DAL", coords(32.7905, -96.8103)),
            Map.entry("DEN", coords(39.7487, -105.0077)),
            Map.entry("DET", coords(42.3410, -83.0550)),
            Map.entry("GSW", coords(37.7680, -122.3877)),
            Map.entry("HOU", coords(29.7508, -95.3621)),
            Map.entry("IND", coords(39.7640, -86.1555)),
            Map.entry("LAC", coords(33.9587, -118.3412)),
            Map.entry("LAL", coords(34.0430, -118.2673)),
            Map.entry("MEM", coords(35.1382, -90.0506)),
            Map.entry("MIA", coords(25.7814, -80.1870)),
            Map.entry("MIL", coords(43.0436, -87.9169)),
            Map.entry("MIN", coords(44.9795, -93.2760)),
            Map.entry("NOP", coords(29.9490, -90.0821)),
            Map.entry("NYK", coords(40.7505, -73.9934)),
            Map.entry("OKC", coords(35.4634, -97.5151)),
            Map.entry("ORL", coords(28.5392, -81.3839)),
            Map.entry("PHI", coords(39.9012, -75.1720)),
            Map.entry("PHX", coords(33.4457, -112.0712)),
            Map.entry("POR", coords(45.5316, -122.6668)),
            Map.entry("SAC", coords(38.6490, -121.5180)),
            Map.entry("SAS", coords(29.4270, -98.4375)),
            Map.entry("TOR", coords(43.6435, -79.3791)),
            Map.entry("UTA", coords(40.7683, -111.9011)),
            Map.entry("WAS", coords(38.8981, -77.0209))
    );

    private TeamGeoCoordinates() {
    }

    static void apply(Team team) {
        if (team == null || team.getAbbreviation() == null) {
            return;
        }
        double[] coords = COORDINATES.get(team.getAbbreviation());
        if (coords != null) {
            team.setLatitude(coords[0]);
            team.setLongitude(coords[1]);
        }
    }

    private static double[] coords(double latitude, double longitude) {
        return new double[]{latitude, longitude};
    }
}
