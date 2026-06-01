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
@Table(name = "team_standings")
public class TeamStanding {

    @EmbeddedId
    private TeamSeasonStatsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id")
    private Team team;

    private String conference;
    private String division;

    @Column(name = "conf_rank")
    private Integer confRank;

    @Column(name = "div_rank")
    private Integer divRank;

    private Integer wins;
    private Integer losses;

    @Column(name = "win_pct")
    private Double winPct;

    @Column(name = "home_record")
    private String homeRecord;

    @Column(name = "road_record")
    private String roadRecord;

    @Column(name = "last_ten")
    private String lastTen;

    private String streak;

    @Column(name = "games_back")
    private Double gamesBack;

    private String clinch;

    public TeamStanding() {
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

    public String getConference() {
        return conference;
    }

    public void setConference(String conference) {
        this.conference = conference;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public Integer getConfRank() {
        return confRank;
    }

    public void setConfRank(Integer confRank) {
        this.confRank = confRank;
    }

    public Integer getDivRank() {
        return divRank;
    }

    public void setDivRank(Integer divRank) {
        this.divRank = divRank;
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

    public Double getWinPct() {
        return winPct;
    }

    public void setWinPct(Double winPct) {
        this.winPct = winPct;
    }

    public String getHomeRecord() {
        return homeRecord;
    }

    public void setHomeRecord(String homeRecord) {
        this.homeRecord = homeRecord;
    }

    public String getRoadRecord() {
        return roadRecord;
    }

    public void setRoadRecord(String roadRecord) {
        this.roadRecord = roadRecord;
    }

    public String getLastTen() {
        return lastTen;
    }

    public void setLastTen(String lastTen) {
        this.lastTen = lastTen;
    }

    public String getStreak() {
        return streak;
    }

    public void setStreak(String streak) {
        this.streak = streak;
    }

    public Double getGamesBack() {
        return gamesBack;
    }

    public void setGamesBack(Double gamesBack) {
        this.gamesBack = gamesBack;
    }

    public String getClinch() {
        return clinch;
    }

    public void setClinch(String clinch) {
        this.clinch = clinch;
    }
}
