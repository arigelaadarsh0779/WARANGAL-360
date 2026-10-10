# WARANGAL 360 (వరంగల్ 360)

> **AI-Driven Civic Issue Resolution, Emergency Alert System & Automated Public Accountability Platform for Greater Warangal**

---

## 🌟 Overview & Key Features

1. **Live Camera & Geolocation Stamping:**
   - Mandatory real-time camera capture with visual timestamp, exact GPS coordinates, and street address watermarking on-canvas to eliminate stale or fake gallery uploads.

2. **Advanced AI Vision & Image Verification:**
   - Real-time image validation rejecting pitch-black, pitch-white, featureless, or corrupted photos before submission.
   - Integrated Google Gemini AI for issue classification, severity scoring (1–5), concise English & Telugu summaries, municipal department routing, and resource/crew estimation.

3. **Multi-Stage Anti-Spam & Deduplication Pipeline:**
   - Client GPS accuracy validation ($\le 100\text{m}$).
   - Rate limiting per user (~5 reports/day).
   - SHA-256 file hashing & 64-bit perceptual `dHash` matching.
   - 75-meter spatial proximity deduplication (merges duplicate reports into parent issues with incremented citizen count).

4. **Transparent Dynamic Priority Engine:**
   $$\text{Score} = (\text{Severity} \times 20) + (\min(\text{Count}, 10) \times 3) + (\text{Days Open} \times 2) + \text{Weather Bonus} + \text{Sensitive Location Bonus} + \text{Emergency Bonus}$$
   - **Weather Bonus (+15):** Real-time Open-Meteo API rain & storm condition integration.
   - **Sensitive Location Bonus (+15):** Proximity awareness to Warangal educational institutions (NIT Warangal, KMC, Kakatiya University) and key hospitals (MGM Hospital).

5. **Real-Time Emergency Alerts & Public Notices:**
   - Broadcast emergency alerts and municipal notices.
   - Automatic screen popups for active emergency notices across the citizen portal.
   - Auto-filtering and background cleanup of expired emergency notices.
   - Admin & Department Head notice management with quick-delete options post-resolution.

6. **Interactive Geo-Location Mapping:**
   - Full interactive Leaflet & OpenStreetMap visualization on Report Details.
   - High-visibility map pins marking exact grievance locations with satellite/street view toggle and navigation directions.

7. **Unified Deletion & Life-Cycle Management:**
   - **Citizen Autonomy:** Citizens can easily delete their own reported grievances if resolved independently or created by mistake.
   - **Administrative Control:** Admins and Department Officials can delete resolved, duplicate, or outdated reports and emergency notices.

8. **Department Queues & SLA Escalation Workflow:**
   - 5 Core Departments: Sanitation, Roads, Electricity, Water Supply, Disaster Management.
   - Required resolution proof photo upload by field officers.
   - Citizen verification loop: *"Is it fixed?"* (reopens report and resets SLA clock if issues persist).
   - Automated 2-Level SLA Escalation (L0 Field Officer $\rightarrow$ L1 Dept Head $\rightarrow$ L2 Super Admin Overdue Flag).

9. **Bilingual Accessibility:**
   - Instant toggle between English and Telugu (తెలుగు) across all views.

---

## 🛠️ Technology Stack

- **Backend:** Java 17+, Spring Boot 3.3.4, Spring Data JPA, Spring Security (JWT), MySQL / H2 Database
- **Frontend:** React 18, Vite, Leaflet, OpenStreetMap, Chart.js, Lucide Icons, Modern Vanilla CSS Design System
- **AI & Integrations:** Google Gemini Vision API, Open-Meteo Weather API, OpenStreetMap Nominatim Geocoding

---

## 🚀 Quick Start & Running Locally

### 1. Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`*

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 👥 Demo Pre-Seeded Accounts

| Role | Name | Phone / Login ID | Password |
|---|---|---|---|
| **Super Admin** | Municipal Commissioner | `+919999999999` | `Admin@123` |
| **Citizen** | Adarsh Arigela | `+919876543210` | `Citizen@123` |
| **Citizen** | Ramesh Babu | `+919876543211` | `Citizen@123` |
| **Citizen** | Priya Sharma | `+919876543212` | `Citizen@123` |

> ℹ️ **Department Officials & Heads (L0 & L1)**: Custom officials can be added dynamically by the Super Admin from **Super Admin Panel (`/admin`) → Officials Management**.

---

## 📄 Documentation

- [`ARCHITECTURE.md`](file:///c:/Users/adhar/OneDrive/Desktop/Projects/WARANGAL%20360/ARCHITECTURE.md) - System architecture and component interactions.
- [`PRD.md`](file:///c:/Users/adhar/OneDrive/Desktop/Projects/WARANGAL%20360/PRD.md) - Product Requirements Document & Specifications.
- [`DESIGN.md`](file:///c:/Users/adhar/OneDrive/Desktop/Projects/WARANGAL%20360/DESIGN.md) - Design guidelines & color palette tokens.
