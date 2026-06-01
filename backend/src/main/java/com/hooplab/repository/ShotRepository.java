package com.hooplab.repository;

import com.hooplab.domain.Shot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShotRepository extends JpaRepository<Shot, Long> {

    List<Shot> findByPlayerPlayerIdAndSeason(Integer playerId, String season);

    void deleteByPlayerPlayerIdAndSeason(Integer playerId, String season);
}
