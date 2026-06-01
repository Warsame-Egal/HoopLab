package com.hooplab.repository;

import com.hooplab.domain.Season;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeasonRepository extends JpaRepository<Season, String> {
}
