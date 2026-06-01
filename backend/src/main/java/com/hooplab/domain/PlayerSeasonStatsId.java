package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class PlayerSeasonStatsId implements Serializable {

    @Column(name = "player_id")
    private Integer playerId;

    private String season;

    protected PlayerSeasonStatsId() {
    }

    public PlayerSeasonStatsId(Integer playerId, String season) {
        this.playerId = playerId;
        this.season = season;
    }

    public Integer getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Integer playerId) {
        this.playerId = playerId;
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
        if (!(o instanceof PlayerSeasonStatsId that)) {
            return false;
        }
        return Objects.equals(playerId, that.playerId) && Objects.equals(season, that.season);
    }

    @Override
    public int hashCode() {
        return Objects.hash(playerId, season);
    }
}
