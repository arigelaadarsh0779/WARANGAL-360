# PRD: WARANGAL 360

**Product Requirements Document**
Version 1.0 | Hackathon build | Track: Open Innovation (also relevant to Maceco Analytics and SaaSum AI)

---

## 1. Vision

WARANGAL 360 is a public web app where citizens report city problems with a live, location-stamped photo. AI sorts each report, removes duplicates, and sets a priority. The right department gets it, must respond within a fixed time, and is escalated automatically if it does not. Departments can also post area notices (for example planned power cuts) so citizens stop filing unnecessary complaints.

**One-line pitch:** Photo, AI sorts it, duplicates merged, priority scored, routed to the department, fixed or escalated, citizen informed.

## 2. Problem Statement

- Citizens have no simple, trusted way to report civic problems and see what happened next.
- Departments receive duplicate, vague, fake, or old-photo complaints and cannot tell what is urgent.
- Nobody is accountable for response time, so issues sit unanswered.
- Planned work (shutdowns, supply cuts) triggers a flood of avoidable complaints.

## 3. Goals

1. A citizen can report a problem in under one minute.
2. Every valid report reaches the correct department automatically.
3. Duplicates and fake or reused photos are caught before they reach officials.
4. Every report has a visible status and a response deadline.
5. Overdue reports escalate without anyone having to chase them.
6. The whole product is built and run with free tools only.

### Non-goals (for this hackathon)
- Real phone or WhatsApp OTP verification
- Native mobile apps
- Payments or paid services of any kind
- City-wide scale and production hosting

## 4. Users and Roles

| Role | Created how | Main needs |
|---|---|---|
| Citizen | Self-registers with name, phone number, password (no verification) | Report quickly, track status, see area notices, find emergency numbers |
| Official | Created by an admin, login only | See department queue by priority, update status, post notices |
| Department Head | Created by an admin, login only | Everything an official does, plus receives escalations |
| Admin | Seeded in the database, login only | Manage departments, officials, users, SLA settings, contacts, view analytics |

There is no public registration for officials, department heads, or admins.

## 5. Scope

### 5.1 Must build (demo core)
1. Citizen registration and login, role-based dashboards
2. Live camera capture with location stamp (no gallery uploads)
3. AI classification of each report
4. Anti-spam and anti-duplicate pipeline
5. Priority scoring
6. Department routing and instant citizen reply
7. Official dashboard with status updates
8. SLA timers and two-level escalation
9. Department announcements with area targeting
10. Public map
11. Emergency contacts page
12. Admin panel with basic analytics
13. Telugu and English toggle on citizen screens

### 5.2 Nice to have (only if time remains)
- Weather widget in the header
- AI chatbot
- Voice input for descriptions
- Daily AI summary for each department

### 5.3 Future scope (pitch only, do not build)
WhatsApp OTP verification and alerts, face and number-plate blur, offline reporting, field team assignment, reputation points and leaderboards, predictive alerts, disaster mode, Hindi, ward-wise heatmap.

## 6. Functional Requirements

### 6.1 Accounts and access
- **FR-1** Citizen registers with name, phone (10-digit Indian number, stored as +91, unique) and password. Account is active immediately.
- **FR-2** Officials, department heads, and admins have no registration screen. Admins create officials with a temporary password.
- **FR-3** Officials must change the temporary password at first login.
- **FR-4** One login screen for all roles. The system routes each user to the correct dashboard.
- **FR-5** Accounts lock briefly after repeated failed logins.
- **FR-6** Admin can suspend citizens and deactivate officials.
- **FR-7** Every admin and official action is written to an audit log.

### 6.2 Reporting
- **FR-8** Photos can only be captured through the in-app camera. Gallery upload is not offered.
- **FR-9** Location permission is mandatory. If denied, reporting is blocked.
- **FR-10** At capture, the app records latitude, longitude, accuracy, and address, and stamps them with date and time on the image.
- **FR-11** The server records its own timestamp and uses it as the official time.
- **FR-12** Readings with poor accuracy (worse than about 100 m) are rejected with a request to retry.
- **FR-13** The citizen adds a short description in Telugu, English, or Telugu written in English letters.
- **FR-14** After submission, the citizen sees: "Your problem is noted. We will fix it as fast as we can."

### 6.3 AI analysis
- **FR-15** One combined AI call per report returns: valid civic issue (yes or no, with reason), category, severity 1 to 5, emergency flag, one-line English summary, department, screenshot or internet image flag, and an optional crew and equipment suggestion labelled "AI estimate."
- **FR-16** If the AI says the photo is not a civic issue, the report is auto-rejected with the reason shown to the user.
- **FR-17** If the AI call fails or is rate-limited, the report is saved as category OTHER, severity 3, and flagged for manual review.

### 6.4 Spam and duplicates
- **FR-18** Reject photos with the same file hash as an existing report.
- **FR-19** Reject photos whose perceptual hash is very close to an existing report.
- **FR-20** Find open reports of the same category within about 75 m. If one exists, link the new report to it, increase the original's report count, and tell the citizen it is already tracked.
- **FR-21** Ask the AI "same issue?" only when a close match exists. Also compare against recently resolved nearby reports and flag a likely old photo.
- **FR-22** Each citizen is limited to about 5 reports per day. New accounts per IP per hour are limited.
- **FR-23** Each citizen can upvote a report only once.
- **FR-24** Repeated rejections raise the user's rejected count, and past a threshold the account is suspended.

### 6.5 Priority and routing
- **FR-25** Priority score = severity x 20 + min(report count, 10) x 3 + days open x 2 + weather bonus + sensitive location bonus + emergency bonus (50).
- **FR-26** Weather bonus applies to waterlogging and drain issues during rain, and electrical issues during storms.
- **FR-27** Sensitive location bonus applies near schools and hospitals from a configurable list.
- **FR-28** The report is assigned to the department returned by the AI. Emergencies go to the top of the queue.

### 6.6 Officials and status
- **FR-29** Officials see only their department's reports, sorted by priority.
- **FR-30** Status flow: SUBMITTED, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, or REJECTED (with a reason).
- **FR-31** Status updates may include a comment and an "after" photo, captured live with a location stamp.
- **FR-32** Every status change creates an in-app notification for the citizen.
- **FR-33** When a report is marked resolved, the reporter is asked "Is it really fixed?" If no, the report reopens and the SLA clock restarts.

### 6.7 SLA and escalation
- **FR-34** Each category has a response time and a resolution time, editable by admin.
- **FR-35** Default rule: the assigned officer must respond (acknowledge) within 24 hours. Emergencies get about 2 hours.
- **FR-36** A scheduled job checks overdue reports every 15 to 30 minutes.
- **FR-37** Level 0 is the assigned officer. Level 1 is the department head, alerted when the officer misses the deadline.
- **FR-38** Overdue reports show red with a countdown. After Level 1 is reached without a response, the report is marked "critically overdue" and appears at the top of the admin dashboard.
- **FR-39** Every escalation is logged. The timer may be paused only with a stated reason.

### 6.8 Department announcements
- **FR-40** Officials post notices with title, message, affected area (ward or radius), start and end time, reason, and type (planned or emergency).
- **FR-41** Officials write in English. AI translates to Telugu. The official reviews before sending.
- **FR-42** Notices appear as an in-app banner, on the map, and in the notification list. They expire after the end time but stay in history.
- **FR-43** When a citizen starts a report inside an active notice area, the app shows the notice and asks whether they still want to report.

### 6.9 Public views
- **FR-44** The public map shows open issues as markers colored by priority, filterable by category and status.
- **FR-45** Public views show only first names or masked IDs. Phone numbers are never shown.
- **FR-46** The emergency contacts page lists police, ambulance, fire, women's helpline, electricity, water board, and municipal control room, with tap-to-call, in both languages. Admin can edit it.

### 6.10 Admin and analytics
- **FR-47** Admin manages departments, officials, SLA settings, emergency contacts, and suspended users.
- **FR-48** Dashboard shows reports by category, department, and status, average response and resolution time, overdue count, duplicates merged, and top problem areas.

### 6.11 Language
- **FR-49** Telugu and English toggle on citizen screens, saved to the user's profile.
- **FR-50** Database codes stay in English. All screen text lives in one translation file per language.

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Cost | Free tools and free tiers only |
| Performance | Report submission completes in a few seconds, including the AI call |
| Reliability | If AI, geocoding, or weather fails, the app falls back and never crashes |
| Security | BCrypt passwords, JWT, role-based access, input validation, rate limiting |
| Privacy | No phone numbers or full names on public screens |
| Usability | Works on a phone browser, mobile-first layout |
| Accessibility | Large tap targets, readable Telugu font, clear contrast |
| Compatibility | Latest Chrome on Android as the primary target |

## 8. Demo Success Criteria

The demo is successful if it shows, without a failure:
1. A citizen registers and captures a live stamped photo.
2. The AI sorts it and shows category, severity, and department.
3. A duplicate is caught and merged.
4. An official updates the status and the citizen is notified.
5. An overdue report turns red and escalates to the department head.
6. A notice is posted and shown to citizens in the affected area.

## 9. Assumptions

- Phone numbers are unverified. Spam protection relies on the live camera, hashing, duplicate checks, rate limits, and suspension.
- Warangal departments are modeled as: Sanitation, Roads, Electricity, Water, Disaster Management. Real names and contacts must be verified before the demo.
- Sample data uses real Warangal locations.
- Free AI limits are enough for a demo with a few dozen reports.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Free AI quota runs out during demo | Fallback path, cached results, test the day before, recorded backup video |
| Phone camera or GPS blocked without HTTPS | Use a free tunnel, test early on a real phone |
| Scope too large for two people | Freeze features two days before the event, keep nice-to-haves optional |
| Fake GPS from technical users | Server time, accuracy check, hash checks, rate limits, honest note in pitch |
| Free hosting sleeps | Demo from a laptop, wake services beforehand |

## 11. Open Items

- Final list of Warangal wards or areas used for notice targeting
- Final list of schools and hospitals for the sensitive location bonus
- Verified emergency contact numbers
- Work split between the two team members
