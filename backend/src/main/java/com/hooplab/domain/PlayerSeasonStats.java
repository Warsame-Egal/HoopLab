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
@Table(name = "player_season_stats")
public class PlayerSeasonStats {

    @EmbeddedId
    private PlayerSeasonStatsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("playerId")
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    private Integer gp;
    private Double min;
    private Double pts;
    private Double reb;
    private Double ast;
    private Double stl;
    private Double blk;
    private Double tov;

    @Column(name = "fg_pct")
    private Double fgPct;

    @Column(name = "fg3_pct")
    private Double fg3Pct;

    @Column(name = "ft_pct")
    private Double ftPct;

    @Column(name = "ts_pct")
    private Double tsPct;

    @Column(name = "usg_pct")
    private Double usgPct;

    @Column(name = "plus_minus")
    private Double plusMinus;

    public PlayerSeasonStats() {
    }

    public PlayerSeasonStatsId getId() {
        return id;
    }

    public void setId(PlayerSeasonStatsId id) {
        this.id = id;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
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

    public Double getMin() {
        return min;
    }

    public void setMin(Double min) {
        this.min = min;
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

    public Double getStl() {
        return stl;
    }

    public void setStl(Double stl) {
        this.stl = stl;
    }

    public Double getBlk() {
        return blk;
    }

    public void setBlk(Double blk) {
        this.blk = blk;
    }

    public Double getTov() {
        return tov;
    }

    public void setTov(Double tov) {
        this.tov = tov;
    }

    public Double getFgPct() {
        return fgPct;
    }

    public void setFgPct(Double fgPct) {
        this.fgPct = fgPct;
    }

    public Double getFg3Pct() {
        return fg3Pct;
    }

    public void setFg3Pct(Double fg3Pct) {
        this.fg3Pct = fg3Pct;
    }

    public Double getFtPct() {
        return ftPct;
    }

    public void setFtPct(Double ftPct) {
        this.ftPct = ftPct;
    }

    public Double getTsPct() {
        return tsPct;
    }

    public void setTsPct(Double tsPct) {
        this.tsPct = tsPct;
    }

    public Double getUsgPct() {
        return usgPct;
    }

    public void setUsgPct(Double usgPct) {
        this.usgPct = usgPct;
    }

    public Double getPlusMinus() {
        return plusMinus;
    }

    public void setPlusMinus(Double plusMinus) {
        this.plusMinus = plusMinus;
    }
}
