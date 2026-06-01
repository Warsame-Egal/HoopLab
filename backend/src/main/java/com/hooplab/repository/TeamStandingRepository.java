package com.hooplab.repository;

import com.hooplab.domain.TeamSeasonStatsId;
import com.hooplab.domain.TeamStanding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamStandingRepository extends JpaRepository<TeamStanding, TeamSeasonStatsId> {

    @Query("""
            SELECT s FROM TeamStanding s
            JOIN FETCH s.team t
            WHERE s.id.season = :season
            AND (:conference IS NULL OR s.conference = :conference)
            ORDER BY s.confRank ASC NULLS LAST
            """)
    List<TeamStanding> findBySeason(@Param("season") String season,
                                    @Param("conference") String conference);
}
