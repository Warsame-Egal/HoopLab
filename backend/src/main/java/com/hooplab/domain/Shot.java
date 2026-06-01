package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "shots")
public class Shot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private String season;

    @Column(name = "game_id")
    private String gameId;

    @Column(name = "loc_x")
    private Integer locX;

    @Column(name = "loc_y")
    private Integer locY;

    @Column(name = "shot_made")
    private Boolean shotMade;

    @Column(name = "shot_zone")
    private String shotZone;

    @Column(name = "shot_type")
    private String shotType;

    @Column(name = "shot_distance")
    private Integer shotDistance;

    public Shot() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public String getGameId() {
        return gameId;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public Integer getLocX() {
        return locX;
    }

    public void setLocX(Integer locX) {
        this.locX = locX;
    }

    public Integer getLocY() {
        return locY;
    }

    public void setLocY(Integer locY) {
        this.locY = locY;
    }

    public Boolean getShotMade() {
        return shotMade;
    }

    public void setShotMade(Boolean shotMade) {
        this.shotMade = shotMade;
    }

    public String getShotZone() {
        return shotZone;
    }

    public void setShotZone(String shotZone) {
        this.shotZone = shotZone;
    }

    public String getShotType() {
        return shotType;
    }

    public void setShotType(String shotType) {
        this.shotType = shotType;
    }

    public Integer getShotDistance() {
        return shotDistance;
    }

    public void setShotDistance(Integer shotDistance) {
        this.shotDistance = shotDistance;
    }
}
