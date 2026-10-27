# CampusFix AI — Campus Equipment Troubleshooting Assistant

> A lightweight, mobile-friendly prototype that offers preliminary troubleshooting guidance, safety warnings, maintenance reports, and server-mediated outage notifications.

---

## Overview & How It Works
University dorms, labs, and campus buildings rely on everyday equipment (water pumps, electrical outlets, plumbing, HVAC cooling). When equipment malfunctions, students need safe preliminary guidance and clear reporting tools.

**CampusFix AI** provides:
1. **Local Rules-Based Diagnostic Engine & Remote Model Integration**: Evaluates problems using deterministic safety rules or a configured remote OpenAI-compatible API endpoint (such as Groq using model `openai/gpt-oss-20b`).
2. **TF-IDF Text-Similarity Precedents (`tfidfEngine.js`)**: Performs vector space cosine similarity matching against a small set of illustrative example records in pure Node.js. These are illustrative examples, not verified campus maintenance records.
3. **Server-Mediated Outage Notifications**: Broadcasts outage reports to clients connected to the same running server via Server-Sent Events (SSE). This is in-memory broadcasting, not peer-to-peer networking, and reports are not persisted across restarts.
4. **Authoritative Safety Guardrails**: Deterministic safety post-processing ensures hazardous conditions (sparks, smoke, burning smells) automatically trigger Emergency urgency and mandatory safety instructions, filtering out any unsafe user actions.
5. **Zero-Dependency Architecture**: Built entirely with Node.js built-in modules (`http`, `fs`, `path`) with < 1 MB storage footprint.

---

## Features
- **Mobile-Optimized PWA:** Offline caching via Service Worker (`campusfix-v3`) and Web App Manifest.
- **Hybrid Troubleshooting:** Uses remote model API when configured, with seamless fallback to the local rules engine.
- **In-Memory IP Rate Limiting:** Applies in-memory request rate limits as a basic safeguard.
- **Copyable Maintenance Reports & Outage Broadcasts:** Instantly generates structured logs and notifies connected clients.

---

## Requirements
- **Node.js:** v25.8.2 (or any modern Node.js v18+ runtime).
- **Environment:** Termux (Android), Linux, macOS, or Windows.

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

## Running the Test Suite
```bash
node test.js
```

---

## Connecting a Compatible Model API (Optional)
To connect a remote OpenAI-compatible model API (such as Groq), set the following environment variables (or copy from `.env.example` to `.env`):
```bash
export OPEN_WEIGHT_API_URL="https://api.groq.com/openai/v1/chat/completions"
export OPEN_WEIGHT_API_KEY="your-api-key-here"
export OPEN_WEIGHT_MODEL_NAME="openai/gpt-oss-20b"
node server.js
```
*If not configured or unreachable, CampusFix AI automatically falls back to its local rules engine.*

---

## Model Use, Limitations & Safety
- Results are preliminary guidance, not confirmed diagnoses.
- Deterministic safety rules override model output during hazards, but automated checks cannot identify every hazard.
- Never touch live electrical equipment, open panels, or attempt repairs.
- The system does not replace qualified maintenance personnel or emergency services.

---

## Acknowledgements & AI-Assisted Development
Developed for the OPEN//BUILD 2026 project. Built with Node.js built-in modules and Web APIs.
