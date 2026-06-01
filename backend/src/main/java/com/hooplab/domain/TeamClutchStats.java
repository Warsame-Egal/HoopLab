package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_clutch_stats")
public class TeamClutchStats {

    @EmbeddedId
    private TeamSeasonStatsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id")
    private Team team;

    private Integer gp;
    private Integer wins;
    private Integer losses;

    @Column(name = "off_rtg")
    private Double offRtg;

    @Column(name = "def_rtg")
    private Double defRtg;

    @Column(name = "net_rtg")
    private Double netRtg;

    public TeamClutchStats() {
    }

    public TeamSeasonStatsId getId() {
        return id;
    }

    public void setId(TeamSeasonStatsId id) {
        this.id = id;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public Integer getGp() {
        return gp;
    }

    public void setGp(Integer gp) {
        this.gp = gp;
    }

    public Integer getWins() {
        return wins;
    }

    public void setWins(Integer wins) {
        this.wins = wins;
    }

    public Integer getLosses() {
        return losses;
    }

    public void setLosses(Integer losses) {
        this.losses = losses;
    }

    public Double getOffRtg() {
        return offRtg;
    }

    public void setOffRtg(Double offRtg) {
        this.offRtg = offRtg;
    }

    public Double getDefRtg() {
        return defRtg;
    }

    public void setDefRtg(Double defRtg) {
        this.defRtg = defRtg;
    }

    public Double getNetRtg() {
        return netRtg;
    }

    public void setNetRtg(Double netRtg) {
        this.netRtg = netRtg;
    }
}
