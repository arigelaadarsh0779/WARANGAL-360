# RULES: WARANGAL 360

Version 1.0 | The rules the team and any AI coding assistant must follow. If a rule conflicts with a request, the rule wins unless both team members agree to change it here first.

---

## 1. Golden Rules

1. **Core loop first.** Capture, AI, duplicate check, priority, dashboard, citizen update. Nothing else matters until this works end to end.
2. **Zero budget.** Only free tools and free tiers. Never add a paid service, a card-required signup, or a paid API.
3. **Scope freeze.** No new features in the last two days before the event. Only bug fixes, polish, data, and rehearsal.
4. **Demo beats features.** A smooth two-minute demo is worth more than a long feature list. If a feature cannot be shown in about a minute, move it to future scope.
5. **Never trust the client.** Time, location accuracy, roles, and limits are all checked on the server.
6. **Fail softly.** Any external service can fail. The app must still work.

## 2. Scope Rules

- Must-build, nice-to-have, and future-scope lists in PRD.md are the only source of truth.
- Nice-to-have items start only when every must-build item works.
- Future-scope items are never built. They appear only on a pitch slide.
- Adding or removing a feature requires both team members to agree and PRD.md to be updated the same day.

## 3. Account and Access Rules

- Citizens self-register with name, phone, and password. No OTP, no verification.
- Officials, department heads, and admins can never self-register. No public route exists for it.
- Only an admin can create officials. They receive a temporary password and must change it at first login.
- The first admin is seeded in the database.
- Phone numbers are stored in one format (+91 and 10 digits) and must be unique.
- Phone numbers and full names must never appear on public screens or public API responses.
- Every endpoint that changes data requires a valid token and the right role.

## 4. Reporting Rules

- Photos come only from the in-app camera. No gallery upload, anywhere.
- Location permission is mandatory. No location, no report.
- Reject location readings with accuracy worse than about 100 m.
- The server timestamp is the official time. The device time is ignored.
- The stamp on the photo (coordinates, address, date and time) is a convenience for humans, not proof. The server's own data is the record.
- Descriptions may be in Telugu, English, or Telugu typed in English letters.

## 5. Spam and Duplicate Rules

Run checks in this order so cheap checks save AI quota:

1. Account status and daily limit (about 5 reports per user per day)
2. File hash match: reject
3. Perceptual hash near match: reject
4. Same category within about 75 m of an open report: candidate duplicate
5. AI same-issue check, only for candidates
6. AI civic-issue validity check on the main call

Further rules:
- A duplicate is linked to the original through the parent field. It is never deleted.
- The original's report count goes up on each merged duplicate.
- A matching recently resolved report nearby means "likely old photo": flag for official verification.
- Each rejection raises the user's rejected count. Past the threshold, suspend the account. Only an admin can lift it.
- One upvote per user per report.
- Limit new accounts per IP per hour.

## 6. AI Rules

- One combined AI call per report. Do not make separate calls for category, severity, and so on.
- The prompt demands strict JSON only. The parser removes code fences and validates every field.
- If the AI fails, times out, or is rate limited: save the report as category OTHER, severity 3, flagged for manual review.
- Cache AI results by file hash.
- Keep prompts in prompt files, not scattered in code.
- AI output is a suggestion. The crew and equipment estimate must be labelled "AI estimate."
- Never send phone numbers or personal data to the AI.
- AI translation of notices must be reviewed by the official before sending.
- The chatbot, if built, answers only about the app and city services, in the user's language.

## 7. Priority Rule

priority = severity x 20 + min(report count, 10) x 3 + days open x 2 + weather bonus + sensitive location bonus + emergency bonus of 50

- Weather bonus: waterlogging and drain issues during rain, electrical issues during storms.
- Sensitive location bonus: near schools and hospitals from a configurable list.
- The formula must stay explainable. Do not replace it with a black box.
- Weights live in configuration so they can be tuned.

## 8. SLA and Escalation Rules

- Default response rule: the assigned officer must respond (acknowledge) within 24 hours. Emergencies: about 2 hours.
- Suggested defaults, all editable by an admin:

| Category | Response | Resolution target |
|---|---|---|
| Electrical hazard | 2 hours | 24 hours |
| Fallen tree | 4 hours | 48 hours |
| Waterlogging | 6 hours | 48 hours |
| Water leakage | 24 hours | 72 hours |
| Streetlight | 24 hours | 72 hours |
| Garbage | 24 hours | 48 hours |
| Road damage | 24 hours | 7 days |
| Other | 24 hours | 7 days |

- Only two escalation levels exist: Officer (Level 0) to Department Head (Level 1).
- After Level 1 with no response, the report is shown as critically overdue to the admin. No further alerts are sent.
- Every escalation is logged. A pause requires a reason and is recorded.
- A reopened report restarts the response clock.

## 9. Announcement Rules

- Only officials and department heads can post notices, each tied to the author.
- Written in English, translated by AI, reviewed by the official before sending.
- Every notice has an area, a start time, and an end time. Notices expire automatically but stay in history.
- Planned and emergency notices are different types and look different.

## 10. Privacy and Safety Rules

- Public map shows first names or masked IDs only.
- Never show phone numbers publicly.
- Do not store the user's precise location except on reports they submit.
- Reject inappropriate photos. Admins can remove abusive text.
- Be honest in the pitch: phone numbers are unverified in this version, and WhatsApp OTP is future scope.

## 11. Coding Rules

**General**
- Layered backend: controller, service, repository, DTOs, entities. Controllers hold no business logic.
- No secrets, keys, or passwords in code or in the repository. Use environment variables.
- Every external call has a timeout and a fallback.
- Use one global exception handler and one JSON error format.
- Validate all input on the server.
- Comment non-obvious logic, especially the pipeline, priority, and escalation.
- Keep functions small and names clear.

**Backend**
- Passwords hashed with BCrypt. Never log passwords or tokens.
- Database values (categories, statuses, department codes) are English codes. Translation happens only in display.
- Use constants or configuration for thresholds: 75 m, 100 m accuracy, daily limit, SLA times, priority weights.

**Frontend**
- All screen text comes from the translation files. No hard-coded strings in components.
- Mobile-first layouts. Test every screen on a real phone.
- Follow the tokens and components in DESIGN.md.
- Show loading, empty, and error states on every screen that fetches data.

## 12. API Rules

- Plain REST with JSON. Plural nouns for resources.
- Consistent error shape with a code and a message.
- Public endpoints are limited to login, register, public map data, emergency contacts, and active notices.
- Role checks happen on the server, never only in the interface.

## 13. Git and Teamwork Rules

- One main branch that always runs. Work on short feature branches and merge often.
- Small commits with clear messages.
- Agree on the API contract before building both sides of a feature.
- Never commit environment files, keys, or uploaded photos.
- Update PRD.md, ARCHITECTURE.md, RULES.md, or DESIGN.md in the same commit that changes the decision.
- Settle disagreements by testing the demo impact: whichever choice makes the demo more reliable wins.

## 14. Free-Tier Rules

- Check each service's current limits before relying on it. They change.
- Do not sign up for anything that needs a card unless billing alerts are set.
- Respect Nominatim's rate limit and identify the app properly.
- Test the full flow the day before the event, because daily quotas can reset at odd times.
- Keep a recorded backup video and a seeded database.

## 15. Testing and Demo Rules

- Test on a real phone over HTTPS, not just on the laptop.
- Seed about 30 realistic Warangal reports, including duplicates, one emergency, and one overdue report.
- Verify every emergency number before the demo.
- Rehearse the pitch at least three times with a timer.
- Demo order: register, live capture, AI result, duplicate caught, official update, citizen notified, overdue escalation, notice.

## 16. Definition of Done

A feature is done only when:
1. It works end to end on a real phone.
2. It handles failure of any service it depends on.
3. It works in both Telugu and English where required.
4. It follows DESIGN.md.
5. It is covered by the demo data.
6. The docs are updated.
