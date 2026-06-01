package com.hooplab.repository;

import com.hooplab.domain.TeamSeasonStats;
import com.hooplab.domain.TeamSeasonStatsId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamSeasonStatsRepository extends JpaRepository<TeamSeasonStats, TeamSeasonStatsId> {

    List<TeamSeasonStats> findByTeamTeamIdOrderByIdSeasonDesc(Integer teamId);

    List<TeamSeasonStats> findByTeamTeamIdOrderByIdSeasonAsc(Integer teamId);

    @Query("""
            SELECT s FROM TeamSeasonStats s
            JOIN FETCH s.team t
            WHERE s.id.season = :season
            ORDER BY s.netRtg DESC NULLS LAST
            """)
    List<TeamSeasonStats> findByIdSeasonWithTeamOrderByNetRtgDesc(@Param("season") String season, Pageable pageable);

    @Query("""
            SELECT s FROM TeamSeasonStats s
            JOIN FETCH s.team t
            WHERE s.id.season = :season
            AND (:conference IS NULL OR t.conference = :conference)
            ORDER BY s.netRtg DESC NULLS LAST, s.wins DESC NULLS LAST
            """)
    List<TeamSeasonStats> findStandings(@Param("season") String season,
                                        @Param("conference") String conference);

    @Query("""
            SELECT s FROM TeamSeasonStats s
            JOIN FETCH s.team t
            WHERE s.id.season = :season
            AND t.latitude IS NOT NULL
            AND t.longitude IS NOT NULL
            """)
    List<TeamSeasonStats> findMapData(@Param("season") String season);

    @Query("SELECT s FROM TeamSeasonStats s WHERE s.id.season = :season")
    List<TeamSeasonStats> findAllBySeason(@Param("season") String season);
}
