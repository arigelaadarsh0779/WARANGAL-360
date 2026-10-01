package com.warangal360.cityfix.audit;

import com.warangal360.cityfix.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(User actor, String action, String target, String details) {
        if (actor == null) return;
        AuditLog entry = new AuditLog(actor, action, target, details);
        auditLogRepository.save(entry);
    }
}
