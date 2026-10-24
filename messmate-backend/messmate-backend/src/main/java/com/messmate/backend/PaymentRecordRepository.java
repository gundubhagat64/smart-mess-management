
package com.messmate.backend;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRecordRepository
        extends JpaRepository<PaymentRecord, Long> {

    Optional<PaymentRecord> findByStudent_IdAndBillingMonth(
            Long studentId, String billingMonth);
}
