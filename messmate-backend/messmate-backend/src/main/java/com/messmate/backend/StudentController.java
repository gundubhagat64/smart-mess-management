package com.messmate.backend;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentController {
    private final StudentRepository students;
    public StudentController(StudentRepository students) { this.students = students; }

    @GetMapping
    public List<Map<String,Object>> allStudents() {
        return students.findAll().stream().map(s -> Map.<String,Object>of(
            "id", s.getId(), "name", s.getFullName(), "fullName", s.getFullName(),
            "email", s.getEmail(), "phone", s.getPhone() == null ? "" : s.getPhone(),
            "role", s.getRole(), "createdAt", s.getCreatedAt()
        )).toList();
    }
}
