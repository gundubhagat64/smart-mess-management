package com.messmate.backend;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FeedbackRepository extends JpaRepository<Feedback,Long> {
 List<Feedback> findAllByOrderByCreatedAtDesc();
 List<Feedback> findByStudent_IdOrderByCreatedAtDesc(Long studentId);
}
