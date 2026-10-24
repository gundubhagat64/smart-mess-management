package com.messmate.backend;

import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins="http://localhost:5173")
public class FeedbackController {
 private final FeedbackRepository feedbacks; private final StudentRepository students;
 public FeedbackController(FeedbackRepository f, StudentRepository s){feedbacks=f;students=s;}
 @PostMapping public ResponseEntity<?> create(@RequestBody FeedbackRequest r){
  if(r==null || r.rating<1 || r.rating>5 || r.comment==null || r.comment.trim().length()<10 || r.comment.trim().length()>500)
   return ResponseEntity.badRequest().body(Map.of("message","Rating must be 1-5 and comment must be 10-500 characters."));
  Feedback f=new Feedback(); f.setRating(r.rating); f.setComment(r.comment.trim());
  if(r.studentId!=null){ Student s=students.findById(r.studentId).orElse(null); if(s==null)return ResponseEntity.status(404).body(Map.of("message","Student not found")); f.setStudent(s); }
  return ResponseEntity.status(201).body(toMap(feedbacks.save(f)));
 }
 @GetMapping public List<Map<String,Object>> all(){return feedbacks.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();}
 @GetMapping("/student/{id}") public List<Map<String,Object>> byStudent(@PathVariable Long id){return feedbacks.findByStudent_IdOrderByCreatedAtDesc(id).stream().map(this::toMap).toList();}
 private Map<String,Object> toMap(Feedback f){Map<String,Object> m=new LinkedHashMap<>();m.put("id",f.getId());m.put("studentId",f.getStudent()==null?null:f.getStudent().getId());m.put("studentName",f.getStudent()==null?"Student":f.getStudent().getFullName());m.put("rating",f.getRating());m.put("comment",f.getComment());m.put("date",f.getCreatedAt().toLocalDate().toString());m.put("createdAt",f.getCreatedAt());return m;}
 public static class FeedbackRequest {public Long studentId; public int rating; public String comment;}
}
