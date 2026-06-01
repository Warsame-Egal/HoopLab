package com.hooplab.repository;

import com.hooplab.domain.TeamClutchStats;
import com.hooplab.domain.TeamSeasonStatsId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamClutchStatsRepository extends JpaRepository<TeamClutchStats, TeamSeasonStatsId> {

    @Query("""
            SELECT s FROM TeamClutchStats s
            JOIN FETCH s.team t
            WHERE s.id.season = :season
            ORDER BY s.netRtg DESC NULLS LAST
            """)
    List<TeamClutchStats> findBySeason(@Param("season") String season);
}
