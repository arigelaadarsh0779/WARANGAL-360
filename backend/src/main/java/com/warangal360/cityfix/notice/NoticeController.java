package com.warangal360.cityfix.notice;

import com.warangal360.cityfix.common.ApiResponse;
import com.warangal360.cityfix.user.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Notice>>> getActiveNotices() {
        List<Notice> notices = noticeService.getCurrentlyActiveNotices();
        return ResponseEntity.ok(ApiResponse.ok(notices));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Notice>>> getAllNotices() {
        List<Notice> notices = noticeService.getAllNotices();
        return ResponseEntity.ok(ApiResponse.ok(notices));
    }

    @GetMapping("/check-area")
    public ResponseEntity<ApiResponse<Notice>> checkNoticeAtLocation(
            @RequestParam("lat") Double lat,
            @RequestParam("lng") Double lng) {
        Optional<Notice> notice = noticeService.findActiveNoticeAtLocation(lat, lng);
        return ResponseEntity.ok(ApiResponse.ok(notice.orElse(null)));
    }

    @PostMapping("/translate-preview")
    @PreAuthorize("hasAnyRole('OFFICIAL', 'DEPT_HEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> previewTranslation(@RequestBody Map<String, String> body) {
        String msg = body.getOrDefault("messageEn", "");
        String translation = noticeService.previewTranslation(msg);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("translationTe", translation)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OFFICIAL', 'DEPT_HEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Notice>> createNotice(
            @AuthenticationPrincipal User author,
            @Valid @RequestBody NoticeRequest request) {
        Notice notice = noticeService.createNotice(author, request);
        return ResponseEntity.ok(ApiResponse.ok("Notice published successfully", notice));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEPT_HEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok(ApiResponse.ok("Notice deleted successfully", null));
    }
}
