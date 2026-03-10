# Shadow SaaS Detector — 90-Second Judge Demo Script

**Audience:** Hackathon judges (technical, ~900 competing teams)  
**Goal:** Demonstrate full product value in 90-120 seconds — clarity, wow moments, and polish.

---

## BEAT 1 — Problem hook (0–15s)

> "Your company is leaking thousands of dollars every month on software nobody approved.  
> We built Shadow SaaS Detector to find it, risk-score it with AI, and fix it — in seconds."

**Action:** Open the app. Show the clean dashboard landing page.

---

## BEAT 2 — Upload & Detect (15–40s)

> "Drop in two files: an expense report and browser history.  
> Real companies have these — HR exports them weekly."

**Action:**  
1. Click **📂 Dashboard** tab (already on it)  
2. Select `expenses.csv` + `browser_history.json` from the upload panel  
3. Click **Analyze**

> "In under 2 seconds, we've detected **9 shadow SaaS applications** across 4 departments —  
> CRM, HR, security tools — none of them were IT-approved."

**Action:** Scroll through the app cards grid — show risk badges (🔴 Critical, 🟠 High).

---

## BEAT 3 — AI Risk Scoring (40–65s)

> "Now here's where AI changes everything."

**Action:** Click the **🤖 AI Insights** tab.

> "Our Gemini-powered risk engine doesn't just flag apps — it explains WHY they're dangerous."

**Action:** Risk Assessment panel loads automatically. Point to a CRITICAL card.

> "Copper CRM: score 85 out of 100 — CRITICAL. Gemini identified unencrypted data transmission,  
> no SSO enforcement, and active GDPR exposure. Rule-based tools would just say 'high risk' —  
> ours tells you *exactly* what to fix."

**Action:** Click **🎯 Smart Consolidation** sub-tab.

> "It also tells you *which* apps to cut and how much you'll save —  
> $3,200 a month in this example. One click shows you which tools overlap."

**Action:** Click **📋 Compliance Audit** sub-tab — point to the score and issues list.

> "And a full GDPR/CCPA compliance report with a 12-month remediation plan."

---

## BEAT 4 — Remediation Playbook (65–90s)

> "Detection is easy. Remediation is hard. That's what our Playbook solves."

**Action:** Click back to **📊 Dashboard**. Click **Playbook** on the Copper CRM card.

> "For every app, we generate an evidence summary, a pre-written revocation email to the vendor,  
> and a one-click simulate-revoke with a 30-second undo window."

**Action:** Click **Simulate Revoke**. Confirm. Show the countdown.

> "This is enterprise-grade access management — demoed in 90 seconds."

**Action:** Let undo countdown finish OR click Undo to demonstrate safety net.

---

## BEAT 5 — Close (90–120s, if time allows)

> "Shadow SaaS Detector: AI-powered detection, risk scoring, compliance auditing,  
> and one-click remediation — all in a single tool.  
> Fully deployed, open source, with 17 unit tests and a full E2E test suite.  
> Thank you."

**Action:** Show the **💰 Simulator** tab briefly — adoption slider animating savings.

---

## Tips for judges

| What judges look for | How we deliver |
|---|---|
| Real problem, real data | Upload real CSVs — shows 9 real apps instantly |
| AI that adds genuine value | Gemini explains *why*, not just *what* |
| Polish / production quality | Loading spinners, error states, undo safety nets |
| Tests / engineering rigor | 17 unit tests + Playwright E2E (all passing) |
| Deployability | `render.yaml` included — one click to deploy |

---

## Numbers to memorize

- **9 apps detected** from sample data  
- **$3,200/month** in projected savings from consolidation  
- **17 unit tests + 1 E2E test** — all passing  
- **<2 seconds** to process and detect  
- **3 AI features**: Risk Assessment, Smart Consolidation, Compliance Audit  
- **5-second AI timeout** with graceful rule-based fallback — always works, even offline  
