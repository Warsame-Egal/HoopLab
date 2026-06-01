package com.hooplab.repository;

import com.hooplab.domain.TeamGameLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamGameLogRepository extends JpaRepository<TeamGameLog, Long> {

    List<TeamGameLog> findByTeamTeamIdAndSeasonOrderByGameDateAsc(Integer teamId, String season);

    void deleteByTeamTeamIdAndSeason(Integer teamId, String season);
}
