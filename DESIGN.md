# DESIGN: WARANGAL 360

Version 1.0 | Visual and interaction design. Style: clean government look, blue and white, trustworthy. Mobile-first, bilingual (Telugu and English).

---

## 1. Design Principles

1. **Trustworthy.** Calm blue and white, plenty of space, nothing flashy. It should feel like a real civic service.
2. **Fast.** A citizen should reach the camera in one tap and finish a report in under a minute.
3. **Clear status.** At any moment a user knows what happened to their report and what happens next.
4. **Bilingual by design.** Telugu text is often longer than English. Layouts must not break when the language changes.
5. **Phone first.** Design for a narrow screen, then expand to laptop for officials and admins.
6. **Honest feedback.** Every action shows loading, success, or a clear error.

## 2. Color Palette

| Role | Color | Hex | Use |
|---|---|---|---|
| Primary | Civic blue | #1E56B8 | Main buttons, links, active tabs |
| Primary dark | Navy | #0B2A5B | Header, headings, footer |
| Primary light | Sky | #E6EEFA | Highlights, selected rows, banners background |
| Background | White | #FFFFFF | Page background |
| Surface | Soft grey | #F5F7FA | Cards area, page sections |
| Border | Light grey | #D9DFE8 | Dividers, input borders |
| Text main | Charcoal | #1A2233 | Body text |
| Text muted | Slate | #5B6678 | Hints, timestamps |

### Status colors
| Status | Color | Hex |
|---|---|---|
| Submitted | Grey | #6B7280 |
| Acknowledged | Blue | #1E56B8 |
| In progress | Amber | #D98A00 |
| Resolved | Green | #1F8A4C |
| Rejected | Red | #C0392B |

### Priority colors
| Priority | Color | Hex |
|---|---|---|
| Low | Green | #1F8A4C |
| Medium | Amber | #D98A00 |
| High | Orange | #E0601A |
| Emergency / critical | Red | #C0392B |

### SLA colors
- On time: green text
- Due soon (last 25 percent of time): amber
- Overdue: red background tint with a countdown
- Critically overdue: solid red tag, top of admin list

Never rely on color alone. Every color state also has a text label or icon.

## 3. Typography

- **English:** Noto Sans (free, Google Fonts)
- **Telugu:** Noto Sans Telugu (free, Google Fonts), with a system fallback
- Body text 16 px minimum on phones. Telugu slightly larger line height (about 1.6) so characters do not collide.

| Style | Size | Weight |
|---|---|---|
| Page title | 24 px | Bold |
| Section heading | 20 px | Semi-bold |
| Card title | 17 px | Semi-bold |
| Body | 16 px | Regular |
| Caption / timestamp | 13 px | Regular, muted |

## 4. Spacing, Shape, and Layout

- Spacing scale: 4, 8, 12, 16, 24, 32 px.
- Cards: white, 12 px radius, light border, soft shadow.
- Buttons: 8 px radius, minimum 48 px tall for tap comfort.
- Inputs: 48 px tall, clear label above, helper text below.
- Page width: full width on phone, centered with a maximum width of about 1100 px for dashboards.
- Official and admin screens use a left sidebar on laptop and a bottom or top menu on phone.

## 5. Components

| Component | Description |
|---|---|
| Top bar | Navy background, app name, language toggle (EN / తెలుగు), notification bell with count |
| Bottom navigation (citizen) | Home, Map, Report (centered camera button), Notices, Profile |
| Primary button | Solid blue, white text |
| Secondary button | White with blue border |
| Danger button | Red, used for reject and suspend, always with a confirmation |
| Status badge | Small rounded tag with status color and text |
| Priority tag | Colored tag with level text |
| Report card | Photo thumbnail, category icon, one-line summary, address, status badge, time, report count |
| Notice banner | Light blue strip with an icon, title, time window, and "details" link. Emergency notices use a red strip |
| Countdown chip | Remaining time to the SLA deadline, color by SLA state |
| Empty state | Simple icon, one line of text, one action |
| Toast | Short success or error message at the top |
| Confirmation dialog | Required for reject, suspend, resolve, and sending a notice |

## 6. Key Screens: Citizen

### 6.1 Login and Register
- Logo, language toggle at the top.
- Register: name, phone (with +91 shown), password. One button.
- A small note under the form: "Your phone number is used as your ID."
- Officials and admins use the same login screen. There is no link to register for them.

### 6.2 Home
- Active notice banner at the top if one applies to the user's area.
- Large "Report a problem" button.
- "My recent reports" list with status badges.
- Quick links: Map, Emergency contacts.
- Weather chip in the header if the weather widget is built.

### 6.3 Report Camera (the hero screen)
- Full-screen camera view with a clear capture button.
- A live info strip over the preview: latitude, longitude, accuracy, address, date and time.
- If location is not ready: capture button disabled with the message "Getting your location."
- If permission is denied: a full explanation and a button to retry. Reporting is blocked.
- If an active notice covers this location: a dialog "A planned power cut is in your area from 4 PM to 5 PM. Do you still want to report?"
- After capture: preview of the stamped photo, a description box with a mic icon if voice input is built, and Submit and Retake buttons.
- Submitting shows a progress screen with steps: "Checking photo," "Analyzing," "Routing."

### 6.4 Result Screen
- Success: "Your problem is noted. We will fix it as fast as we can." Shows category, department, and report ID.
- Duplicate: "This issue is already reported and being tracked. You are counted as support."
- Rejected: the reason in plain language and a "Try again" button.

### 6.5 My Reports and Report Detail
- List sorted by newest, filter by status.
- Detail: photo, summary, address, a vertical timeline of status updates with comments and the after photo, SLA countdown.
- When resolved: "Is it really fixed?" with Yes and No buttons.
- Upvote button on public reports.

### 6.6 Public Map
- Leaflet map with colored markers by priority.
- Filter chips for category and status along the top.
- Tapping a marker opens a small card with the photo, summary, status, and upvote.
- Active notice areas are drawn as shaded circles or zones.

### 6.7 Notices and Notifications
- Notices: list with Planned and Emergency tabs, history below.
- Notifications: simple list with unread dots.

### 6.8 Emergency Contacts
- Large rows with the service name in both languages and a tap-to-call button.

## 7. Key Screens: Official and Department Head

### 7.1 Official Dashboard
- Summary tiles: new, in progress, overdue, resolved today.
- Report queue sorted by priority. Each row shows priority tag, summary, address, countdown chip, report count, and status.
- Overdue rows have a light red tint.
- Filters: status, category, overdue only.

### 7.2 Report Handling Screen
- Photo, AI summary, AI crew and equipment suggestion labelled "AI estimate," map pin, duplicates count.
- Status buttons: Acknowledge, Start work, Mark resolved, Reject (with reason).
- Mark resolved opens the live camera for the after photo.
- Comment box, visible to the citizen.

### 7.3 Post a Notice
- Form: title, message in English, affected area (pick ward or drop a pin and radius), start and end time, reason, type.
- "Translate to Telugu" button shows the AI translation in an editable box.
- Preview shows the banner as citizens will see it, then a confirmation dialog.

### 7.4 Department Head extras
- A tab "Escalated to me" listing overdue reports from officers, in red.

## 8. Key Screens: Admin

- **Overview:** tiles for total, open, resolved, overdue, critically overdue, duplicates merged.
- **Charts (Chart.js):** reports by category, by department, by status, and a response time trend. Use the primary blue palette with status colors.
- **Critically overdue list** at the top, in red.
- **Manage departments and officials:** table with create, deactivate, and reset password actions.
- **Users:** search by phone, view rejected count, suspend and restore.
- **SLA settings:** editable table of response and resolution times by category.
- **Emergency contacts:** editable list.
- **Audit log:** read-only table.

## 9. Language and Content Design

- A toggle in the top bar switches EN and తెలుగు instantly and saves to the profile.
- All text comes from translation files, never typed inside components.
- Keep sentences short so Telugu does not overflow buttons. Allow buttons to wrap to two lines.
- Dates and times use a simple, readable format.
- Tone: polite, direct, reassuring. Example: "Your problem is noted. We will fix it as fast as we can."
- Officials see English labels on dashboards. Citizen content that arrives in Telugu is shown to officials as the English AI summary, with the original text available.

## 10. Icons and Imagery

- Free icon set (for example Lucide) with one icon per category: garbage, road, streetlight, water drop, flood, electric bolt, tree, other.
- Use real photos from reports. Do not use stock photos in the product.
- Logo: simple text mark with a small map pin. Navy and blue.

## 11. States and Feedback

| State | Behavior |
|---|---|
| Loading | Skeleton cards, not blank screens |
| Empty | Icon, one line, one action |
| Error | Plain message and a retry button, never a technical code |
| Offline / slow | Banner "Slow connection. Your report will send when ready" (message only, offline mode is future scope) |
| AI fallback | Report still saves. Citizen sees normal success. Official sees a "needs manual review" tag |
| Success | Toast plus clear next step |

## 12. Accessibility

- Contrast of at least 4.5 to 1 for text.
- Tap targets of at least 48 px.
- Labels on every input, not placeholders alone.
- Status and priority always have text, not color only.
- Camera and location errors explain what to do next.
- Support text zoom without breaking layouts.

## 13. Responsive Behavior

| Screen | Layout |
|---|---|
| Phone (citizen) | Single column, bottom navigation, full-width cards |
| Tablet | Two-column report lists |
| Laptop (officials, admin) | Sidebar navigation, table views, charts side by side |

## 14. Demo Polish Checklist

- Use the same seeded Warangal data in every screen so the map and charts look alive.
- The stamped photo should be easy to read on a projector (large text, dark strip).
- Make one overdue report turn red live during the demo.
- Check Telugu rendering on a real phone.
- Keep the first screen after login clean, with one obvious action.
