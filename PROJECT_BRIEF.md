# Shadow SaaS Detector - Complete Project Guide

---

## 🎯 REAL-LIFE EXAMPLE (START HERE)

### Scenario: A 20-Person Marketing Startup

**The Problem:**
```
Emma is the IT Manager at "GrowthLabs" (20 employees).
She has a budget of $500/month for tools.
She bought Slack ($100), HubSpot ($200), Asana ($100).

BUT...
- John (Sales) secretly signed up for Copper CRM (unauthorized, $50/month)
- Sarah (Designer) uses Figma Pro (not on approved list, $120/month/team)
- Marketing team uses 3 different AI tools (ChatGPT, Jasper, Copy.ai) - $50 each
- Finance dept has an old Expensify license someone forgot about - $25/month
- HR uses a random recruiting bot app they found online (SECURITY RISK)

Total SHADOW spend: $500+/month that Emma knows NOTHING about!

Even worse:
- John's Copper CRM has company data and customer emails (SECURITY BREACH)
- The recruiting bot app has access to employee personal info (COMPLIANCE RISK)
- They're paying for overlapping solutions (Asana + Monday.com) 
```

**Emma's Pain Points:**
1. Can't control what tools employees use (Security nightmare)
2. Paying for duplicate tools unknowingly (Wastes money)
3. No visibility into data exposure (Legal liability)
4. Can't enforce company policies (Compliance issue)
5. Spends hours manually tracking all this (Tedious)

---

## 💡 THE SOLUTION: Shadow SaaS Detector

**What It Does (Non-Technical Explanation):**

A tool that acts like a **security auditor for your company's software spending**.

You upload:
1. Employee emails / list
2. Company expense reports
3. Browser history (anonymized)
4. OAuth app permissions they've granted

The tool analyzes and tells you:
- ✅ "John is using Copper CRM (unauthorized SaaS) with company data + customer emails stored there"
- ✅ "Sarah has Figma Pro (duplicate of team license, costing $120 extra)"
- ✅ "Marketing team has 3 AI tools doing the same job"
- ✅ "This recruiting app has access to 50 employee phone numbers (HIGH RISK)"
- ✅ "Here's how to save $500/month by consolidating"

**Emma gets:**
- Dashboard showing all shadow SaaS with risk scores
- Recommended actions (block, consolidate, approve)
- Monthly savings calculation
- Risk report for compliance/legal

---

## 📊 PROJECT SCOPE

### What We'll Build (MVP)

1. **Data Ingestion Module** (User uploads data)
   - CSV upload interface (expense reports)
   - Email list upload (company roster)
   - Browser history JSON import (from browser export)
   - OAuth app list upload (from Google/Microsoft account)

2. **Detection & Scoring Engine** (Backend logic)
   - Identify known SaaS apps from uploads (against database of 500+ SaaS tools)
   - Risk scoring (1-10): based on data access level, security reputation, compliance risk
   - Cost calculation: estimate from known pricing or flagged expenses
   - Duplicate detection: find overlapping tools

3. **Dashboard** (Visual results)
   - List of all detected shadow SaaS with:
     - App name + icon
     - Risk score (color-coded: green/yellow/red)
     - Data access level (none / email / files / personal info)
     - Estimated monthly cost
     - How many people using it
   
4. **Recommendations Engine** (Actionable insight)
   - "Consolidate: You have Asana + Monday + Notion. Pick 1."
   - "Block: This app has HIGH RISK (stores PII, unknown company)"
   - "Approve: This is already on approved list"
   - "Savings opportunity: $500-800/month by consolidating duplicates"

5. **Export Report** (For IT manager)
   - PDF with findings, recommendations, action plan
   - Risk summary by department
   - Month-on-month trend (if data from multiple months)

---

## 🔧 HOW WE'LL BUILD IT (Tech Stack & Architecture)

### Tech Stack (Easy to Learn)

```
Frontend: React.js (UI for uploading data + viewing dashboard)
Backend: Node.js + Express (API to process data)
Database: PostgreSQL (store SaaS app database + findings)
Data: CSV parsing + JSON processing

No AI needed. Just pattern matching + database lookups.
```

### Architecture Overview

```
Step 1: User Uploads Data
   ↓
Step 2: Backend Parses CSV/JSON/Browser History
   ↓
Step 3: Match Against SaaS Database (500+ known tools)
   ↓
Step 4: Score Risk (data access + company reputation)
   ↓
Step 5: Detect Duplicates (same function, different tools)
   ↓
Step 6: Calculate Savings Opportunity
   ↓
Step 7: Generate Dashboard + Report
```

---

## 📋 EXACT DATA SOURCES & HOW TO USE THEM

### 1. Expense Reports (CSV)
**What it looks like:**
```
Date,Employee,Amount,Description,Category
2026-01-15,John Smith,50,Copper CRM,Software
2026-01-15,Sarah Jones,120,Figma Pro,Design
2026-01-20,Team,150,ChatGPT API,AI
2026-01-25,Team,25,Expensify,Expense
```

**What we extract:**
- App name (Copper, Figma, ChatGPT, Expensify)
- Monthly cost estimate (50 = $50/month, etc.)
- Employee using it

---

### 2. Browser History Export
**What it looks like:**
```json
{
  "browser_history": [
    {
      "url": "https://app.copper.com/login",
      "title": "Copper CRM - Login",
      "timestamp": "2026-01-15T10:30:00Z"
    },
    {
      "url": "https://figma.com/files",
      "title": "Figma - Your Projects",
      "timestamp": "2026-01-16T14:22:00Z"
    }
  ]
}
```

**What we extract:**
- Domain (copper.com, figma.com)
- Map to known SaaS names
- Frequency of use (more visits = more evidence)

---

### 3. OAuth Apps Connected
**What it looks like:**
```json
{
  "google_oauth_apps": [
    {
      "app_name": "Recruiting Bot v2",
      "permissions": ["read_email", "read_contacts", "read_calendar"],
      "connected_date": "2025-12-01",
      "last_accessed": "2026-01-20"
    },
    {
      "app_name": "Zapier",
      "permissions": ["read_email", "create_events"],
      "connected_date": "2025-06-15",
      "last_accessed": "2026-01-22"
    }
  ]
}
```

**What we extract:**
- App name (Recruiting Bot, Zapier)
- Dangerous permissions (read_contacts = data access RISK!)
- How long they've had access (remove old unused apps)

---

### 4. Company Roster (CSV)
```
Email,Department,Role
john@company.com,Sales,Sales Rep
sarah@company.com,Design,Designer
emma@company.com,IT,IT Manager
```

**What we use:**
- To map which department is using which tools
- To anonymize data (only show Dept, not individual names)

---

## 🎯 FINAL PRODUCT WALKTHROUGH

### User Journey:

**Step 1: Login & Upload**
```
User lands on dashboard
"Upload your company data to detect shadow SaaS"

Files to upload:
□ Expense Report (CSV)
□ Company Roster (CSV)
□ Browser History Export (JSON)
□ Google OAuth Apps (JSON) or Microsoft OAuth Apps (JSON)

[Upload Button]
```

**Step 2: Processing**
```
"Analyzing your data... 
- Parsing expense reports
- Mapping apps to database
- Calculating risk scores
- Detecting duplicates"

[Progress bar]
```

**Step 3: Dashboard Results**
```
═══════════════════════════════════════════════════════════
         SHADOW SAAS DETECTION REPORT
═══════════════════════════════════════════════════════════

⚠️ SUMMARY
- Apps Detected: 8
- High Risk Apps: 2
- Estimated Monthly Shadow Spend: $485
- Potential Savings: $320/month
- Duplicate Tools: 3 groups

───────────────────────────────────────────────────────────
🔴 HIGH RISK (Fix Immediately)
───────────────────────────────────────────────────────────

1. RECRUITING BOT v2
   Risk Score: 9/10
   Data Access: Email + Phone + Calendar (MAJOR RISK!)
   Connected: Dec 1, 2025
   How detected: OAuth permissions
   Action: REVOKE immediately
   
2. UNKNOWN AI TOOL
   Risk Score: 8/10
   Data Access: Email + Custom emails
   Detected from: Browser history
   Cost: ~$50/month (estimated)
   Action: BLOCK or REVIEW

───────────────────────────────────────────────────────────
🟡 MEDIUM RISK (Review & Consolidate)
───────────────────────────────────────────────────────────

3. Copper CRM (Unauthorized)
   Risk Score: 6/10
   Who: John (Sales) using with company data
   Cost: $50/month
   Issue: Not on approved list, has customer data
   Recommendation: APPROVE or REPLACE with HubSpot
   
4. Figma Pro vs Team Plan
   Risk Score: 4/10
   Who: Sarah (Design team)
   Cost: $120/month (but team plan available at $60)
   Issue: Duplicate license
   Recommendation: CONSOLIDATE (save $60/month)

───────────────────────────────────────────────────────────
🟡 DUPLICATES DETECTED (Overlapping Tools)
───────────────────────────────────────────────────────────

GROUP 1: Project Management
   • Asana - $100/month (Approved, 8 users)
   • Monday.com - $80/month (Shadow, 3 users)
   • Notion - $20/month (Shadow, 2 users)
   Action: Pick 1, archive others → SAVE $100/month

GROUP 2: AI Writing Tools
   • ChatGPT Pro - $20/month (1 user)
   • Jasper - $50/month (1 user)  
   • Copy.ai - $50/month (1 user)
   Action: Consolidate to 1 tool → SAVE $100/month

GROUP 3: CRM
   • HubSpot - $200/month (Approved)
   • Copper - $50/month (Shadow, John's tool)
   Action: Merge Copper into HubSpot → SAVE $50/month

───────────────────────────────────────────────────────────
✅ APPROVED (Keep These)
───────────────────────────────────────────────────────────

• Slack - $100/month
• HubSpot - $200/month
• Asana - $100/month

───────────────────────────────────────────────────────────
💰 RECOMMENDATIONS & SAVINGS
───────────────────────────────────────────────────────────

Monthly Shadow Spend: $485
Consolidation Savings: $320/month
Annual Savings: $3,840

Recommended Actions (Priority Order):
1. URGENT: Revoke Recruiting Bot access (security)
2. HIGH: Consolidate project tools (save $100/month)
3. HIGH: Consolidate CRM (save $50/month)
4. MEDIUM: Upgrade Figma to team plan (save $60/month)
5. LOW: Review new AI tools policy

───────────────────────────────────────────────────────────
📊 DEPARTMENT BREAKDOWN
───────────────────────────────────────────────────────────

Sales Dept: $50/month shadow spend (Copper)
Design Dept: $120/month shadow spend (Figma duplicate)
Marketing Dept: $150/month shadow spend (3 AI tools)
HR Dept: $30/month + HIGH SECURITY RISK (Recruiting Bot)

───────────────────────────────────────────────────────────
📥 EXPORT OPTIONS
───────────────────────────────────────────────────────────

[Download PDF Report] [Download CSV (for tracking)]
[Email to Team] [Compare Month-to-Month]

═══════════════════════════════════════════════════════════
```

---

## 📝 PREREQUISITES & TECH REQUIREMENTS

### For You (Developer):
1. Basic JavaScript knowledge (1-2 weeks prior hackathons/courses)
2. Familiarity with React OR Vue (UI framework)
3. Basic backend (Node.js or Python Flask)
4. CSV/JSON parsing (standard library, easy)
5. A way to create a SaaS database (we'll use a CSV or free tier database)

### You Don't Need:
- ❌ AI/ML expertise
- ❌ Complex algorithms
- ❌ Blockchain or cryptocurrency
- ❌ DevOps or Docker (yet)

### Tools/Services (Free):
- GitHub (code repo)
- Vercel or Heroku (free hosting for 8 days)
- PostgreSQL (free tier)
- React or Vue.js (open source)

---

## 🗂️ SAMPLE SaaS DATABASE

We'll create a CSV file with known SaaS apps:

```csv
AppName,Category,TypicalCost,DataRiskLevel,CommonFeatures
Copper,CRM,50,Medium,"email, customer records"
Figma,Design,120,Low,"design files"
HubSpot,CRM,200,Medium,"customer data, emails"
ChatGPT,AI,20,Medium,"stores conversations"
Jasper,AI,50,Medium,"stores generated content"
Slack,Communication,100,Medium,"messages, files"
Asana,ProjectMgmt,100,Low,"tasks, projects"
Monday,ProjectMgmt,80,Low,"tasks"
Expensify,Expense,25,Low,"receipts, expenses"
Zapier,Integration,20,Low,"connects apps"
Recruiting Bot,HR,30,High,"emails, phone, calendar"
```

When we detect an app name in browser history or expenses, we look it up + get its risk level.

---

## 🏗️ 8-DAY BUILD TIMELINE

```
DAY 1 (8 hours)
├─ Set up project structure (React + Node)
├─ Create database schema
├─ Build SaaS app database (CSV/JSON)
└─ Create basic UI layout

DAY 2 (8 hours)
├─ Build file upload module (CSV, JSON parsing)
├─ Test with sample data
└─ Save uploads to backend

DAY 3 (8 hours)
├─ Build detection logic (match apps from files)
├─ Test against SaaS database
└─ Create risk scoring function

DAY 4 (8 hours)
├─ Build duplicate detection logic
├─ Calculate cost estimates
└─ Create recommendations rules

DAY 5 (8 hours)
├─ Build dashboard component
├─ Display detected apps + risk scores
├─ Show recommendations
└─ Polish UI

DAY 6 (8 hours)
├─ Build export (PDF report)
├─ Add filtering/sorting
├─ Mobile responsiveness
└─ Bug fixes

DAY 7 (8 hours)
├─ Record demo video (2-3 min)
├─ Test end-to-end
├─ Edge case testing
└─ Performance optimization

DAY 8 (8 hours + submission)
├─ Write README
├─ Final UI polish
├─ Record final demo
├─ Deploy to Vercel/Heroku
└─ Submit to hackathon
```

---

## 🎬 FINAL DELIVERABLE CHECKLIST

**Code & Deployment:**
- ✅ GitHub repo with clean, documented code
- ✅ Deployed live (publicly accessible URL)
- ✅ Works end-to-end (upload → dashboard → export)

**Documentation:**
- ✅ README: Problem, solution, how to use
- ✅ Setup instructions: "How to run locally"
- ✅ API documentation: Input/output examples

**Demo:**
- ✅ 2-3 min video showing:
  - Upload sample data
  - See dashboard results pop up
  - View a specific finding
  - Show risk assessment & recommendations
  - Download report
  
**Submission Form:**
- ✅ Project Title: "Shadow SaaS Detector"
- ✅ Problem Statement: (use Emma's story)
- ✅ Solution Overview: (how tool solves it)
- ✅ Technical Details: React + Node + PostgreSQL
- ✅ GitHub Link: (your repo)
- ✅ Demo Video Link: (YouTube link)
- ✅ Tools Used: React, Node.js, PostgreSQL, CSV parsing, etc.

---

## 🚀 WHY THIS WINS

1. **Real Problem** (Emma's problem is real for 100,000+ IT managers)
2. **Measurable Impact** (saves $300+ for each company)
3. **Working Demo** (people see results immediately on upload)
4. **Marketable** ($50-100/month SaaS subscription model)
5. **8-Day Achievable** (no cutting-edge tech, just pattern matching)
6. **Judges Love It** (B2B + security + cost = corporate gold)

---

## ❓ FAQ FOR YOU

**Q: I don't know React?**
A: Learn basics in a few hours. This is perfect for learning—forms + tables + simple state management.

**Q: How do I get the SaaS database of 500+ apps?**
A: Start with top 50 (Slack, HubSpot, Asana, etc.) + add more as you go. Or scrape a public SaaS list.

**Q: Can individuals participate?**
A: Yes. Teams of 1-10 people. You can be solo.

**Q: What if users don't have OAuth export?**
A: Make OAuth optional. Expense report + browser history alone is enough to win.

**Q: How do I handle data privacy?**
A: Don't store user uploads. Process, show results, let them export, then delete. Privacy-first = extra brownie points.

**Q: Is this too simple to win?**
A: No. Judges care about: solving real problem + working product + good story. Not complexity.

---

## 📞 NEXT STEPS

Once you understand this, we can:
1. Set up the project structure
2. Create sample data for testing
3. Build the upload interface (Day 1-2)
4. Build the detection engine (Day 3-4)
5. Build the dashboard (Day 5-6)

Ready? Let's start!
