package com.messmate.backend;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name="feedback")
public class Feedback {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="student_id") private Student student;
    @Column(nullable=false) private int rating;
    @Column(nullable=false, length=500) private String comment;
    @Column(nullable=false) private LocalDateTime createdAt;
    public Feedback() {}
    @PrePersist void onCreate(){ createdAt=LocalDateTime.now(); }
    public Long getId(){return id;} public Student getStudent(){return student;} public void setStudent(Student s){student=s;}
    public int getRating(){return rating;} public void setRating(int r){rating=r;}
    public String getComment(){return comment;} public void setComment(String c){comment=c;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
