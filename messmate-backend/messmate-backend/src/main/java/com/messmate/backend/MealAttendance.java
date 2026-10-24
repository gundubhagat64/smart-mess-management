package com.messmate.backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "meal_attendance",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_student_date_session",
            columnNames = {"student_id", "meal_date", "session"}
        )
    }
)
public class MealAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "meal_date", nullable = false)
    private LocalDate mealDate;

    @Column(nullable = false, length = 20)
    private String session;

    @Column(name = "meal_items", nullable = false, length = 2000)
    private String mealItems;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "marked_at", nullable = false)
    private LocalDateTime markedAt;

    public MealAttendance() {
    }

    @PrePersist
    protected void onCreate() {
        markedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public LocalDate getMealDate() {
        return mealDate;
    }

    public void setMealDate(LocalDate mealDate) {
        this.mealDate = mealDate;
    }

    public String getSession() {
        return session;
    }

    public void setSession(String session) {
        this.session = session;
    }

    public String getMealItems() {
        return mealItems;
    }

    public void setMealItems(String mealItems) {
        this.mealItems = mealItems;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public LocalDateTime getMarkedAt() {
        return markedAt;
    }
}