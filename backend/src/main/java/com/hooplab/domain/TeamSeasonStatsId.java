package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TeamSeasonStatsId implements Serializable {

    @Column(name = "team_id")
    private Integer teamId;

    private String season;

    protected TeamSeasonStatsId() {
    }

    public TeamSeasonStatsId(Integer teamId, String season) {
        this.teamId = teamId;
        this.season = season;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof TeamSeasonStatsId that)) {
            return false;
        }
        return Objects.equals(teamId, that.teamId) && Objects.equals(season, that.season);
    }

    @Override
    public int hashCode() {
        return Objects.hash(teamId, season);
    }
}
