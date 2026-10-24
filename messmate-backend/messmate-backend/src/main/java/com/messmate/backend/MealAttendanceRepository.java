package com.messmate.backend;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MealAttendanceRepository
        extends JpaRepository<MealAttendance, Long> {

    List<MealAttendance> findByStudent_IdOrderByMealDateDesc(
            Long studentId
    );

    List<MealAttendance> findByStudent_IdAndMealDateBetweenOrderByMealDateDesc(
            Long studentId,
            LocalDate startDate,
            LocalDate endDate
    );

    Optional<MealAttendance> findByStudent_IdAndMealDateAndSession(
            Long studentId,
            LocalDate mealDate,
            String session
    );
}