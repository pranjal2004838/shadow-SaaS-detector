++
Final App Action Plan — Savings Simulator + One-Click Playbook
=============================================================

Overview
--------
This document is an executable plan for implementing two polished, demo-grade features for the Shadow SaaS Detector:

- Savings Simulator: interactively model consolidation choices and immediately show monthly/annual savings.
- One-Click Remediation Playbook (demo mode): for each high-risk app show evidence and a generated revoke email + a single "Simulate Revoke" button that marks the app as revoked in demo.

Goal: produce a 2-minute story-driven demo (Emma) that shows problem → evidence → remediation → concrete ROI.

Files to Add (hackathon MVP)
-----------------------------
1. `backend/services/simulator.js` — savings simulator logic (pick best app per category, compute savings).
2. `backend/services/playbook.js` — playbook generator (text templates, revoke email generator, demo simulate function).
3. `frontend/src/components/Simulator.js` — UI for interactive savings slider and consolidation chooser.
4. `frontend/src/components/PlaybookModal.js` — evidence viewer and one-click simulate revoke button.
5. `frontend/src/pages/DemoStory.js` — scripted Emma narrative walkthrough used in demo.
6. small additions to `backend/server.js` to expose API endpoints: `/api/simulate` and `/api/playbook/simulate`.

Architecture (concise)
----------------------
- Frontend (React): Upload → Dashboard → DetectedApps. From detected apps user can open Playbook modal per high-risk app and open Simulator screen.
- Backend (Node/Express): provides detection results (existing) and two new endpoints for simulation and playbook actions. Stateless for demo mode.
- Data: existing SaaS catalog JSON + in-memory analysis result for demo (no persistent change for revoke; simulate only). For demo persistence we store a small `revokes_demo.json` tracking simulated revokes.

Simple Terms (one-liner per component)
-------------------------------------
- Savings Simulator: let user pick which app to keep per category; compute sum of other apps' prices as monthly savings; show annual projection and ROI.
- Playbook: show evidence (expense row, browser snippet, OAuth permission); create a ready-to-send revoke email; allow one-click "Simulate Revoke" to mark the app as revoked in the demo dashboard and remove it from active findings (only demo state).

Exact API Endpoints (MVP)
-------------------------
1. POST `/api/simulate`
   - Input: { detectedApps: [ { id, category, typical_price, userCount } ], keepMap: { category: appId } }
   - Output: { monthlySavings, annualSavings, breakdown: [ { category, keptApp, removedApps, saved } ] }

2. POST `/api/playbook/simulate`
   - Input: { appId, evidence: {...}, tenantId, demo: true }
   - Output: { status: 'simulated', revokeId, emailDraft: { to, subject, body }, newState }

Implementation Steps (day-by-day, executable)
-------------------------------------------
Day A — Backend: simulator and playbook services (4 hours)

1. Create `backend/services/simulator.js`

```javascript
// simulator.js
function simulateSavings(detectedApps, keepMap) {
  const byCategory = {};
  detectedApps.forEach(a => {
    if (!byCategory[a.category]) byCategory[a.category]=[];
    byCategory[a.category].push(a);
  });

  const breakdown = [];
  let monthlySavings = 0;

  Object.entries(byCategory).forEach(([category, apps]) => {
    const keepId = keepMap[category] || apps.reduce((m, x) => (x.typical_price < (m.typical_price||Infinity) ? x : m), apps[0]).id;
    const kept = apps.find(x=>x.id==keepId) || apps[0];
    const removed = apps.filter(x=>x.id!==kept.id);
    const saved = removed.reduce((s, r)=> s + (r.typical_price||0), 0);
    monthlySavings += saved;
    breakdown.push({ category, keptApp: kept, removedApps: removed, saved });
  });

  return { monthlySavings, annualSavings: monthlySavings*12, breakdown };
}

module.exports = { simulateSavings };
```

2. Create `backend/services/playbook.js` — templates and simulate function.

```javascript
// playbook.js
function generateRevokeEmail(app, evidence, tenant) {
  const to = tenant.itAdminEmail || 'it-admin@company.com';
  const subject = `Action Required: Revoke access for ${app.name}`;
  const body = `Hi,
We detected ${app.name} being used by ${evidence.user || 'an employee'} with access to ${app.data_permissions.join(', ')}. Evidence:\n${evidence.snippet}\n\nPlease revoke access or confirm approval.\nThanks.`;
  return { to, subject, body };
}

function simulateRevoke(appId, repoStatePath) {
  // write to demo json file to mark simulated revokes
}

module.exports = { generateRevokeEmail, simulateRevoke };
```

3. Wire endpoints in `backend/server.js`:

```javascript
app.post('/api/simulate', (req, res) => {
  const { detectedApps, keepMap } = req.body;
  const result = simulateSavings(detectedApps, keepMap);
  res.json(result);
});

app.post('/api/playbook/simulate', (req, res) => {
  const { appId, evidence, tenant } = req.body;
  const app = findAppById(appId);
  const emailDraft = generateRevokeEmail(app, evidence, tenant);
  const revokeId = simulateRevoke(appId, './data/revokes_demo.json');
  res.json({ status: 'simulated', revokeId, emailDraft });
});
```

Day B — Frontend: Simulator UI & Playbook modal (6 hours)

1. `frontend/src/components/Simulator.js`
   - Show detected categories with radio to pick kept app per category
   - Show live monthly & annual savings using `/api/simulate`
   - Add an interactive slider to scope adoption rate (e.g., 50% adoption multiplies savings)

2. `frontend/src/components/PlaybookModal.js`
   - When user clicks Playbook on a high-risk app, open modal with:
     - Evidence list (expense rows, browser snippet, OAuth permissions)
     - Generated email preview (from `/api/playbook/simulate`) with copy-to-clipboard
     - A `Simulate Revoke` button that calls `/api/playbook/simulate` and updates local UI state to show the app as 'revoked (demo)'.

3. `frontend/src/pages/DemoStory.js`
   - Scripted walkthrough: auto-stepper that executes the Emma story with timed highlights:
     - Upload → show Copper detected → open Playbook → Simulate Revoke → open Simulator → choose consolidation → show savings

Day C — Polish & Demo (4 hours)

1. Add clear microcopy: badges for `demo mode`, `simulated action — no live change`.
2. Add undo for simulated revoke in demo state.
3. Add unit tests for `simulateSavings` and `generateRevokeEmail`.
4. Prepare 2-minute demo script and record.

How to Run Locally (copyable)
-----------------------------
From repository root:

```bash
# Install backend deps
cd backend
npm install

# Install frontend deps
cd ../frontend
npm install

# Start backend
cd ../backend
node server.js

# Start frontend
cd ../frontend
npm start

# Open http://localhost:3000 and follow demo story
```

Demo Script (2-minute Emma story)
---------------------------------
0:00 — "Emma is an IT manager at GrowthLabs; she suspects shadow spend."
0:10 — Upload `expenses.csv` and `browser_history.json` (use sample files)
0:25 — Dashboard shows `Copper CRM` (unauthorized) and `Recruiting Bot` (high risk)
0:40 — Open Playbook for `Recruiting Bot`, show evidence (OAuth permissions reading contacts)
0:55 — Click `Simulate Revoke` — show immediate change (app flagged as revoked in demo)
1:10 — Open Simulator, select consolidation choices (pick HubSpot as CRM), show monthly savings $320
1:30 — Click Export PDF to generate one-pager and close with ROI statement

Failure Modes while Testing & Mitigations
---------------------------------------
1. Endpoint timeouts when simulating large payloads
   - Mitigation: keep simulate endpoints lightweight; use in-memory compute; add server-side timeout handling.
2. UI state mismatch after simulated revoke (stale data)
   - Mitigation: update client state optimistically and persist demo state to `revokes_demo.json` on server.
3. Incorrect savings due to missing typical_price fields
   - Mitigation: fallback typical_price = 0 and show `estimate` badge with explanation.
4. Email draft formatting edge cases (long evidence snippets)
   - Mitigation: truncate evidence in email and include link to full evidence in PDF export.
5. Browser CORS issues when calling new endpoints
   - Mitigation: ensure `cors()` enabled in server and local proxy during dev.
6. Demo confusion: user thinks simulated revoke is real
   - Mitigation: prominent `DEMO MODE` banner on every page and in Playbook modal; include undo button.

Enterprise Upgrade Path (what to add after hackathon)
----------------------------------------------------
1. Replace demo `simulateRevoke` with integration to Google Workspace Admin / Microsoft Graph to revoke OAuth access (with tenant consent + SSO onboarding).
2. Persist actions in tenant-scoped DB with audit trail and workflows (ticket creation, approval flows).
3. Add RBAC + SSO (SAML/SCIM) and policy engine for auto-enforcement.
4. Add rate-limiting, background job queues (RabbitMQ/Redis Queue) for large simulation runs.

What to Push (per your instruction)
---------------------------------
- `TECH_SETUP.md` (updated reference only) — already updated.
- `final app action plan.md` — this file.

Notes on repository safety and demo ethics
----------------------------------------
- All revoke actions in this plan are simulated by default unless explicit integrations and tenant consent are implemented.
- Include privacy & consent popup before any upload; for demo, include explicit checkbox: "I confirm this is sample or anonymized data."

Next Steps I will take if you say "Go":
1. Create the backend service files and wire endpoints (small, testable).  
2. Create frontend components (Simulator + Playbook modal) with mock data.  
3. Run local end-to-end test and record the demo.  

If you want me to implement step 1 now, tell me and I will create the backend files and run tests locally.

UI Decision & Frontend Stack (update)
------------------------------------
UI approach: "Polished Minimalism" — clear, credible, and one standout interactive element (the Savings Simulator). Avoid distracting animations; focus on clarity and polish. Prominent `DEMO MODE` banner and microcopy to prevent confusion.

Recommended frontend stack for the UI:
- Framework: React (function components + hooks)
- Tooling: Vite (or Create React App if preferred)
- Styling: Chakra UI (component library) + Tailwind CSS for small custom utility styles
- State/Server sync: React Query (TanStack) for API calls and optimistic updates
- HTTP: axios or fetch
- Charts: Recharts for risk bars and summaries
- PDF: jsPDF + html2canvas for quick export

This stack matches the demo goals: fast to build, accessible components, and polished visuals without heavy engineering.

Last updated: 2026-03-09
