# WARANGAL 360 (వరంగల్ 360)

> **Civic Grievance Reporting, AI Classification & Automated SLA Escalation Platform for Greater Warangal**

---

## 🌟 Overview & Key Features

1. **Live Camera & Geolocation Stamping:** Mandatory camera capture with visual timestamp, coordinates, and address watermarking on-canvas to eliminate fake or stale gallery uploads.
2. **Multi-Stage Spam & Deduplication Pipeline:**
   - Client GPS accuracy check ($\le 100\text{m}$)
   - User daily limits (~5 reports/day)
   - SHA-256 file hash & 64-bit perceptual `dHash` matching
   - 75-meter spatial proximity deduplication (merges duplicates with parent report count increment)
   - Detection of reused photos near recently resolved locations.
3. **Consolidated Vision AI Analysis:** Single LLM call (Google Gemini Free Tier / Smart Fallback) classifying civic issues, severity (1–5), English summary, department routing, and crew/equipment estimation.
4. **Transparent Priority Scoring:**
   $$\text{Score} = (\text{Severity} \times 20) + (\min(\text{Count}, 10) \times 3) + (\text{Days Open} \times 2) + \text{Weather Bonus} + \text{Sensitive Location Bonus} + \text{Emergency Bonus}$$
   - *Weather Bonus (+15):* Real-time Open-Meteo rain & storm condition detection.
   - *Sensitive Location Bonus (+15):* Proximity to Warangal schools, colleges (NIT Warangal, KMC, Kakatiya University), and hospitals (MGM Hospital).
5. **Department Queues & Official Workflow:**
   - 5 Municipal Departments: Sanitation, Roads, Electricity, Water, Disaster Management.
   - Live resolution proof photo capture by officials.
   - Citizen resolution feedback loop: *"Is it really fixed?"* (reopens report and resets SLA clock if issues persist).
6. **Background SLA Scheduler & 2-Level Escalation:**
   - Level 0: Field Officer
   - Level 1: Auto-escalation to Department Head upon missed response deadlines
   - Level 2: Flagged as *Critically Overdue* on the Super Admin console.
7. **Geofenced Department Announcements:** Area-targeted planned works & emergency hazard alerts with AI English-to-Telugu translation.
8. **Bilingual Design:** Instant toggle between English and Telugu (తెలుగు) across all citizen interfaces.

---

## 🛠️ Technology Stack

- **Backend:** Java 17+, Spring Boot 3.3.4, Spring Data JPA, Spring Security (JWT), MySQL / H2
- **Frontend:** React, Vite, Leaflet, OpenStreetMap, Chart.js, Lucide Icons, Vanilla CSS Design System
- **External Services:** Open-Meteo (Weather), OpenStreetMap Nominatim (Reverse Geocoding), Google Gemini API (Vision AI & Translation)

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

> ℹ️ **Department Officials & Heads (L0 & L1)**: All pre-seeded officers have been cleared. Super Admin can add and manage officials with custom passwords directly from the **Super Admin Panel (`/admin`) → Officials Management**.
