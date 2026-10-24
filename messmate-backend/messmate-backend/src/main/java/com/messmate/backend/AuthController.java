
package com.messmate.backend;

import java.util.Locale;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder) {

        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegistrationRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (studentRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "status", "error",
                            "message", "An account with this email already exists"
                    )
            );
        }

        Student student = new Student();
        student.setFullName(request.getFullName().trim());
        student.setEmail(email);
        student.setPhone(
                request.getPhone() == null
                        ? null
                        : request.getPhone().trim()
        );
        student.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );
        student.setRole("STUDENT");

        try {
            Student savedStudent = studentRepository.save(student);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "status", "success",
                            "message", "Student registered successfully",
                            "studentId", savedStudent.getId(),
                            "fullName", savedStudent.getFullName(),
                            "email", savedStudent.getEmail(),
                            "role", savedStudent.getRole()
                    )
            );
        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "status", "error",
                            "message", "This email is already registered"
                    )
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        Student student = studentRepository.findByEmail(email)
                .orElse(null);

        if (student == null
                || !passwordEncoder.matches(
                        request.getPassword(),
                        student.getPasswordHash())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of(
                            "status", "error",
                            "message", "Invalid email or password"
                    )
            );
        }

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "Login successful",
                        "studentId", student.getId(),
                        "fullName", student.getFullName(),
                        "email", student.getEmail(),
                        "phone", student.getPhone() == null
                                ? ""
                                : student.getPhone(),
                        "role", student.getRole()
                )
        );
    }
}
