package com.hooplab.repository;

import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.domain.PlayerSeasonStatsId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlayerSeasonStatsRepository extends JpaRepository<PlayerSeasonStats, PlayerSeasonStatsId> {

    List<PlayerSeasonStats> findByIdSeasonOrderByPtsDesc(String season, Pageable pageable);

    List<PlayerSeasonStats> findByPlayerPlayerIdOrderByIdSeasonAsc(Integer playerId);

    List<PlayerSeasonStats> findByPlayerPlayerIdOrderByIdSeasonDesc(Integer playerId);

    @Query("""
            SELECT AVG(s.pts), AVG(s.reb), AVG(s.ast), AVG(s.fgPct), AVG(s.fg3Pct)
            FROM PlayerSeasonStats s
            WHERE s.id.season = :season AND s.gp >= 10
            """)
    List<Object[]> leagueAverages(@Param("season") String season);

    @Query("""
            SELECT s.id.season, AVG(s.pts)
            FROM PlayerSeasonStats s
            WHERE s.gp >= 10
            GROUP BY s.id.season
            ORDER BY s.id.season
            """)
    List<Object[]> leagueScoringTrendBySeason();

    @Query("""
            SELECT s FROM PlayerSeasonStats s
            JOIN FETCH s.player
            WHERE s.id.season = :season AND s.team.teamId = :teamId
            ORDER BY s.pts DESC NULLS LAST
            """)
    List<PlayerSeasonStats> findRoster(@Param("season") String season, @Param("teamId") Integer teamId);

    @Query("""
            SELECT s FROM PlayerSeasonStats s
            JOIN FETCH s.player
            LEFT JOIN FETCH s.team
            WHERE s.id.season = :season
            """)
    org.springframework.data.domain.Page<PlayerSeasonStats> findByIdSeason(@Param("season") String season, Pageable pageable);
}
