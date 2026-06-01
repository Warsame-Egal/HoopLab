package com.hooplab.repository;

import com.hooplab.domain.Game;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface GameRepository extends JpaRepository<Game, String> {

    List<Game> findBySeasonOrderByGameDateDesc(String season, Pageable pageable);

    List<Game> findByGameDateOrderByGameIdAsc(LocalDate gameDate);

    void deleteBySeason(String season);

    long countBySeason(String season);
}
