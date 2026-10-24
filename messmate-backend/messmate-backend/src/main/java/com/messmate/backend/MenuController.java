
package com.messmate.backend;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menus")
@CrossOrigin(origins = "http://localhost:5173")
public class MenuController {

    private final MenuRepository menuRepository;

    public MenuController(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    // Get today's available menu
    @GetMapping("/today")
    public List<Menu> getTodayMenu() {
        return menuRepository.findByMenuDateAndAvailableTrue(
                LocalDate.now()
        );
    }

    // Get menu for a selected date
    @GetMapping
    public List<Menu> getMenus(
            @RequestParam(required = false) String date) {

        LocalDate menuDate =
                (date == null || date.isBlank())
                        ? LocalDate.now()
                        : LocalDate.parse(date);

        return menuRepository.findByMenuDate(menuDate);
    }

    // Add a menu item
    @PostMapping
    public ResponseEntity<?> addMenu(@RequestBody Menu menu) {

        if (menu.getMealName() == null
                || menu.getMealName().isBlank()
                || menu.getMealType() == null
                || menu.getMealType().isBlank()
                || menu.getPrice() == null
                || menu.getPrice().signum() < 0
                || menu.getMenuDate() == null) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Please provide valid menu details")
            );
        }

        menu.setMealName(menu.getMealName().trim());
        menu.setMealType(menu.getMealType().trim().toUpperCase());
        menu.setAvailable(true);

        Menu savedMenu = menuRepository.save(menu);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedMenu);
    }

    // Update menu availability
    @PutMapping("/{id}/availability")
    public ResponseEntity<?> updateAvailability(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {

        Menu menu = menuRepository.findById(id).orElse(null);

        if (menu == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("message", "Menu item not found")
            );
        }

        Boolean available = request.get("available");

        if (available == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Availability is required")
            );
        }

        menu.setAvailable(available);

        return ResponseEntity.ok(menuRepository.save(menu));
    }
}
