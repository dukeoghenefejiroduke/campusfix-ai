# CampusFix AI — Campus Equipment Troubleshooting Assistant

> A lightweight, mobile-friendly prototype that offers preliminary troubleshooting guidance, safety warnings, maintenance reports, persistent server-mediated outage notifications, and TF-IDF semantic maintenance matching.

---

## Overview & How It Works
University dorms, labs, and campus buildings rely on everyday equipment (water pumps, electrical outlets, plumbing, HVAC cooling). When equipment malfunctions, students need safe preliminary guidance and a clear channel to report issues.

**CampusFix AI** provides:
1. **Local Rules-Based Diagnostic Engine & Remote Model Integration**: Evaluates problems using deterministic safety rules or a configured remote OpenAI-compatible API endpoint (such as Groq using a compatible endpoint).
2. **TF-IDF Semantic Maintenance Engine (`tfidfEngine.js`)**: Performs vector space cosine similarity matching against 25+ comprehensive, realistic campus maintenance records spanning water pumps, electrical problems, plumbing, cooling, and general equipment.
3. **Integrated Acoustic-Semantic Diagnostics**: Correlates browser-side Web Audio API FFT frequency peak observations with semantic maintenance precedents to provide multi-modal supporting context.
4. **Persistent Server-Mediated Outage Notifications**: Broadcasts outage reports to connected clients via Server-Sent Events (SSE) and persists alerts in a local JSON file (`outages.json`), automatically replaying recent history.
5. **Authoritative Safety Guardrails & Vague Input Clarification**: Deterministic safety post-processing ensures hazardous conditions (sparks, smoke, burning smells) automatically trigger Emergency-level escalation while preventing unsafe instructions.
6. **Zero-Dependency Architecture**: Built entirely with Node.js built-in modules (`http`, `fs`, `path`) with automatic zero-dependency `.env` file parsing and < 1 MB storage footprint.

---

## Features
- **Mobile-Optimized PWA:** Offline caching via Service Worker (`campusfix-v3`) and Web App Manifest.
- **Persistent Outage History:** File-backed storage (`outages.json`) and SSE history replay.
- **Expanded Real Campus Maintenance Records:** 25+ detailed campus facility tickets.
- **Automatic `.env` Parsing:** Zero-dependency configuration loader.
- **Hybrid Troubleshooting & Status Tracking:** Seamlessly tracks remote model success (`remote-model-used-successfully`), fallback (`remote-model-failed-fallback-to-rules`), or local rules (`rules-engine-tfidf`).
- **In-Memory IP Rate Limiting:** Applies request rate limits as a basic safeguard.
- **Copyable Maintenance Reports & Outage Broadcasts:** Instantly generates structured logs and notifies connected clients.

---

## Requirements
- **Node.js:** v18+ (or any modern Node.js runtime).
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
*CampusFix AI automatically parses `.env` files at startup. If not configured or unreachable, it seamlessly falls back to its local rules engine.*

---

## Model Use, Limitations & Safety
- Results are preliminary guidance, not confirmed diagnoses.
- Deterministic safety rules override model output during hazards, but automated checks cannot identify every hazard.
- Never touch live electrical equipment, open panels, or attempt repairs.
- The system does not replace qualified maintenance personnel or emergency services.

---

## Acknowledgements & AI-Assisted Development
Developed for the OPEN//BUILD 2026 project. Built with Node.js built-in modules and Web APIs.
