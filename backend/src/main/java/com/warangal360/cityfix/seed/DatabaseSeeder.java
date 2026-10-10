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
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSeeder(UserRepository userRepository,
                          DepartmentRepository departmentRepository,
                          ReportRepository reportRepository,
                          StatusUpdateRepository statusUpdateRepository,
                          SlaSettingRepository slaSettingRepository,
                          EscalationLogRepository escalationLogRepository,
                          EmergencyContactRepository contactRepository,
                          NoticeRepository noticeRepository,
                          PasswordEncoder passwordEncoder,
                          JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.reportRepository = reportRepository;
        this.statusUpdateRepository = statusUpdateRepository;
        this.slaSettingRepository = slaSettingRepository;
        this.escalationLogRepository = escalationLogRepository;
        this.contactRepository = contactRepository;
        this.noticeRepository = noticeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // 1. Departments (Ensure all required departments exist)
        Department sanitation = getOrCreateDepartment("Sanitation", "sanitation@warangal.gov.in", "+918702450001", "Municipal Solid Waste, Sweeping, and Drain Clearance");
        Department roads = getOrCreateDepartment("Roads", "roads@warangal.gov.in", "+918702450002", "Potholes, Road Repair, Footpaths, and Bitumen Overlay");
        Department electricity = getOrCreateDepartment("Electricity", "electricity@warangal.gov.in", "+918702450003", "Streetlights, Hanging Cables, and Transformer Issues (TSNPDCL)");
        Department water = getOrCreateDepartment("Water Department", "water@warangal.gov.in", "+918702450004", "Pipeline Leaks, Water Supply Contamination, and Valve Repairs (Mission Bhagiratha)");
        Department disaster = getOrCreateDepartment("Disaster Management", "disaster@warangal.gov.in", "+918702450005", "Severe Waterlogging, Fallen Trees, and Storm Emergency Response");
        Department health = getOrCreateDepartment("Health", "health@warangal.gov.in", "+918702450006", "Public Health, Disease Vector Control, Food Safety & Government Hospitals");
        Department municipality = getOrCreateDepartment("Municipality", "gwmc@warangal.gov.in", "+918702450007", "Greater Warangal Municipal Corporation - Civic Administration & Town Planning");
        Department police = getOrCreateDepartment("Police", "police@warangal.gov.in", "+918702450008", "Warangal City Police - Law & Order, Traffic & Citizen Security");
        Department fireEmergency = getOrCreateDepartment("Fire Emergency", "fire@warangal.gov.in", "+918702450009", "Fire & Rescue Services, Disaster Response & Hazardous Situations");
        Department others = getOrCreateDepartment("Others", "grievances@warangal.gov.in", "+918702450010", "General Civic Inquiries, Encroachments, Environmental & Other Grievances");

        // 2. SLA Settings (Ensure seeded)
        if (slaSettingRepository.count() == 0) {
            slaSettingRepository.save(new SlaSetting(Category.ELECTRICAL_HAZARD, 2, 24));
            slaSettingRepository.save(new SlaSetting(Category.FALLEN_TREE, 4, 48));
            slaSettingRepository.save(new SlaSetting(Category.WATERLOGGING, 6, 48));
            slaSettingRepository.save(new SlaSetting(Category.WATER_LEAKAGE, 24, 72));
            slaSettingRepository.save(new SlaSetting(Category.STREETLIGHT, 24, 72));
            slaSettingRepository.save(new SlaSetting(Category.GARBAGE, 24, 48));
            slaSettingRepository.save(new SlaSetting(Category.ROADS, 24, 168));
            slaSettingRepository.save(new SlaSetting(Category.OTHER, 24, 168));
        }

        // 3. Emergency Contacts
        if (contactRepository.count() == 0) {
            contactRepository.save(new EmergencyContact("Police Control Room", "పోలీస్ కంట్రోల్ రూమ్", "100", "POLICE", 1));
            contactRepository.save(new EmergencyContact("Ambulance / Emergency Medical", "అంబులెన్స్ మెడికల్ సర్వీస్", "108", "AMBULANCE", 2));
            contactRepository.save(new EmergencyContact("Fire & Rescue Services", "అగ్నిమాపక కేంద్రం", "101", "FIRE", 3));
            contactRepository.save(new EmergencyContact("Women Helpline", "మహిళా హెల్ప్‌లైన్", "1091", "POLICE", 4));
            contactRepository.save(new EmergencyContact("GWMC Toll-Free Civic Grievance", "వరంగల్ మున్సిపల్ టోల్ ఫ్రీ", "1800-425-1980", "MUNICIPAL", 5));
            contactRepository.save(new EmergencyContact("TSNPDCL Electricity Warangal", "విద్యుత్ హెల్ప్‌లైన్", "1912", "ELECTRICITY", 6));
            contactRepository.save(new EmergencyContact("Mission Bhagiratha Water Board", "మిషన్ భగీరథ నీటి సరఫరా", "0870-2456789", "WATER", 7));
            contactRepository.save(new EmergencyContact("MGM Government Hospital Emergency", "ఎంజీఎం హాస్పిటల్ ఎమర్జెన్సీ", "0870-2441234", "AMBULANCE", 8));
        }

        // 4. Users (Admin and Citizens only - Department members to be added manually by Admin)
        User admin = userRepository.findByPhone("+919999999999").orElseGet(() -> {
            User a = new User("Municipal Commissioner (Admin)", "+919999999999", passwordEncoder.encode("Admin@123"), Role.ROLE_ADMIN);
            a.setPreferredLanguage("en");
            return userRepository.save(a);
        });

        // Safely reassign foreign keys and remove all previous department officials/heads (+9198888... series)
        try {
            jdbcTemplate.update("UPDATE audit_log SET actor_id = ? WHERE actor_id IN (SELECT id FROM users WHERE role IN ('ROLE_OFFICIAL', 'ROLE_DEPT_HEAD') OR phone LIKE '+9198888%' OR phone LIKE '98888%')", admin.getId());
            jdbcTemplate.update("UPDATE status_updates SET updated_by_id = ? WHERE updated_by_id IN (SELECT id FROM users WHERE role IN ('ROLE_OFFICIAL', 'ROLE_DEPT_HEAD') OR phone LIKE '+9198888%' OR phone LIKE '98888%')", admin.getId());
            jdbcTemplate.update("UPDATE escalation_log SET alerted_user_id = ? WHERE alerted_user_id IN (SELECT id FROM users WHERE role IN ('ROLE_OFFICIAL', 'ROLE_DEPT_HEAD') OR phone LIKE '+9198888%' OR phone LIKE '98888%')", admin.getId());
            jdbcTemplate.update("UPDATE notices SET author_id = ? WHERE author_id IN (SELECT id FROM users WHERE role IN ('ROLE_OFFICIAL', 'ROLE_DEPT_HEAD') OR phone LIKE '+9198888%' OR phone LIKE '98888%')", admin.getId());
            jdbcTemplate.update("DELETE FROM users WHERE role IN ('ROLE_OFFICIAL', 'ROLE_DEPT_HEAD') OR phone LIKE '+9198888%' OR phone LIKE '98888%'");
        } catch (Exception e) {
            // Ignore if tables don't exist yet
        }

        // Citizens
        User citizen1 = getOrCreateCitizen("Adarsh Arigela", "+919876543210", "te");
        User citizen2 = getOrCreateCitizen("Ramesh Babu", "+919876543211", "en");
        User citizen3 = getOrCreateCitizen("Priya Sharma", "+919876543212", "en");

        if (noticeRepository.count() == 0) {
            // 5. Notices
            Notice notice1 = new Notice();
            notice1.setDepartment(electricity);
            notice1.setAuthor(admin);
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
            notice2.setAuthor(admin);
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
        }

        // 6. Realistic Seed Reports across Warangal
        // Report 1: Overdue Escalated Report (Sanitation) - for live demo
        if (reportRepository.findByFileHash("hash_garbage_kmc_01").isEmpty()) {
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
                    savedR1, 1, admin,
                    "Officer missed SLA response deadline of 24h. Auto-escalated to Department Head."
            ));
        }

        // Report 2: Emergency Electrical Hazard (Severity 5) near NIT Warangal
        if (reportRepository.findByFileHash("hash_elec_nit_02").isEmpty()) {
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
                    savedR2, admin, ReportStatus.IN_PROGRESS,
                    "Emergency team dispatched with insulated lift vehicle. Line isolated at Kazipet sub-station.", null
            ));
        }

        // Report 3: Dangerous Pothole on Hunter Road (Roads)
        if (reportRepository.findByFileHash("hash_road_hunter_03").isEmpty()) {
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
                    savedR3, admin, ReportStatus.ACKNOWLEDGED,
                    "Site inspected. Cold-mix patch work scheduled for tomorrow morning.", null
            ));
        }

        // Report 4: Water Pipeline Burst near Warangal Fort (Water) - RESOLVED
        if (reportRepository.findByFileHash("hash_water_pillar_04").isEmpty()) {
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
                    savedR4, admin, ReportStatus.RESOLVED,
                    "Pipe segment replaced with new ductile iron collar. Water supply restored.",
                    "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60"
            ));
        }

        // Report 5: Fallen Tree Branch near Public Garden (Disaster Management)
        if (reportRepository.findByFileHash("hash_tree_garden_05").isEmpty()) {
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

        // Report 6: Broken streetlight near Bhadrakali Temple Road (Electricity)
        if (reportRepository.findByFileHash("hash_light_bhadrakali_06").isEmpty()) {
            Report r6 = new Report();
            r6.setUser(citizen3);
            r6.setDescription("Streetlight near Bhadrakali junction has been completely dark for 4 days. Very dangerous at night.");
            r6.setPhotoUrl("https://images.unsplash.com/photo-1609766857793-4b9e58ee11c5?w=600&auto=format&fit=crop&q=60");
            r6.setFileHash("hash_light_bhadrakali_06");
            r6.setPhash("f60718293a4b5c6d");
            r6.setLatitude(17.9775);
            r6.setLongitude(79.5918);
            r6.setAccuracy(10.0);
            r6.setAddress("Bhadrakali Temple Road, Hanamkonda, Warangal 506001");
            r6.setCapturedAt(LocalDateTime.now().minusDays(1));
            r6.setCreatedAt(LocalDateTime.now().minusDays(1));
            r6.setCategory(Category.STREETLIGHT);
            r6.setAiSeverity(2);
            r6.setIsEmergency(false);
            r6.setAiSummary("Non-functional streetlight causing night-time hazard near religious site");
            r6.setAiCrewEstimate("1 electrician + hydraulic lift vehicle");
            r6.setDepartment(electricity);
            r6.setPriorityScore(54);
            r6.setStatus(ReportStatus.SUBMITTED);
            r6.setReportCount(2);
            r6.setUpvotes(3);
            r6.setResponseDeadline(LocalDateTime.now().plusHours(23));
            r6.setResolutionDeadline(LocalDateTime.now().plusDays(3));
            reportRepository.save(r6);
        }

        // Report 7: Waterlogging near Warangal Fort Gate (Disaster Management / Waterlogging)
        if (reportRepository.findByFileHash("hash_flood_fort_07").isEmpty()) {
            Report r7 = new Report();
            r7.setUser(citizen1);
            r7.setDescription("Massive waterlogging near Warangal Fort entrance, knee-deep water blocking vehicles and pedestrians.");
            r7.setPhotoUrl("https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=60");
            r7.setFileHash("hash_flood_fort_07");
            r7.setPhash("60718293a4b5c6d7");
            r7.setLatitude(17.9618);
            r7.setLongitude(79.5940);
            r7.setAccuracy(9.0);
            r7.setAddress("Warangal Fort Archaeological Site Gate, Warangal 506004");
            r7.setCapturedAt(LocalDateTime.now().minusHours(5));
            r7.setCreatedAt(LocalDateTime.now().minusHours(5));
            r7.setCategory(Category.WATERLOGGING);
            r7.setAiSeverity(4);
            r7.setIsEmergency(true);
            r7.setAiSummary("Severe waterlogging blocking historical site access road");
            r7.setAiCrewEstimate("4 disaster management personnel + 2 dewatering pumps");
            r7.setDepartment(disaster);
            r7.setPriorityScore(98);
            r7.setStatus(ReportStatus.IN_PROGRESS);
            r7.setReportCount(5);
            r7.setUpvotes(9);
            r7.setAcknowledgedAt(LocalDateTime.now().minusHours(3));
            r7.setResponseDeadline(LocalDateTime.now().plusHours(1));
            r7.setResolutionDeadline(LocalDateTime.now().plusHours(43));
            Report savedR7 = reportRepository.save(r7);
            statusUpdateRepository.save(new StatusUpdate(
                    savedR7, admin, ReportStatus.IN_PROGRESS,
                    "Dewatering pumps deployed at the fort gate. Water level reducing slowly.", null));
        }

        // Report 8: Open drain overflow near Kakatiya University (Sanitation)
        if (reportRepository.findByFileHash("hash_drain_ku_08").isEmpty()) {
            Report r8 = new Report();
            r8.setUser(citizen2);
            r8.setDescription("Open drain completely blocked and overflowing onto the footpath near Kakatiya University main gate.");
            r8.setPhotoUrl("https://images.unsplash.com/photo-1603771628302-b7e7ad1b9b50?w=600&auto=format&fit=crop&q=60");
            r8.setFileHash("hash_drain_ku_08");
            r8.setPhash("718293a4b5c6d7e8");
            r8.setLatitude(17.9486);
            r8.setLongitude(79.5700);
            r8.setAccuracy(11.0);
            r8.setAddress("Kakatiya University Main Gate Road, Vidyaranyapuri, Warangal 506009");
            r8.setCapturedAt(LocalDateTime.now().minusHours(7));
            r8.setCreatedAt(LocalDateTime.now().minusHours(7));
            r8.setCategory(Category.GARBAGE);
            r8.setAiSeverity(3);
            r8.setIsEmergency(false);
            r8.setAiSummary("Overflowing open drain with garbage accumulation near educational institution");
            r8.setAiCrewEstimate("4 sanitation workers + 1 JCB excavator");
            r8.setDepartment(sanitation);
            r8.setPriorityScore(81); // Sensitive location bonus (KU campus)
            r8.setStatus(ReportStatus.ACKNOWLEDGED);
            r8.setReportCount(3);
            r8.setUpvotes(6);
            r8.setAcknowledgedAt(LocalDateTime.now().minusHours(4));
            r8.setResponseDeadline(LocalDateTime.now().plusHours(20));
            r8.setResolutionDeadline(LocalDateTime.now().plusHours(41));
            Report savedR8 = reportRepository.save(r8);
            statusUpdateRepository.save(new StatusUpdate(
                    savedR8, admin, ReportStatus.ACKNOWLEDGED,
                    "Drain de-silting team scheduled for tomorrow at 7 AM.", null));
        }

        // Report 9: Damaged footpath near Station Road (Roads)
        if (reportRepository.findByFileHash("hash_road_station_09").isEmpty()) {
            Report r9 = new Report();
            r9.setUser(citizen3);
            r9.setDescription("Footpath completely broken with sharp concrete jutting out near Warangal railway station bus stand.");
            r9.setPhotoUrl("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60");
            r9.setFileHash("hash_road_station_09");
            r9.setPhash("8293a4b5c6d7e8f9");
            r9.setLatitude(17.9715);
            r9.setLongitude(79.6023);
            r9.setAccuracy(13.0);
            r9.setAddress("Station Road, near Bus Stand, Warangal Junction, Warangal 506002");
            r9.setCapturedAt(LocalDateTime.now().minusHours(10));
            r9.setCreatedAt(LocalDateTime.now().minusHours(10));
            r9.setCategory(Category.ROADS);
            r9.setAiSeverity(3);
            r9.setIsEmergency(false);
            r9.setAiSummary("Severely damaged footpath with protruding concrete near transit hub");
            r9.setAiCrewEstimate("3 road repair workers + concrete equipment");
            r9.setDepartment(roads);
            r9.setPriorityScore(67);
            r9.setStatus(ReportStatus.SUBMITTED);
            r9.setReportCount(4);
            r9.setUpvotes(5);
            r9.setResponseDeadline(LocalDateTime.now().plusHours(14));
            r9.setResolutionDeadline(LocalDateTime.now().plusDays(7));
            reportRepository.save(r9);
        }

        // Report 10: Water supply contamination near Mulugu Road (Water)
        if (reportRepository.findByFileHash("hash_water_mulugu_10").isEmpty()) {
            Report r10 = new Report();
            r10.setUser(citizen1);
            r10.setDescription("Yellowish, foul-smelling water coming from municipal taps in Mulugu Road colony area.");
            r10.setPhotoUrl("https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60");
            r10.setFileHash("hash_water_mulugu_10");
            r10.setPhash("93a4b5c6d7e8f9a0");
            r10.setLatitude(17.9840);
            r10.setLongitude(79.5505);
            r10.setAccuracy(12.0);
            r10.setAddress("Mulugu Road, Nakkalagutta, Warangal 506001");
            r10.setCapturedAt(LocalDateTime.now().minusHours(4));
            r10.setCreatedAt(LocalDateTime.now().minusHours(4));
            r10.setCategory(Category.WATER_LEAKAGE);
            r10.setAiSeverity(4);
            r10.setIsEmergency(true);
            r10.setAiSummary("Contaminated municipal water supply — possible sewage line cross-connection");
            r10.setAiCrewEstimate("3 water board engineers + portable water quality test kit");
            r10.setDepartment(water);
            r10.setPriorityScore(102);
            r10.setStatus(ReportStatus.SUBMITTED);
            r10.setReportCount(8);
            r10.setUpvotes(14);
            r10.setResponseDeadline(LocalDateTime.now().plusHours(20));
            r10.setResolutionDeadline(LocalDateTime.now().plusHours(68));
            reportRepository.save(r10);
        }

        // Report 11: Electric pole leaning dangerously (Electricity) near Kazipet
        if (reportRepository.findByFileHash("hash_pole_kazipet_11").isEmpty()) {
            Report r11 = new Report();
            r11.setUser(citizen2);
            r11.setDescription("Concrete electrical pole is dangerously tilted after last night's winds near Kazipet railway colony.");
            r11.setPhotoUrl("https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=60");
            r11.setFileHash("hash_pole_kazipet_11");
            r11.setPhash("a4b5c6d7e8f9a0b1");
            r11.setLatitude(17.9533);
            r11.setLongitude(79.5018);
            r11.setAccuracy(8.0);
            r11.setAddress("Railway Colony Road, Kazipet, Warangal 506003");
            r11.setCapturedAt(LocalDateTime.now().minusHours(2));
            r11.setCreatedAt(LocalDateTime.now().minusHours(2));
            r11.setCategory(Category.ELECTRICAL_HAZARD);
            r11.setAiSeverity(5);
            r11.setIsEmergency(true);
            r11.setAiSummary("Wind-damaged electrical pole with live cables posing imminent collapse risk");
            r11.setAiCrewEstimate("2 TSNPDCL linemen + earth anchor team + safety cordon");
            r11.setDepartment(electricity);
            r11.setPriorityScore(155);
            r11.setStatus(ReportStatus.ACKNOWLEDGED);
            r11.setReportCount(3);
            r11.setUpvotes(11);
            r11.setAcknowledgedAt(LocalDateTime.now().minusMinutes(45));
            r11.setResponseDeadline(LocalDateTime.now().plusHours(1));
            r11.setResolutionDeadline(LocalDateTime.now().plusHours(23));
            Report savedR11 = reportRepository.save(r11);
            statusUpdateRepository.save(new StatusUpdate(
                    savedR11, admin, ReportStatus.ACKNOWLEDGED,
                    "TSNPDCL emergency team alerted. Safety cordon being set up around the pole.", null));
        }

        // Report 12: Garbage burning near Hanmakonda vegetable market (Sanitation) - RESOLVED
        if (reportRepository.findByFileHash("hash_burn_market_12").isEmpty()) {
            Report r12 = new Report();
            r12.setUser(citizen3);
            r12.setDescription("Massive uncontrolled garbage burning near Hanamkonda weekly market causing heavy smoke affecting residents.");
            r12.setPhotoUrl("https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=60");
            r12.setFileHash("hash_burn_market_12");
            r12.setPhash("b5c6d7e8f9a0b1c2");
            r12.setLatitude(17.9930);
            r12.setLongitude(79.5562);
            r12.setAccuracy(16.0);
            r12.setAddress("Hanamkonda Weekly Market Road, Subedari, Hanamkonda 506001");
            r12.setCapturedAt(LocalDateTime.now().minusDays(3));
            r12.setCreatedAt(LocalDateTime.now().minusDays(3));
            r12.setCategory(Category.GARBAGE);
            r12.setAiSeverity(4);
            r12.setIsEmergency(false);
            r12.setAiSummary("Illegal waste burning causing air pollution near residential area");
            r12.setAiCrewEstimate("2 sanitation supervisors + water tanker + fire extinguisher");
            r12.setDepartment(sanitation);
            r12.setPriorityScore(88);
            r12.setStatus(ReportStatus.RESOLVED);
            r12.setReportCount(2);
            r12.setUpvotes(8);
            r12.setAcknowledgedAt(LocalDateTime.now().minusDays(3).plusHours(2));
            r12.setResolvedAt(LocalDateTime.now().minusDays(2));
            Report savedR12 = reportRepository.save(r12);
            statusUpdateRepository.save(new StatusUpdate(
                    savedR12, admin, ReportStatus.RESOLVED,
                    "Fire extinguished. Area cleared. Warning notice issued to market vendors. Bio-waste bins installed.",
                    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=60"));
        }

        // Report 13: Pothole swarm on Narsampet Road (Roads - heavily trafficked)
        if (reportRepository.findByFileHash("hash_road_narsampet_13").isEmpty()) {
            Report r13 = new Report();
            r13.setUser(citizen1);
            r13.setDescription("Series of 6-7 large potholes on Narsampet main road, vehicles swerving dangerously to avoid them.");
            r13.setPhotoUrl("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60");
            r13.setFileHash("hash_road_narsampet_13");
            r13.setPhash("c6d7e8f9a0b1c2d3");
            r13.setLatitude(18.0055);
            r13.setLongitude(79.6350);
            r13.setAccuracy(14.0);
            r13.setAddress("Narsampet Main Road, Shayampet, Warangal 506132");
            r13.setCapturedAt(LocalDateTime.now().minusHours(6));
            r13.setCreatedAt(LocalDateTime.now().minusHours(6));
            r13.setCategory(Category.ROADS);
            r13.setAiSeverity(4);
            r13.setIsEmergency(false);
            r13.setAiSummary("Multiple large potholes on high-traffic arterial road causing accident risk");
            r13.setAiCrewEstimate("6 road repair workers + hot-mix asphalt machine + roller");
            r13.setDepartment(roads);
            r13.setPriorityScore(86);
            r13.setStatus(ReportStatus.SUBMITTED);
            r13.setReportCount(7);
            r13.setUpvotes(16);
            r13.setResponseDeadline(LocalDateTime.now().plusHours(18));
            r13.setResolutionDeadline(LocalDateTime.now().plusDays(6));
            reportRepository.save(r13);
        }

        // Report 14: Faded Zebra Crossing & Missing Street Sign (Roads - Normal Level Problem)
        if (reportRepository.findByFileHash("hash_sign_busstand_14").isEmpty()) {
            Report r14 = new Report();
            r14.setUser(citizen3);
            r14.setDescription("Faded pedestrian zebra crossing paint and missing street name sign board near Hanamkonda old bus stand junction.");
            r14.setPhotoUrl("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60");
            r14.setFileHash("hash_sign_busstand_14");
            r14.setPhash("d7e8f9a0b1c2d3e4");
            r14.setLatitude(17.9982);
            r14.setLongitude(79.5610);
            r14.setAccuracy(10.0);
            r14.setAddress("Old Bus Stand Junction, Subedari, Hanamkonda 506001");
            r14.setCapturedAt(LocalDateTime.now().minusHours(2));
            r14.setCreatedAt(LocalDateTime.now().minusHours(2));
            r14.setCategory(Category.ROADS);
            r14.setAiSeverity(1); // Severity 1 = Normal Level Problem
            r14.setIsEmergency(false);
            r14.setAiSummary("Faded pedestrian zebra crossing markings and missing street sign board");
            r14.setAiCrewEstimate("2 painters + thermoplastic line marking machine");
            r14.setDepartment(roads);
            r14.setPriorityScore(24); // Low / Normal Priority Score
            r14.setStatus(ReportStatus.SUBMITTED);
            r14.setReportCount(1);
            r14.setUpvotes(2);
            r14.setResponseDeadline(LocalDateTime.now().plusHours(24));
            r14.setResolutionDeadline(LocalDateTime.now().plusDays(7)); // Standard 7-day routine SLA
            reportRepository.save(r14);
        }
    }

    private Department getOrCreateDepartment(String name, String email, String phone, String description) {
        return departmentRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> departmentRepository.save(new Department(name, email, phone, description)));
    }

    private User getOrCreateCitizen(String name, String phone, String lang) {
        return userRepository.findByPhone(phone).orElseGet(() -> {
            User citizen = new User(name, phone, passwordEncoder.encode("Citizen@123"), Role.ROLE_CITIZEN);
            citizen.setPreferredLanguage(lang);
            return userRepository.save(citizen);
        });
    }
}


