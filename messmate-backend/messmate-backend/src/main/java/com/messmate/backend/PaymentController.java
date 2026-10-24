
package com.messmate.backend;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentRecordRepository repository;
    private final StudentRepository studentRepository;

    public PaymentController(
            PaymentRecordRepository repository,
            StudentRepository studentRepository) {
        this.repository = repository;
        this.studentRepository = studentRepository;
    }

    @PostMapping("/demo-pay")
    public ResponseEntity<?> demoPay(
            @RequestBody Map<String, String> request) {

        try {
            Long studentId = Long.parseLong(request.get("studentId"));
            String month = request.get("billingMonth");
            String method = request.get("method");

            if (month == null ||
                    !month.matches("\\d{4}-(0[1-9]|1[0-2])")) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Invalid billing month"));
            }

            if (!"Fake UPI".equals(method) &&
                    !"Fake Card".equals(method)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Select a demo payment method"));
            }

            if (!studentRepository.existsById(studentId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of("message", "Student not found"));
            }

            Optional<PaymentRecord> optional =
                    repository.findByStudent_IdAndBillingMonth(
                            studentId, month);

            if (optional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of("message",
                                "No payment record exists for this student and month."));
            }

            PaymentRecord payment = optional.get();

            if ("Paid".equalsIgnoreCase(payment.getStatus())) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "This record is already marked Paid"));
            }

            // DEMO ONLY: no real payment is processed or verified.
            payment.setStatus("Paid");
            payment.setMethod(method);
            payment.setUpdatedDate(LocalDate.now());

            PaymentRecord saved = repository.save(payment);

            return ResponseEntity.ok(Map.of(
                    "message", "Demo payment successful!",
                    "paymentId", saved.getId(),
                    "amount", saved.getAmount(),
                    "status", saved.getStatus(),
                    "method", saved.getMethod(),
                    "demo", true
            ));

        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Valid student ID and month are required"));
        }
    }
}
