package com.warangal360.cityfix.notice;

import com.warangal360.cityfix.ai.AiAnalysisService;
import com.warangal360.cityfix.audit.AuditService;
import com.warangal360.cityfix.common.ResourceNotFoundException;
import com.warangal360.cityfix.department.Department;
import com.warangal360.cityfix.department.DepartmentRepository;
import com.warangal360.cityfix.priority.PriorityScoringService;
import com.warangal360.cityfix.user.User;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final DepartmentRepository departmentRepository;
    private final AiAnalysisService aiAnalysisService;
    private final AuditService auditService;

    public NoticeService(NoticeRepository noticeRepository,
                         DepartmentRepository departmentRepository,
                         AiAnalysisService aiAnalysisService,
                         AuditService auditService) {
        this.noticeRepository = noticeRepository;
        this.departmentRepository = departmentRepository;
        this.aiAnalysisService = aiAnalysisService;
        this.auditService = auditService;
    }

    @Transactional
    public Notice createNotice(User author, NoticeRequest request) {
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        String teMessage = request.getMessageTe();
        if (teMessage == null || teMessage.isBlank()) {
            teMessage = aiAnalysisService.translateNoticeToTelugu(request.getMessageEn());
        }

        Notice notice = new Notice();
        notice.setDepartment(dept);
        notice.setAuthor(author);
        notice.setTitle(request.getTitle());
        notice.setMessageEn(request.getMessageEn());
        notice.setMessageTe(teMessage);
        notice.setAreaName(request.getAreaName());
        notice.setLatitude(request.getLatitude());
        notice.setLongitude(request.getLongitude());
        notice.setRadiusMeters(request.getRadiusMeters() != null ? request.getRadiusMeters() : 2000.0);
        notice.setStartTime(request.getStartTime());
        notice.setEndTime(request.getEndTime());
        notice.setReason(request.getReason());
        notice.setType(request.getType() != null ? request.getType() : NoticeType.PLANNED);
        notice.setStatus(NoticeStatus.ACTIVE);
        notice.setCreatedAt(LocalDateTime.now());

        Notice saved = noticeRepository.save(notice);
        auditService.log(author, "CREATE_NOTICE", "Notice #" + saved.getId(), "Title: " + saved.getTitle());
        return saved;
    }

    public List<Notice> getCurrentlyActiveNotices() {
        return noticeRepository.findCurrentlyActiveNotices(LocalDateTime.now());
    }

    public List<Notice> getAllNotices() {
        return noticeRepository.findAll();
    }

    public Optional<Notice> findActiveNoticeAtLocation(Double lat, Double lng) {
        if (lat == null || lng == null) return Optional.empty();
        List<Notice> activeNotices = getCurrentlyActiveNotices();
        for (Notice notice : activeNotices) {
            if (notice.getLatitude() != null && notice.getLongitude() != null) {
                double distance = PriorityScoringService.calculateDistanceMeters(lat, lng, notice.getLatitude(), notice.getLongitude());
                if (distance <= (notice.getRadiusMeters() != null ? notice.getRadiusMeters() : 2000.0)) {
                    return Optional.of(notice);
                }
            } else {
                // If notice has no specific coordinates, it applies generally
                return Optional.of(notice);
            }
        }
        return Optional.empty();
    }

    public String previewTranslation(String messageEn) {
        return aiAnalysisService.translateNoticeToTelugu(messageEn);
    }

    @Scheduled(fixedDelay = 300000) // Check notice expiry every 5 mins
    @Transactional
    public void expireOldNotices() {
        List<Notice> expired = noticeRepository.findExpiredNotices(LocalDateTime.now());
        for (Notice n : expired) {
            n.setStatus(NoticeStatus.EXPIRED);
        }
        noticeRepository.saveAll(expired);
    }
}
