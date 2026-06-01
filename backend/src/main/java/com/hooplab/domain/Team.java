package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @Column(name = "team_id")
    private Integer teamId;

    private String abbreviation;
    private String city;
    private String name;

    @Column(name = "full_name")
    private String fullName;

    private String conference;
    private String division;

    @Column(name = "year_founded")
    private Integer yearFounded;

    private Double latitude;
    private Double longitude;

    public Team() {
    }

    public Team(Integer teamId, String abbreviation, String city, String name, String fullName,
                String conference, String division, Integer yearFounded, Double latitude, Double longitude) {
        this.teamId = teamId;
        this.abbreviation = abbreviation;
        this.city = city;
        this.name = name;
        this.fullName = fullName;
        this.conference = conference;
        this.division = division;
        this.yearFounded = yearFounded;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public String getAbbreviation() {
        return abbreviation;
    }

    public void setAbbreviation(String abbreviation) {
        this.abbreviation = abbreviation;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public Integer getYearFounded() {
        return yearFounded;
    }

    public void setYearFounded(Integer yearFounded) {
        this.yearFounded = yearFounded;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}
