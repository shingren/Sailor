package com.sailor.repository;

import com.sailor.entity.RecetaExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecetaExtraRepository extends JpaRepository<RecetaExtra, Long> {
}
