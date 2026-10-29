# CampusFix AI

## Changelog

### Unreleased
- Reworked the CampusFix front end into a more polished, mobile-first experience with a guest gate, persistent diagnosis history, offline-safe outage caching, and cleaner icon-driven design.
- Added local persistence for diagnosis records and outage feed updates, with duplicate filtering for live and replayed alerts.
- Improved service worker caching and manifest assets for offline PWA behavior.

## Live app
- Local preview: http://localhost:3000

## Clone and run
```bash
git clone https://github.com/dukeoghenefejiroduke/campusfix-ai.git
cd campusfix-ai
node server.js
```

Then open http://localhost:3000 in a browser.

## Screenshots
- Placeholder: add screenshots here after the redesigned UI is reviewed in a browser.

## Manual test checklist
- Guest gate: confirm the welcome screen appears on a fresh session and Continue as guest loads the app.
- Diagnose flow: test each category tile, use a vague description, and confirm emergency urgency shows the stronger safety guidance.
- Report downloads: save a diagnosis report and confirm the history remains intact after refresh.
- History: delete individual entries and clear all history with confirmation required.
- Offline behavior: load the app offline and verify cached shell assets still render.
- Outage dedupe: open the outage feed on two devices and confirm duplicate items are filtered.

## Notes
- The app uses plain Node.js modules and no external dependencies.
- `node test.js` is the validation command for the backend logic and API compatibility checks.
