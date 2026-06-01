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
@Table(name = "team_season_stats")
public class TeamSeasonStats {

    @EmbeddedId
    private TeamSeasonStatsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id")
    private Team team;

    private Integer wins;
    private Integer losses;

    @Column(name = "off_rtg")
    private Double offRtg;

    @Column(name = "def_rtg")
    private Double defRtg;

    @Column(name = "net_rtg")
    private Double netRtg;

    private Double pace;
    private Double pts;
    private Double reb;
    private Double ast;

    public TeamSeasonStats() {
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

    public Double getPace() {
        return pace;
    }

    public void setPace(Double pace) {
        this.pace = pace;
    }

    public Double getPts() {
        return pts;
    }

    public void setPts(Double pts) {
        this.pts = pts;
    }

    public Double getReb() {
        return reb;
    }

    public void setReb(Double reb) {
        this.reb = reb;
    }

    public Double getAst() {
        return ast;
    }

    public void setAst(Double ast) {
        this.ast = ast;
    }
}
