package com.messmate.backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:5173")
public class MealAttendanceController {

    private final MealAttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final MenuRepository menuRepository;

    public MealAttendanceController(
            MealAttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            MenuRepository menuRepository) {

        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.menuRepository = menuRepository;
    }

    @PostMapping
    public ResponseEntity<?> markMeal(
            @RequestBody MarkMealRequest request) {

        if (request == null ||
                request.getStudentId() == null ||
                request.getSession() == null) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Student ID and session are required"));
        }

        String session = request.getSession()
                .trim()
                .toUpperCase();

        if (!session.equals("LUNCH") &&
                !session.equals("DINNER")) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Session must be LUNCH or DINNER"));
        }

        LocalDate mealDate = request.getMealDate() == null
                ? LocalDate.now()
                : request.getMealDate();

        if (!mealDate.equals(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Only today's meals can be marked"));
        }

        Optional<Student> studentOptional =
                studentRepository.findById(request.getStudentId());

        if (studentOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            "Student not found"));
        }

        Optional<MealAttendance> existing =
                attendanceRepository
                        .findByStudent_IdAndMealDateAndSession(
                                request.getStudentId(),
                                mealDate,
                                session);

        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "This meal is already marked"));
        }

        List<Menu> availableItems = menuRepository
                .findByMenuDate(mealDate)
                .stream()
                .filter(Menu::isAvailable)
                .filter(item ->
                        item.getMealType() != null &&
                        item.getMealType().equalsIgnoreCase(session))
                .toList();

        if (availableItems.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "No available menu for this meal"));
        }

        BigDecimal total = availableItems.stream()
                .map(Menu::getPrice)
                .filter(price -> price != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String items = availableItems.stream()
                .map(Menu::getMealName)
                .filter(name -> name != null)
                .reduce((first, second) -> first + ", " + second)
                .orElse("");

        MealAttendance attendance = new MealAttendance();
        attendance.setStudent(studentOptional.get());
        attendance.setMealDate(mealDate);
        attendance.setSession(session);
        attendance.setMealItems(items);
        attendance.setTotalPrice(total);

        MealAttendance saved =
                attendanceRepository.save(attendance);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "id", saved.getId(),
                        "studentId", request.getStudentId(),
                        "mealDate", saved.getMealDate(),
                        "session", saved.getSession(),
                        "mealItems", saved.getMealItems(),
                        "totalPrice", saved.getTotalPrice(),
                        "markedAt", saved.getMarkedAt()
                ));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentAttendance(
            @PathVariable Long studentId) {

        if (!studentRepository.existsById(studentId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            "Student not found"));
        }

        List<MealAttendance> records =
                attendanceRepository
                        .findByStudent_IdOrderByMealDateDesc(studentId);

        List<Map<String, Object>> result = records.stream()
                .map(item -> Map.<String, Object>of(
                        "id", item.getId(),
                        "studentId", item.getStudent().getId(),
                        "mealDate", item.getMealDate(),
                        "session", item.getSession(),
                        "mealItems", item.getMealItems(),
                        "totalPrice", item.getTotalPrice(),
                        "markedAt", item.getMarkedAt()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    public static class MarkMealRequest {

        private Long studentId;
        private String session;
        private LocalDate mealDate;

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public String getSession() {
            return session;
        }

        public void setSession(String session) {
            this.session = session;
        }

        public LocalDate getMealDate() {
            return mealDate;
        }

        public void setMealDate(LocalDate mealDate) {
            this.mealDate = mealDate;
        }
    }
}