package com.messmate.backend;
import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.*;
@Entity
@Table(name="payment_records", uniqueConstraints=@UniqueConstraint(name="uk_payment_student_month", columnNames={"student_id","billing_month"}))
public class PaymentRecord {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="student_id",nullable=false) private Student student;
 @Column(name="billing_month",nullable=false,length=7) private String billingMonth;
 @Column(nullable=false,precision=10,scale=2) private BigDecimal amount=new BigDecimal("3000.00");
 @Column(nullable=false,length=20) private String status="Pending";
 @Column(length=30) private String method="";
 @Column(nullable=false) private LocalDate updatedDate=LocalDate.now();
 public PaymentRecord(){}
 public Long getId(){return id;} public Student getStudent(){return student;} public void setStudent(Student s){student=s;}
 public String getBillingMonth(){return billingMonth;} public void setBillingMonth(String m){billingMonth=m;}
 public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal a){amount=a;}
 public String getStatus(){return status;} public void setStatus(String s){status=s;}
 public String getMethod(){return method;} public void setMethod(String m){method=m;}
 public LocalDate getUpdatedDate(){return updatedDate;} public void setUpdatedDate(LocalDate d){updatedDate=d;}
}
