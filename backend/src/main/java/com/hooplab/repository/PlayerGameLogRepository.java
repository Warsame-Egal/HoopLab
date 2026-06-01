package com.hooplab.repository;

import com.hooplab.domain.PlayerGameLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerGameLogRepository extends JpaRepository<PlayerGameLog, Long> {

    List<PlayerGameLog> findByPlayerPlayerIdAndSeasonOrderByGameDateDesc(Integer playerId, String season);

    void deleteByPlayerPlayerIdAndSeason(Integer playerId, String season);
}
