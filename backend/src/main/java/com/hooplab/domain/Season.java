package com.hooplab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "seasons")
public class Season {

    @Id
    private String season;

    @Column(name = "start_year")
    private Integer startYear;

    @Column(name = "is_current")
    private boolean current;

    protected Season() {
    }

    public Season(String season, Integer startYear, boolean current) {
        this.season = season;
        this.startYear = startYear;
        this.current = current;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public Integer getStartYear() {
        return startYear;
    }

    public void setStartYear(Integer startYear) {
        this.startYear = startYear;
    }

    public boolean isCurrent() {
        return current;
    }

    public void setCurrent(boolean current) {
        this.current = current;
    }
}
