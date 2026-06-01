package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @Column(name = "game_id")
    private String gameId;

    @Column(nullable = false)
    private String season;

    @Column(name = "game_date", nullable = false)
    private LocalDate gameDate;

    @Column(name = "home_team_id")
    private Integer homeTeamId;

    @Column(name = "away_team_id")
    private Integer awayTeamId;

    @Column(name = "home_abbr")
    private String homeAbbr;

    @Column(name = "away_abbr")
    private String awayAbbr;

    @Column(name = "home_pts")
    private Integer homePts;

    @Column(name = "away_pts")
    private Integer awayPts;

    private String matchup;

    public Game() {
    }

    public String getGameId() {
        return gameId;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public LocalDate getGameDate() {
        return gameDate;
    }

    public void setGameDate(LocalDate gameDate) {
        this.gameDate = gameDate;
    }

    public Integer getHomeTeamId() {
        return homeTeamId;
    }

    public void setHomeTeamId(Integer homeTeamId) {
        this.homeTeamId = homeTeamId;
    }

    public Integer getAwayTeamId() {
        return awayTeamId;
    }

    public void setAwayTeamId(Integer awayTeamId) {
        this.awayTeamId = awayTeamId;
    }

    public String getHomeAbbr() {
        return homeAbbr;
    }

    public void setHomeAbbr(String homeAbbr) {
        this.homeAbbr = homeAbbr;
    }

    public String getAwayAbbr() {
        return awayAbbr;
    }

    public void setAwayAbbr(String awayAbbr) {
        this.awayAbbr = awayAbbr;
    }

    public Integer getHomePts() {
        return homePts;
    }

    public void setHomePts(Integer homePts) {
        this.homePts = homePts;
    }

    public Integer getAwayPts() {
        return awayPts;
    }

    public void setAwayPts(Integer awayPts) {
        this.awayPts = awayPts;
    }

    public String getMatchup() {
        return matchup;
    }

    public void setMatchup(String matchup) {
        this.matchup = matchup;
    }
}
