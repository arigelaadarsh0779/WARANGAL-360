package com.warangal360.cityfix.sla;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SlaEscalationScheduler {

    private final SlaService slaService;

    public SlaEscalationScheduler(SlaService slaService) {
        this.slaService = slaService;
    }

    // Run SLA checker every 60 seconds for demo responsiveness (or configured interval)
    @Scheduled(fixedDelayString = "${app.sla.check-interval-ms:60000}")
    public void runSlaChecker() {
        slaService.checkAndEscalateOverdueReports();
    }
}
