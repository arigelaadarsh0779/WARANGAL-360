# WARANGAL 360 - Frontend App (React + Vite)

Frontend web application for **WARANGAL 360 (వరంగల్ 360)** civic issue reporting, emergency notification system, and public accountability dashboard.

## 🚀 Key Features

- **Live Camera Capture & Canvas Watermarking:** Captures photo directly from browser camera with embedded GPS coordinates, timestamp, and location tag.
- **Real-Time Image Validation:** Pre-verifies photo brightness/histogram before submission to block dark/invalid uploads.
- **Interactive Geo Mapping:** OpenStreetMap integration with Leaflet for reporting locations, interactive pins, and direction links.
- **Emergency Notifications & Alerts:** Real-time popups and banner announcements for emergency municipal notices.
- **Citizen Grievance Management:** View live status, SLA timers, and delete citizen's own reports.
- **Super Admin & Dept Official Consoles:** Queue management, resolution proof submission, official onboarding, notice creation & deletion.
- **Bilingual UI:** Instant toggle between English and Telugu (తెలుగు).

## 🧰 Tech Stack

- **Framework:** React 18 with Vite
- **Styling:** Modern Vanilla CSS (Design Tokens, Dark/Glassmorphism Theme)
- **Icons & Visuals:** Lucide React
- **Mapping:** Leaflet & React-Leaflet
- **Charts:** Chart.js & React-Chartjs-2

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
Runs at `http://localhost:5173`.
