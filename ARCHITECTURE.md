# ARCHITECTURE: WARANGAL 360

Version 1.0 | Describes how the system is structured. See PRD.md for what it does, RULES.md for how we build it, DESIGN.md for how it looks.

---

## 1. Architecture at a Glance

A single-page React app talks to a Spring Boot REST API. The API stores data in MySQL, stores photos on disk, and calls a few free external services (AI, weather, address lookup). A scheduled job inside Spring Boot handles SLA escalation and notice expiry.

```
  Citizen / Official / Admin (phone or laptop browser)
                    |
                    v
        React web app (Vite, mobile-first)
                    |  HTTPS + JWT
                    v
          Spring Boot REST API
     (auth, reports, officials, notices, admin)
        |         |            |           |
        v         v            v           v
     MySQL    Photo storage   AI API    Weather / Address
   (data)    (local disk)   (free tier)  (Open-Meteo, Nominatim)

   Scheduled jobs inside Spring Boot:
   SLA checker, notice expiry
```

The frontend choice is React (Vite). It gives the best camera, map, language toggle, and chart experience, and keeps UI work separate from the backend work.

## 2. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Java, Spring Boot 3 | Team skill |
| Security | Spring Security with JWT | Stateless, role-based |
| Data access | Spring Data JPA | Fast to build |
| Database | MySQL | Team skill, relational fits the data |
| Scheduling | Spring scheduled tasks | No extra service needed |
| Frontend | React with Vite, React Router | Fast dev, good camera and map support |
| Map | Leaflet with OpenStreetMap tiles | Free |
| Charts | Chart.js | Free, simple |
| Address lookup | Nominatim | Free, rate limited |
| Weather | Open-Meteo | Free, no key |
| AI | Free-tier vision LLM (for example Gemini) | Free tier supports images |
| Image hashing and EXIF | Free Java libraries | No cost |
| Email (optional) | Gmail SMTP or Brevo free tier | Free daily limit |
| HTTPS for phone testing | Free tunnel (ngrok or Cloudflare Tunnel) | Camera and GPS need HTTPS |

## 3. Backend Structure

Layered architecture. Controllers never touch the database directly.

```
backend/
  src/main/java/.../cityfix/
    config/          security, CORS, scheduling, rate limiting, app properties
    auth/            login, register, JWT, password change
    user/            users, roles, suspension
    department/      departments, officials, designation levels
    report/          report entity, submission pipeline, status updates, upvotes
    verification/    file hash, perceptual hash, EXIF, duplicate checks
    ai/              AI client, prompt templates, JSON parsing, fallback
    priority/        priority scoring, weather and sensitive location bonuses
    sla/             SLA settings, scheduled checker, escalation log
    notice/          department announcements, translation, expiry
    notification/    in-app notifications
    contact/         emergency contacts
    analytics/       admin statistics
    common/          DTOs, exceptions, error format, utilities
  src/main/resources/
    application.properties   (no secrets, reads environment variables)
    prompts/                 AI prompt templates
    seed/                    demo data
```

Each feature package holds its own controller, service, repository, entity, and DTOs.

## 4. Frontend Structure

```
frontend/
  src/
    pages/         Login, Register, Home, ReportCamera, MyReports, ReportDetail,
                   PublicMap, Notices, EmergencyContacts,
                   OfficialDashboard, AdminPanel, Analytics
    components/    CameraCapture, StatusBadge, PriorityTag, ReportCard,
                   NoticeBanner, MapView, LanguageToggle, ChartCards
    services/      API client, auth token handling
    i18n/          en.json, te.json (all screen text)
    styles/        design tokens from DESIGN.md
```

Role routing: after login, citizens go to Home, officials and department heads go to the Official Dashboard, admins go to the Admin Panel.

## 5. Data Model

| Table | Purpose | Key fields |
|---|---|---|
| users | All accounts | id, name, phone (unique), password_hash, role, department_id, designation_level, account_status, rejected_count, must_change_password, preferred_language, last_login |
| departments | Sanitation, Roads, Electricity, Water, Disaster Management | id, name, contact_email |
| reports | Core table | id, user_id (required), description, photo_url, file_hash, phash, latitude, longitude, accuracy, address, captured_at, category, ai_severity, is_emergency, ai_summary, ai_crew_estimate, priority_score, status, department_id, parent_report_id, report_count, upvotes, reopen_count, created_at, resolved_at |
| status_updates | History of changes | report_id, updated_by, status, comment, after_photo_url, created_at |
| notifications | In-app messages | user_id, report_id, message, is_read, created_at |
| report_upvotes | One upvote per user per report | report_id, user_id (unique together) |
| notices | Department announcements | department_id, author_id, message_en, message_te, area, start_time, end_time, type, status |
| sla_settings | Deadlines per category | category, response_hours, resolution_hours |
| escalation_log | Audit trail of escalations | report_id, level, alerted_user_id, created_at |
| emergency_contacts | Numbers page | name_en, name_te, phone, display_order |
| audit_log | Admin and official actions | actor_id, action, target, created_at |

Indexes: (latitude, longitude), status, department_id, category, file_hash.

Rule: a duplicate report points to the original through parent_report_id, and the original's report_count increases.

## 6. Core Flow: Report Submission Pipeline

1. **Capture (frontend):** camera opens, location is read, address is looked up, text is stamped on the image, photo and fields are sent.
2. **Validate (backend):** check login, file type and size, accuracy, daily limit, account status.
3. **Server time:** the server sets the official timestamp.
4. **Cheap checks first:** file hash match, perceptual hash match.
5. **Location check:** open reports of the same category within about 75 m.
6. **AI call:** one combined call for validity, category, severity, emergency, summary, department, screenshot flag, crew estimate.
7. **Decision:**
   - Not a civic issue: reject with reason, increase rejected count.
   - Close match found: optional AI same-issue check, then merge into the original, increase its count, notify the citizen.
   - Otherwise: continue as a new issue.
8. **Priority:** fetch weather, add bonuses, compute the score.
9. **Route:** assign the department, set the SLA deadline, save.
10. **Reply:** create the citizen notification. If emergency, alert the department immediately.

Order matters: cheap local checks run before any AI call to save free-tier quota.

## 7. SLA and Escalation Flow

- A scheduled job runs every 15 to 30 minutes.
- It finds reports where the response deadline has passed with no acknowledgement.
- **Level 0:** assigned officer (set at routing).
- **Level 1:** department head is notified and the report is marked overdue (red).
- After Level 1 with no response, the report is marked critically overdue and shown at the top of the admin dashboard. There is no further alert level.
- Each step is written to escalation_log.
- A reopened report restarts the response clock.
- The clock can be paused only with a stated reason, recorded in the audit log.

## 8. Announcements Flow

1. Official writes the notice in English, with area, times, and reason.
2. Backend calls the AI to translate to Telugu.
3. Official reviews and confirms.
4. Notice becomes active at its start time and appears as a banner, on the map, and in notifications.
5. When a citizen starts a report, the backend checks whether the location falls inside an active notice area and returns the notice for the app to show.
6. The scheduled job expires the notice after its end time. History remains visible.

## 9. AI Integration

- One client class wraps the provider so it can be swapped.
- Prompts live in text files under resources, not in code.
- The prompt demands strict JSON only. The parser strips code fences and validates every field.
- On failure or rate limit: save with category OTHER and severity 3, flag for manual review.
- Results are cached by file hash so a repeated call never costs quota.
- A short delay between calls respects free-tier limits.
- Other AI uses: same-issue comparison, notice translation, optional chatbot, optional daily summary.

## 10. Security Design

- BCrypt password hashing, JWT with an expiry, role checks on every endpoint.
- No endpoint creates officials or admins except the admin-only one.
- Citizens can only read their own reports and notifications.
- Public map data excludes phone numbers and full names.
- Rate limits on report submission and login.
- API keys come from environment variables only.
- File uploads are checked for type and size and stored under generated names.

## 11. External Services and Their Limits

| Service | Use | Limit to respect |
|---|---|---|
| AI provider | Analysis, translation, chatbot | Per-minute and per-day quota (confirm current limits) |
| Nominatim | Coordinates to address | About 1 request per second, needs a proper app identifier |
| Open-Meteo | Weather | Fair use |
| OpenStreetMap tiles | Map | Fair use, not for heavy traffic |
| Email provider | Optional emails | Daily cap |

## 12. Deployment for the Hackathon

- Primary: run backend, frontend, and MySQL on a team laptop, exposed to phones through a free HTTPS tunnel.
- Backup: a recorded video of the full flow plus a seeded database.
- Optional free hosting is acceptable, but free hosts sleep, so wake them before presenting.
- Photos are stored on local disk. If a free host is used, remember its disk may be wiped.

## 13. Error Handling

- Global exception handler returns one consistent JSON error shape.
- Every external call has a timeout and a fallback.
- The citizen always gets a clear message: retry, wrong location accuracy, already reported, rejected with reason.
- Failures in AI, weather, or address lookup never block saving a report.
