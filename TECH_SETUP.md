# Shadow SaaS Detector - Tech Stack Setup

## 🛠️ WHAT EACH TECHNOLOGY DOES (NON-TECHNICAL)

### Frontend (React.js)
**What:** The page users see when they open your app
**Why:** Beautiful, interactive, fast UI
**What you'll build:**
- Upload form (drag-and-drop CSV/JSON files)
- Dashboard displaying results (fancy tables, colored badges)
- Export button (download PDF)

### Backend (Node.js + Express)
**What:** The "brain" that processes uploaded files
**Why:** JavaScript on the server (same language as frontend)
**What it does:**
- Receive files from frontend
- Parse CSV/JSON
- Match apps against database
- Calculate risk scores
- Send results back to frontend

### Database (PostgreSQL)
**What:** Stores your SaaS app database + analysis results
**Why:** Fast for searches, handles complex queries
**What's stored:**
- 500+ known SaaS apps + info
- User uploads
- Analysis results

---

## 💻 INSTALLATION (Copy-Paste These Commands)

### Prerequisites (Install First)
```bash
# Install Node.js (includes npm package manager)
# Go to: https://nodejs.org/
# Download LTS version
# Install and verify:
node --version  # Should show v18+ or higher
npm --version   # Should show 8+
```

### Create Project Folder
```bash
# Create workspace
mkdir shadow-saas-detector
cd shadow-saas-detector

# Initialize as git repo (for GitHub)
git init

# Create folder structure
mkdir backend frontend database
```

### Setup Backend (Server)
```bash
cd backend

# Create package.json
npm init -y

# Install dependencies
npm install express cors multer csv-parser dotenv

# Create main file
touch server.js
```

### Setup Frontend (UI)
```bash
cd ../frontend

# Create React app
npx create-react-app .

# Install UI library (optional, makes it prettier)
npm install axios react-router-dom

# You're done with setup!
```

### Setup Database
```bash
cd ../database

# Create file for SaaS app list
touch saas_database.json
```

---

## 📊 SAMPLE DATABASE FILE

Create `frontend/src/data/saas_app_database.json`:

```json
{
  "apps": [
    {
      "id": 1,
      "name": "Slack",
      "category": "Communication",
      "description": "Team messaging app",
      "typical_price": 100,
      "risk_level": "low",
      "data_permissions": ["messages", "files"],
      "keywords": ["Slack", "slack.com", "app.slack.com"]
    },
    {
      "id": 2,
      "name": "HubSpot",
      "category": "CRM",
      "description": "Customer relationship management",
      "typical_price": 200,
      "risk_level": "medium",
      "data_permissions": ["email", "customer_records", "calls"],
      "keywords": ["HubSpot", "hubspot.com", "app.hubspot.com"]
    },
    {
      "id": 3,
      "name": "Copper",
      "category": "CRM",
      "description": "Gmail-based CRM",
      "typical_price": 50,
      "risk_level": "medium",
      "data_permissions": ["email", "customer_data"],
      "keywords": ["Copper", "copper.com", "app.copper.com"]
    },
    {
      "id": 4,
      "name": "Figma",
      "category": "Design",
      "description": "Design and prototyping tool",
      "typical_price": 120,
      "risk_level": "low",
      "data_permissions": ["design_files"],
      "keywords": ["Figma", "figma.com", "app.figma.com"]
    },
    {
      "id": 5,
      "name": "ChatGPT",
      "category": "AI",
      "description": "AI writing assistant",
      "typical_price": 20,
      "risk_level": "medium",
      "data_permissions": ["conversations"],
      "keywords": ["ChatGPT", "openai.com", "chat.openai.com"]
    },
    {
      "id": 6,
      "name": "Asana",
      "category": "Project Management",
      "description": "Task management tool",
      "typical_price": 100,
      "risk_level": "low",
      "data_permissions": ["tasks", "projects"],
      "keywords": ["Asana", "asana.com", "app.asana.com"]
    },
    {
      "id": 7,
      "name": "Monday.com",
      "category": "Project Management",
      "description": "Work management platform",
      "typical_price": 80,
      "risk_level": "low",
      "data_permissions": ["tasks", "projects"],
      "keywords": ["Monday", "monday.com", "app.monday.com"]
    },
    {
      "id": 8,
      "name": "Expensify",
      "category": "Finance",
      "description": "Expense tracking",
      "typical_price": 25,
      "risk_level": "low",
      "data_permissions": ["receipts", "expenses"],
      "keywords": ["Expensify", "expensify.com"]
    },
    {
      "id": 9,
      "name": "Zapier",
      "category": "Automation",
      "description": "Connect apps and automate workflows",
      "typical_price": 20,
      "risk_level": "low",
      "data_permissions": ["connects_to_other_apps"],
      "keywords": ["Zapier", "zapier.com"]
    },
    {
      "id": 10,
      "name": "Recruiting Bot",
      "category": "HR",
      "description": "Automated recruiting tool",
      "typical_price": 30,
      "risk_level": "high",
      "data_permissions": ["email", "phone", "calendar", "contacts"],
      "keywords": ["Recruiting Bot", "recruiter.com"]
    }
  ]
}
```

---

## 📝 FILE STRUCTURE (What Your Project Looks Like)

```
shadow-saas-detector/
├── backend/
│   ├── package.json              # Node dependencies
│   ├── server.js                 # Main server file
│   ├── routes/
│   │   └── upload.js             # Handle file uploads
│   ├── controllers/
│   │   └── detection.js          # Detection logic
│   └── data/
│       └── saas_database.json     # SaaS app list
│
├── frontend/
│   ├── package.json              # React dependencies
│   ├── src/
│   │   ├── App.js                # Main app component
│   │   ├── components/
│   │   │   ├── UploadForm.js      # File upload UI
│   │   │   ├── Dashboard.js       # Results display
│   │   │   └── Report.js          # PDF export
│   │   ├── data/
│   │   │   └── saas_database.json # SaaS app list
│   │   └── styles/
│   │       └── App.css            # Styling
│   └── public/
│       └── index.html
│
├── database/
│   └── schema.sql                # (If using real database)
│
└── README.md                      # Instructions
```

---

## 🚀 HOW TO RUN LOCALLY (Test Before Submitting)

### Terminal 1: Start Backend
```bash
cd backend
npm install
node server.js
# You should see: "Server running on http://localhost:5000"
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm install
npm start
# Browser automatically opens http://localhost:3000
```

### Test It
1. Open http://localhost:3000
2. Upload sample CSV file
3. See results on dashboard
4. Click export
5. Verify works end-to-end

---

## 📦 SAMPLE DATA FILES FOR TESTING

### Sample Expense Report (expenses.csv)
Save to `test_data/expenses.csv`:
```csv
Date,Employee,Department,Amount,Description,Category
2026-01-15,john.smith,Sales,50,Copper CRM Monthly,Software
2026-01-16,sarah.jones,Design,120,Figma Pro Annual Charge,Software
2026-01-18,marketing.team,Marketing,20,ChatGPT Pro Subscription,Software
2026-01-19,marketing.team,Marketing,50,Jasper.ai Monthly,Software
2026-01-20,marketing.team,Marketing,50,Copy.ai Month,Software
2026-01-22,finance.dept,Finance,25,Expensify License,Software
2026-01-25,hr.admin,HR,30,Recruiting Bot Tool,Software
2026-01-28,john.smith,Sales,100,Slack Team Plan,Software
```

### Sample Browser History (browser_history.json)
Save to `test_data/browser_history.json`:
```json
{
  "browser_history": [
    {
      "url": "https://app.copper.com/login",
      "title": "Copper CRM - Dashboard",
      "timestamp": "2026-01-15T10:30:00Z"
    },
    {
      "url": "https://figma.com/files",
      "title": "Figma - Your Files",
      "timestamp": "2026-01-16T14:22:00Z"
    },
    {
      "url": "https://chat.openai.com/chat",
      "title": "ChatGPT",
      "timestamp": "2026-01-18T09:15:00Z"
    },
    {
      "url": "https://www.jasper.ai/dashboard",
      "title": "Jasper - Content AI",
      "timestamp": "2026-01-19T11:45:00Z"
    },
    {
      "url": "https://copy.ai/dashboard",
      "title": "Copy.ai",
      "timestamp": "2026-01-20T10:00:00Z"
    },
    {
      "url": "https://accounts.google.com/o/oauth2/v2/auth",
      "title": "Recruiting Bot Permissions",
      "timestamp": "2026-01-25T13:30:00Z"
    },
    {
      "url": "https://slack.com",
      "title": "Slack - Work Simplified",
      "timestamp": "2026-01-28T08:00:00Z"
    }
  ]
}
```

### Sample Company Roster (roster.csv)
Save to `test_data/roster.csv`:
```csv
Email,FullName,Department,Role
john.smith@growthlab.com,John Smith,Sales,Sales Representative
sarah.jones@growthlab.com,Sarah Jones,Design,Product Designer
marketing.team@growthlab.com,Marketing Team,Marketing,Content Creators
finance.dept@growthlab.com,Finance Team,Finance,Finance Manager
hr.admin@growthlab.com,HR Admin,HR,HR Manager
emma.wilson@growthlab.com,Emma Wilson,IT,IT Manager
```

---

## 🔑 KEY CODE SNIPPETS (You'll Build These)

### 1. CSV Parser (Backend)
```javascript
// server.js - Parse CSV file
const csv = require('csv-parser');
const fs = require('fs');

app.post('/upload', (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Send to detection logic
      const analysis = analyzeExpenses(results);
      res.json(analysis);
    });
});
```

### 2. App Detection (Backend)
```javascript
// detection.js - Match apps against database
function detectApps(expenseData, saasDatabase) {
  const detectedApps = [];
  
  expenseData.forEach(expense => {
    const description = expense.Description.toLowerCase();
    
    saasDatabase.apps.forEach(app => {
      app.keywords.forEach(keyword => {
        if (description.includes(keyword.toLowerCase())) {
          detectedApps.push({
            ...app,
            month: expense.Date,
            cost: expense.Amount,
            employee: expense.Employee
          });
        }
      });
    });
  });
  
  return detectedApps;
}
```

### 3. Risk Scoring (Backend)
```javascript
// detection.js - Calculate risk score
function calculateRiskScore(app, foundCount) {
  let score = 0;
  
  // Risk level
  if (app.risk_level === 'high') score += 7;
  else if (app.risk_level === 'medium') score += 4;
  else score += 1;
  
  // Data sensitivity
  if (app.data_permissions.includes('email')) score += 1;
  if (app.data_permissions.includes('customer_data')) score += 2;
  if (app.data_permissions.includes('phone')) score += 2;
  
  // Frequency (more uses = more concern)
  if (foundCount > 5) score += 2;
  
  return Math.min(score, 10); // Cap at 10
}
```

### 4. Duplicate Detection (Backend)
```javascript
// detection.js - Find overlapping tools
function findDuplicates(detectedApps) {
  const categories = {};
  
  detectedApps.forEach(app => {
    if (!categories[app.category]) {
      categories[app.category] = [];
    }
    categories[app.category].push(app);
  });
  
  const duplicates = Object.entries(categories)
    .filter(([cat, apps]) => apps.length > 1)
    .map(([cat, apps]) => ({
      category: cat,
      tools: apps,
      savings: apps.reduce((sum, a) => sum + a.typical_price, 0) - (apps[0].typical_price)
    }));
  
  return duplicates;
}
```

### 5. Dashboard Display (Frontend)
```javascript
// Dashboard.js - Show results
import React from 'react';

export function Dashboard({ results }) {
  return (
    <div className="dashboard">
      <h1>Shadow SaaS Detection Results</h1>
      
      <div className="summary">
        <div className="card">
          <h3>Apps Found</h3>
          <p>{results.appCount}</p>
        </div>
        <div className="card">
          <h3>Monthly Shadow Spend</h3>
          <p>${results.totalSpend}</p>
        </div>
        <div className="card">
          <h3>Potential Savings</h3>
          <p>${results.savings}/month</p>
        </div>
      </div>
      
      <h2>Detected Apps</h2>
      {results.detectedApps.map(app => (
        <div key={app.id} className={`app-card risk-${app.risk_level}`}>
          <h3>{app.name}</h3>
          <p>Risk: {app.risk_level}</p>
          <p>Cost: ${app.cost}</p>
          <p>Users: {app.userCount}</p>
        </div>
      ))}
      
      <h2>Duplicates Found</h2>
      {results.duplicates.map((dup, i) => (
        <div key={i} className="duplicate-card">
          <h3>{dup.category}</h3>
          <ul>
            {dup.tools.map(t => <li key={t.id}>{t.name}</li>)}
          </ul>
          <p>Save: ${dup.savings}/month</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ DEPLOYMENT (Free Hosting)

### Deploy Backend on Heroku (Free)
```bash
# Create account: https://heroku.com
# Install Heroku CLI
# In backend folder:
heroku create my-shadow-saas
git push heroku main
# Get URL like: https://my-shadow-saas.herokuapp.com
```

### Deploy Frontend on Vercel (Free)
```bash
# Create account: https://vercel.com
# In frontend folder:
npm install -g vercel
vercel
# Get URL like: https://my-shadow-saas.vercel.app
```

After this, your app is live and you can share the link in your submission!

---

## FINAL ACTION PLAN

A complementary, executable action plan has been created at `final app action plan.md` in the repository root. It contains:
- A step-by-step executable build & demo plan for the Savings Simulator + One-Click Playbook feature
- Full architecture and component responsibilities
- Simple-language explanations and test commands
- Failure modes and test-time mitigations

Open `final app action plan.md` to follow the exact steps for building, testing, and demoing the feature.

---

## 🎯 BEFORE YOU START CODING

1. ✅ Have Node.js installed
2. ✅ Create GitHub account
3. ✅ Create Heroku + Vercel accounts (free)
4. ✅ Download sample data files from test_data/
5. ✅ Read this guide again to understand each piece

You're ready to build! 🚀
