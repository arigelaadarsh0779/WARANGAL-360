package com.warangal360.cityfix.seed;

import com.warangal360.cityfix.contact.EmergencyContact;
import com.warangal360.cityfix.contact.EmergencyContactRepository;
import com.warangal360.cityfix.department.Department;
import com.warangal360.cityfix.department.DepartmentRepository;
import com.warangal360.cityfix.notice.Notice;
import com.warangal360.cityfix.notice.NoticeRepository;
import com.warangal360.cityfix.notice.NoticeStatus;
import com.warangal360.cityfix.notice.NoticeType;
import com.warangal360.cityfix.report.*;
import com.warangal360.cityfix.sla.EscalationLog;
import com.warangal360.cityfix.sla.EscalationLogRepository;
import com.warangal360.cityfix.sla.SlaSetting;
import com.warangal360.cityfix.sla.SlaSettingRepository;
import com.warangal360.cityfix.user.AccountStatus;
import com.warangal360.cityfix.user.Role;
import com.warangal360.cityfix.user.User;
import com.warangal360.cityfix.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ReportRepository reportRepository;
    private final StatusUpdateRepository statusUpdateRepository;
    private final SlaSettingRepository slaSettingRepository;
    private final EscalationLogRepository escalationLogRepository;
    private final EmergencyContactRepository contactRepository;
    private final NoticeRepository noticeRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository,
                          DepartmentRepository departmentRepository,
                          ReportRepository reportRepository,
                          StatusUpdateRepository statusUpdateRepository,
                          SlaSettingRepository slaSettingRepository,
                          EscalationLogRepository escalationLogRepository,
                          EmergencyContactRepository contactRepository,
                          NoticeRepository noticeRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.reportRepository = reportRepository;
        this.statusUpdateRepository = statusUpdateRepository;
        this.slaSettingRepository = slaSettingRepository;
        this.escalationLogRepository = escalationLogRepository;
        this.contactRepository = contactRepository;
        this.noticeRepository = noticeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (departmentRepository.count() > 0) {
            return; // Already seeded
        }

        // 1. Departments
        Department sanitation = departmentRepository.save(new Department("Sanitation", "sanitation@warangal.gov.in", "+918702450001", "Municipal Solid Waste, Sweeping, and Drain Clearance"));
        Department roads = departmentRepository.save(new Department("Roads", "roads@warangal.gov.in", "+918702450002", "Potholes, Road Repair, Footpaths, and Bitumen Overlay"));
        Department electricity = departmentRepository.save(new Department("Electricity", "electricity@warangal.gov.in", "+918702450003", "Streetlights, Hanging Cables, and Transformer Issues (TSNPDCL)"));
        Department water = departmentRepository.save(new Department("Water", "water@warangal.gov.in", "+918702450004", "Pipeline Leaks, Water Supply Contamination, and Valve Repairs"));
        Department disaster = departmentRepository.save(new Department("Disaster Management", "disaster@warangal.gov.in", "+918702450005", "Severe Waterlogging, Fallen Trees, and Storm Emergency Response"));

        // 2. SLA Settings
        slaSettingRepository.save(new SlaSetting(Category.ELECTRICAL_HAZARD, 2, 24));
        slaSettingRepository.save(new SlaSetting(Category.FALLEN_TREE, 4, 48));
        slaSettingRepository.save(new SlaSetting(Category.WATERLOGGING, 6, 48));
        slaSettingRepository.save(new SlaSetting(Category.WATER_LEAKAGE, 24, 72));
        slaSettingRepository.save(new SlaSetting(Category.STREETLIGHT, 24, 72));
        slaSettingRepository.save(new SlaSetting(Category.GARBAGE, 24, 48));
        slaSettingRepository.save(new SlaSetting(Category.ROADS, 24, 168));
        slaSettingRepository.save(new SlaSetting(Category.OTHER, 24, 168));

        // 3. Emergency Contacts
        contactRepository.save(new EmergencyContact("Police Control Room", "పోలీస్ కంట్రోల్ రూమ్", "100", "POLICE", 1));
        contactRepository.save(new EmergencyContact("Ambulance / Emergency Medical", "అంబులెన్స్ మెడికల్ సర్వీస్", "108", "AMBULANCE", 2));
        contactRepository.save(new EmergencyContact("Fire & Rescue Services", "అగ్నిమాపక కేంద్రం", "101", "FIRE", 3));
        contactRepository.save(new EmergencyContact("Women Helpline", "మహిళా హెల్ప్‌లైన్", "1091", "POLICE", 4));
        contactRepository.save(new EmergencyContact("GWMC Toll-Free Civic Grievance", "వరంగల్ మున్సిపల్ టోల్ ఫ్రీ", "1800-425-1980", "MUNICIPAL", 5));
        contactRepository.save(new EmergencyContact("TSNPDCL Electricity Warangal", "విద్యుత్ హెల్ప్‌లైన్", "1912", "ELECTRICITY", 6));
        contactRepository.save(new EmergencyContact("Mission Bhagiratha Water Board", "మిషన్ భగీరథ నీటి సరఫరా", "0870-2456789", "WATER", 7));
        contactRepository.save(new EmergencyContact("MGM Government Hospital Emergency", "ఎంజీఎం హాస్పిటల్ ఎమర్జెన్సీ", "0870-2441234", "AMBULANCE", 8));

        // 4. Users
        // Admin
        User admin = new User("Municipal Commissioner (Admin)", "+919999999999", passwordEncoder.encode("Admin@123"), Role.ROLE_ADMIN);
        admin.setPreferredLanguage("en");
        userRepository.save(admin);

        // Department Heads (Level 1)
        User sanHead = new User("Dr. K. Srinivas (Sanitation Head)", "+919888800001", passwordEncoder.encode("Warangal@123"), Role.ROLE_DEPT_HEAD);
        sanHead.setDepartment(sanitation);
        sanHead.setDesignationLevel(1);
        userRepository.save(sanHead);

        User roadHead = new User("Er. M. Rajendra (Roads Head)", "+919888800002", passwordEncoder.encode("Warangal@123"), Role.ROLE_DEPT_HEAD);
        roadHead.setDepartment(roads);
        roadHead.setDesignationLevel(1);
        userRepository.save(roadHead);

        User elecHead = new User("Er. V. Ramesh (Electricity Head)", "+919888800003", passwordEncoder.encode("Warangal@123"), Role.ROLE_DEPT_HEAD);
        elecHead.setDepartment(electricity);
        elecHead.setDesignationLevel(1);
        userRepository.save(elecHead);

        User waterHead = new User("Er. S. Anitha (Water Supply Head)", "+919888800004", passwordEncoder.encode("Warangal@123"), Role.ROLE_DEPT_HEAD);
        waterHead.setDepartment(water);
        waterHead.setDesignationLevel(1);
        userRepository.save(waterHead);

        User disasterHead = new User("Sri D. Prabhakar (Disaster Head)", "+919888800005", passwordEncoder.encode("Warangal@123"), Role.ROLE_DEPT_HEAD);
        disasterHead.setDepartment(disaster);
        disasterHead.setDesignationLevel(1);
        userRepository.save(disasterHead);

        // Department Officers (Level 0)
        User sanOfficer = new User("P. Venkat (Sanitation Inspector)", "+919888811001", passwordEncoder.encode("Warangal@123"), Role.ROLE_OFFICIAL);
        sanOfficer.setDepartment(sanitation);
        sanOfficer.setDesignationLevel(0);
        userRepository.save(sanOfficer);

        User roadOfficer = new User("T. Sridhar (Roads AE)", "+919888811002", passwordEncoder.encode("Warangal@123"), Role.ROLE_OFFICIAL);
        roadOfficer.setDepartment(roads);
        roadOfficer.setDesignationLevel(0);
        userRepository.save(roadOfficer);

        User elecOfficer = new User("B. Mahesh (Electrical Lineman)", "+919888811003", passwordEncoder.encode("Warangal@123"), Role.ROLE_OFFICIAL);
        elecOfficer.setDepartment(electricity);
        elecOfficer.setDesignationLevel(0);
        userRepository.save(elecOfficer);

        // Citizens
        User citizen1 = new User("Adarsh Arigela", "+919876543210", passwordEncoder.encode("Citizen@123"), Role.ROLE_CITIZEN);
        citizen1.setPreferredLanguage("te");
        userRepository.save(citizen1);

        User citizen2 = new User("Ramesh Babu", "+919876543211", passwordEncoder.encode("Citizen@123"), Role.ROLE_CITIZEN);
        citizen2.setPreferredLanguage("en");
        userRepository.save(citizen2);

        User citizen3 = new User("Priya Sharma", "+919876543212", passwordEncoder.encode("Citizen@123"), Role.ROLE_CITIZEN);
        userRepository.save(citizen3);

        // 5. Notices
        Notice notice1 = new Notice();
        notice1.setDepartment(electricity);
        notice1.setAuthor(elecHead);
        notice1.setTitle("Planned Maintenance Power Shutdown - Hanamkonda Subedari");
        notice1.setMessageEn("Scheduled 33kV transformer maintenance and feeder overhaul. Power will be interrupted from 2:00 PM to 6:00 PM today.");
        notice1.setMessageTe("హనుమకొండ సుబేదారి ప్రాంతంలో 33kV ట్రాన్స్‌ఫార్మర్ మరమ్మతుల కారణంగా ఈరోజు మధ్యాహ్నం 2:00 నుండి సాయంత్రం 6:00 వరకు విద్యుత్ సరఫరా నిలిపివేయబడుతుంది.");
        notice1.setAreaName("Subedari & Balasamudram, Hanamkonda");
        notice1.setLatitude(17.9950);
        notice1.setLongitude(79.5700);
        notice1.setRadiusMeters(2500.0);
        notice1.setStartTime(LocalDateTime.now().minusHours(1));
        notice1.setEndTime(LocalDateTime.now().plusHours(4));
        notice1.setReason("Pre-monsoon feeder enhancement");
        notice1.setType(NoticeType.PLANNED);
        notice1.setStatus(NoticeStatus.ACTIVE);
        noticeRepository.save(notice1);

        Notice notice2 = new Notice();
        notice2.setDepartment(disaster);
        notice2.setAuthor(disasterHead);
        notice2.setTitle("Heavy Inundation Warning near Waddepally Tank");
        notice2.setMessageEn("Due to heavy rainfall upstream, low-lying storm channels near Waddepally cause temporary waterlogging. Emergency response pumps deployed.");
        notice2.setMessageTe("భారీ వర్షాల కారణంగా వడ్డేపల్లి చెరువు సమీప లోతట్టు ప్రాంతాలలో నీరు నిలిచే అవకాశం ఉంది. అత్యవసర డీవాటరింగ్ పంపులు ఏర్పాటు చేయబడ్డాయి.");
        notice2.setAreaName("Waddepally Lake Surrounds");
        notice2.setLatitude(18.0100);
        notice2.setLongitude(79.5400);
        notice2.setRadiusMeters(3000.0);
        notice2.setStartTime(LocalDateTime.now().minusHours(2));
        notice2.setEndTime(LocalDateTime.now().plusHours(8));
        notice2.setReason("Monsoon heavy inflow");
        notice2.setType(NoticeType.EMERGENCY);
        notice2.setStatus(NoticeStatus.ACTIVE);
        noticeRepository.save(notice2);

        // 6. Realistic Seed Reports across Warangal
        // Report 1: Overdue Escalated Report (Sanitation) - for live demo
        Report r1 = new Report();
        r1.setUser(citizen1);
        r1.setDescription("Major garbage pile accumulation near Kakatiya Medical College gate with bad stench.");
        r1.setPhotoUrl("https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=60");
        r1.setFileHash("hash_garbage_kmc_01");
        r1.setPhash("a1b2c3d4e5f60718");
        r1.setLatitude(17.9890);
        r1.setLongitude(79.5850);
        r1.setAccuracy(15.0);
        r1.setAddress("Near KMC Gate 2, Rangampet Road, Warangal, Telangana 506007");
        r1.setCapturedAt(LocalDateTime.now().minusHours(36));
        r1.setCreatedAt(LocalDateTime.now().minusHours(36));
        r1.setCategory(Category.GARBAGE);
        r1.setAiSeverity(4);
        r1.setIsEmergency(false);
        r1.setAiSummary("Overflowing garbage mound near medical institution entrance");
        r1.setAiCrewEstimate("3 sanitation crew + 1 compactor vehicle");
        r1.setDepartment(sanitation);
        r1.setPriorityScore(95); // High priority + Sensitive location bonus
        r1.setStatus(ReportStatus.SUBMITTED);
        r1.setReportCount(3);
        r1.setUpvotes(5);
        r1.setResponseDeadline(LocalDateTime.now().minusHours(12)); // Past deadline!
        r1.setResolutionDeadline(LocalDateTime.now().plusHours(12));
        r1.setEscalationLevel(1); // Escalated to Dept Head!
        Report savedR1 = reportRepository.save(r1);

        escalationLogRepository.save(new EscalationLog(
                savedR1, 1, sanHead,
                "Officer missed SLA response deadline of 24h. Auto-escalated to Department Head."
        ));

        // Report 2: Emergency Electrical Hazard (Severity 5) near NIT Warangal
        Report r2 = new Report();
        r2.setUser(citizen2);
        r2.setDescription("Live 440V electrical wire snapped and hanging low over the walkway near NIT Main Gate.");
        r2.setPhotoUrl("https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=60");
        r2.setFileHash("hash_elec_nit_02");
        r2.setPhash("b2c3d4e5f6071829");
        r2.setLatitude(17.9839);
        r2.setLongitude(79.5308);
        r2.setAccuracy(8.0);
        r2.setAddress("National Institute of Technology Campus Road, Kazipet, Warangal 506004");
        r2.setCapturedAt(LocalDateTime.now().minusHours(1));
        r2.setCreatedAt(LocalDateTime.now().minusHours(1));
        r2.setCategory(Category.ELECTRICAL_HAZARD);
        r2.setAiSeverity(5);
        r2.setIsEmergency(true);
        r2.setAiSummary("Live snapped power cable hanging over pedestrian footpath");
        r2.setAiCrewEstimate("2 certified linemen + high-voltage safety kit");
        r2.setDepartment(electricity);
        r2.setPriorityScore(165); // 5*20 + 50 emergency + 15 sensitive (NIT)
        r2.setStatus(ReportStatus.IN_PROGRESS);
        r2.setReportCount(4);
        r2.setUpvotes(12);
        r2.setResponseDeadline(LocalDateTime.now().plusHours(1));
        r2.setResolutionDeadline(LocalDateTime.now().plusHours(23));
        r2.setEscalationLevel(0);
        r2.setAcknowledgedAt(LocalDateTime.now().minusMinutes(30));
        Report savedR2 = reportRepository.save(r2);

        statusUpdateRepository.save(new StatusUpdate(
                savedR2, elecOfficer, ReportStatus.IN_PROGRESS,
                "Emergency team dispatched with insulated lift vehicle. Line isolated at Kazipet sub-station.", null
        ));

        // Report 3: Dangerous Pothole on Hunter Road (Roads)
        Report r3 = new Report();
        r3.setUser(citizen3);
        r3.setDescription("Deep water-filled crater pothole causing bike accidents near Hunter Road junction.");
        r3.setPhotoUrl("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60");
        r3.setFileHash("hash_road_hunter_03");
        r3.setPhash("c3d4e5f60718293a");
        r3.setLatitude(17.9710);
        r3.setLongitude(79.5820);
        r3.setAccuracy(12.0);
        r3.setAddress("Hunter Road, Shyampet, Hanamkonda, Warangal 506001");
        r3.setCapturedAt(LocalDateTime.now().minusHours(8));
        r3.setCreatedAt(LocalDateTime.now().minusHours(8));
        r3.setCategory(Category.ROADS);
        r3.setAiSeverity(3);
        r3.setIsEmergency(false);
        r3.setAiSummary("Deep road surface crater creating traffic hazard");
        r3.setAiCrewEstimate("4 road workers + bitumen patch roller");
        r3.setDepartment(roads);
        r3.setPriorityScore(72);
        r3.setStatus(ReportStatus.ACKNOWLEDGED);
        r3.setReportCount(2);
        r3.setUpvotes(4);
        r3.setResponseDeadline(LocalDateTime.now().plusHours(16));
        r3.setResolutionDeadline(LocalDateTime.now().plusDays(6));
        r3.setAcknowledgedAt(LocalDateTime.now().minusHours(6));
        Report savedR3 = reportRepository.save(r3);

        statusUpdateRepository.save(new StatusUpdate(
                savedR3, roadOfficer, ReportStatus.ACKNOWLEDGED,
                "Site inspected. Cold-mix patch work scheduled for tomorrow morning.", null
        ));

        // Report 4: Water Pipeline Burst near Warangal Fort (Water) - RESOLVED
        Report r4 = new Report();
        r4.setUser(citizen1);
        r4.setDescription("Main pipeline burst wasting drinking water near Thousand Pillar Temple entrance.");
        r4.setPhotoUrl("https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60");
        r4.setFileHash("hash_water_pillar_04");
        r4.setPhash("d4e5f60718293a4b");
        r4.setLatitude(17.9958);
        r4.setLongitude(79.5755);
        r4.setAccuracy(10.0);
        r4.setAddress("Thousand Pillar Temple Road, Brahmanawada, Hanamkonda 506001");
        r4.setCapturedAt(LocalDateTime.now().minusDays(2));
        r4.setCreatedAt(LocalDateTime.now().minusDays(2));
        r4.setCategory(Category.WATER_LEAKAGE);
        r4.setAiSeverity(3);
        r4.setIsEmergency(false);
        r4.setAiSummary("High-pressure pipeline burst leaking clean municipal water");
        r4.setAiCrewEstimate("2 water board plumbers + pipe clamp");
        r4.setDepartment(water);
        r4.setPriorityScore(66);
        r4.setStatus(ReportStatus.RESOLVED);
        r4.setReportCount(1);
        r4.setUpvotes(7);
        r4.setAcknowledgedAt(LocalDateTime.now().minusDays(2).plusHours(2));
        r4.setResolvedAt(LocalDateTime.now().minusHours(5));
        Report savedR4 = reportRepository.save(r4);

        statusUpdateRepository.save(new StatusUpdate(
                savedR4, waterHead, ReportStatus.RESOLVED,
                "Pipe segment replaced with new ductile iron collar. Water supply restored.",
                "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60"
        ));

        // Report 5: Fallen Tree Branch near Public Garden (Disaster Management)
        Report r5 = new Report();
        r5.setUser(citizen2);
        r5.setDescription("Large tree branch fell across the lane near Public Garden entrance.");
        r5.setPhotoUrl("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60");
        r5.setFileHash("hash_tree_garden_05");
        r5.setPhash("e5f60718293a4b5c");
        r5.setLatitude(17.9970);
        r5.setLongitude(79.5630);
        r5.setAccuracy(14.0);
        r5.setAddress("Public Gardens Road, Subedari, Hanamkonda 506001");
        r5.setCapturedAt(LocalDateTime.now().minusHours(3));
        r5.setCreatedAt(LocalDateTime.now().minusHours(3));
        r5.setCategory(Category.FALLEN_TREE);
        r5.setAiSeverity(3);
        r5.setIsEmergency(false);
        r5.setAiSummary("Fallen tree branch obstructing lane passageway");
        r5.setAiCrewEstimate("3 emergency personnel + chainsaw");
        r5.setDepartment(disaster);
        r5.setPriorityScore(74);
        r5.setStatus(ReportStatus.SUBMITTED);
        r5.setReportCount(1);
        r5.setUpvotes(2);
        r5.setResponseDeadline(LocalDateTime.now().plusHours(1));
        r5.setResolutionDeadline(LocalDateTime.now().plusHours(45));
        reportRepository.save(r5);
    }
}
