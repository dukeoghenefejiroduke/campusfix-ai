# CampusFix AI

> **OPEN//BUILD 2026 Hackathon Project**  
> Lightweight, mobile-friendly equipment troubleshooting web assistant for university students and campus facilities.

---

## Project Purpose & Problem Statement
University dorms, labs, and campus buildings rely heavily on everyday equipment—such as water pumps, electrical outlets, plumbing systems, and HVAC cooling units. When equipment malfunctions, students often lack technical guidance on safe preliminary checks and struggle to provide clear reports to maintenance technicians. 

**CampusFix AI** bridges this gap by providing an instant, mobile-optimized troubleshooting assistant that guides users through safe diagnostic steps, assesses urgency, generates copy-pasteable maintenance reports, and strictly enforces safety protocols against electrical and water hazards.

---

## Features
- **Mobile-Optimized Interface:** Designed for narrow Android phone screens and fast loading on mobile browsers.
- **Categorized Troubleshooting:** Covers electrical equipment, water pumps, plumbing, cooling/HVAC, and other campus hardware.
- **Urgency Assessment & Safety Guardrails:** Immediately flags critical electrical dangers (sparks, smoke, burning smells) and recommends safe isolation and emergency technician contact.
- **Copyable Maintenance Report:** Instantly compiles a structured summary report that students can copy and send to facilities staff.
- **Zero-Dependency Architecture:** Built entirely with Node.js built-in modules (`http`, `fs`, `path`)—no external npm dependencies, databases, Docker, or build steps required.

---

## Requirements
- **Node.js:** v25.8.2 (or any modern Node.js v18+ runtime).
- **Environment:** Termux (Android), Linux, macOS, or Windows.
- **Storage:** Minimal footprint (< 1 MB).

---

## Instructions to Run

1. Clone or open the project directory:
   ```bash
   cd ~/campusfix-ai
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## Testing Instructions

### 1. Health Check API
Verify the server is running correctly:
```bash
curl -i http://localhost:3000/api/health
```

### 2. Diagnosis API Test
Test the diagnostic endpoint via `curl`:
```bash
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"category": "electrical", "description": "Outlet is sparking and smells like burning plastic"}'
```

### 3. Frontend Testing
Open `http://localhost:3000` in your browser (or mobile device), select an equipment category, enter a problem description, and click **Analyze Problem & Safety Guide**. Test the "Copy Report" button.

---

## Current Limitations & Demo Mode Note
- **Demo Troubleshooting Mode:** The current implementation uses a robust rules-based diagnostic engine designed to demonstrate full application workflow, UI/UX polish, and safety guardrails.
- **Open-Weight Model Integration:** **The current demo mode is NOT yet connected to an external open-weight model API.** The backend architecture is modularly prepared (`modelInfo` metadata and structured JSON API) so an eligible open-weight model provider can be connected in future updates without rewriting frontend components.

---

## Open-Weight Model Documentation (To Be Completed)
*This section will be updated once an open-weight model is integrated for the hackathon submission:*
- **Selected Model:** *(Pending verification)*
- **Provider / Host:** *(Pending verification)*
- **Licence:** *(Pending verification)*
- **Integration Details:** *(Pending API key and endpoint configuration)*

---

## Acknowledgements & AI-Assisted Development
Developed for the OPEN//BUILD 2026 hackathon. AI-assisted coding tools were utilized to accelerate development while ensuring strict adherence to offline/low-storage constraints and robust safety standards.
