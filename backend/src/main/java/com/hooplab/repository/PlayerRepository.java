package com.hooplab.repository;

import com.hooplab.domain.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlayerRepository extends JpaRepository<Player, Integer> {

    @Query("""
            SELECT p FROM Player p
            WHERE :search = '' OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
            """)
    Page<Player> search(@Param("search") String search, Pageable pageable);
}
