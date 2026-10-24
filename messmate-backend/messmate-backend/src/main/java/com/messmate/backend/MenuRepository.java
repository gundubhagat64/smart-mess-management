
package com.messmate.backend;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    List<Menu> findByMenuDateAndAvailableTrue(LocalDate menuDate);

    List<Menu> findByMenuDate(LocalDate menuDate);
}
