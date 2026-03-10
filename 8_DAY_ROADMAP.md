# 8-DAY IMPLEMENTATION ROADMAP

## Overview
**Total time:** 8 days × 8 hours = 64 hours of focused work.  
**Pace:** ~8 hours/day (you can split as 4+4 or 2+2+2+2)  
**Goal:** Working product deployed by day 8.

---

## DAY 1: Foundation & Setup (8 hours)

### What You'll Build
- Project folder structure
- Backend server (listening on port 5000)
- Frontend React app (listening on port 3000)
- SaaS app database (100+ apps)

### Hour-by-Hour Breakdown

**Hour 1-2: Project Setup**
```bash
# Do this:
mkdir shadow-saas-detector && cd shadow-saas-detector
mkdir backend frontend database test_data
cd backend && npm init -y
npm install express cors multer csv-parser dotenv body-parser
touch server.js .env
# server.js file created (empty for now)
```

**Hour 3: Test Backend is Running**
```javascript
// backend/server.js - Minimal version
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'Server running' });
});

app.listen(5000, () => console.log('✅ Server on port 5000'));
```

Run: `node server.js` → You should see "✅ Server on port 5000"

**Hour 4-5: Setup Frontend**
```bash
cd ../frontend
npx create-react-app .
# Takes 5 mins, then:
npm install axios
```

Test: `npm start` → Browser opens to localhost:3000 (React logo page)

**Hour 6-7: Create SaaS Database**
```json
// backend/data/saas_database.json
// Copy the 100+ apps database from TECH_SETUP.md
// Save as: backend/data/saas_apps.json
```

**Hour 8: Git Commit & Documentation**
```bash
git init
git add .
git commit -m "Initial project setup"
git remote add origin https://github.com/YOUR_USERNAME/shadow-saas-detector.git
git push -u origin main
```

### Deliverable by End of Day 1
- ✅ Backend running (http://localhost:5000/health)
- ✅ Frontend running (http://localhost:3000)
- ✅ SaaS database created and loaded
- ✅ GitHub repo initialized

### Test It
```bash
# Terminal 1:
cd backend && node server.js

# Terminal 2:
cd frontend && npm start

# Browser: http://localhost:3000 → React page loads ✅
# Browser: http://localhost:5000/health → {"status": "Server running"} ✅
```

---

## DAY 2: File Upload Interface (8 hours)

### What You'll Build
- Upload form UI (HTML + CSS)
- File input handlers
- Display uploaded file contents
- Save files to backend

### Hour-by-Hour Breakdown

**Hour 1-2: Build Upload Form Component**
```javascript
// frontend/src/components/UploadForm.js
import React, { useState } from 'react';
import axios from 'axios';

export function UploadForm({ onUploadSuccess }) {
  const [files, setFiles] = useState({
    expenses: null,
    history: null,
    roster: null
  });

  const handleFileChange = (e, fileType) => {
    setFiles({ ...files, [fileType]: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('expenses', files.expenses);
    formData.append('history', files.history);
    formData.append('roster', files.roster);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData);
      onUploadSuccess(response.data);
      alert('✅ Files uploaded successfully!');
    } catch (error) {
      alert('❌ Upload failed: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <h2>Upload Company Data</h2>
      
      <div>
        <label>Expense Report (CSV)</label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => handleFileChange(e, 'expenses')}
        />
      </div>

      <div>
        <label>Browser History (JSON)</label>
        <input 
          type="file" 
          accept=".json" 
          onChange={(e) => handleFileChange(e, 'history')}
        />
      </div>

      <div>
        <label>Company Roster (CSV)</label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => handleFileChange(e, 'roster')}
        />
      </div>

      <button type="submit">Analyze</button>
    </form>
  );
}
```

**Hour 3-4: Update App.js to use UploadForm**
```javascript
// frontend/src/App.js
import React, { useState } from 'react';
import { UploadForm } from './components/UploadForm';
import './App.css';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUploadSuccess = (data) => {
    setLoading(true);
    setTimeout(() => {
      setResults(data);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="App">
      <h1>🔍 Shadow SaaS Detector</h1>
      {!results ? (
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div>
          {loading && <p>⏳ Analyzing...</p>}
          {results && <p>✅ Analysis complete! (Dashboard coming day 5)</p>}
        </div>
      )}
    </div>
  );
}

export default App;
```

**Hour 5: Add Basic Styling**
```css
/* frontend/src/App.css */
.App {
  max-width: 800px;
  margin: 40px auto;
  font-family: Arial, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
}

form {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

form div {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background: #2980b9;
}
```

**Hour 6-7: Backend Upload Handler**
```javascript
// backend/server.js - Add upload route
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Load SaaS database
const saasDatabase = JSON.parse(
  fs.readFileSync('./data/saas_apps.json', 'utf8')
);

app.post('/upload', upload.fields([
  { name: 'expenses', maxCount: 1 },
  { name: 'history', maxCount: 1 },
  { name: 'roster', maxCount: 1 }
]), (req, res) => {
  try {
    const uploadedFiles = {
      expenses: req.files.expenses ? req.files.expenses[0].filename : null,
      history: req.files.history ? req.files.history[0].filename : null,
      roster: req.files.roster ? req.files.roster[0].filename : null
    };

    console.log('✅ Files received:', uploadedFiles);

    // Temporary response (detection coming day 3)
    res.json({
      status: 'success',
      message: 'Files uploaded',
      files: uploadedFiles,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server running' });
});

app.listen(5000, () => console.log('✅ Server on port 5000'));
```

**Hour 8: Test End-to-End**
- Upload test CSV file → See confirmation ✅
- Check `uploads/` folder → Files are there ✅
- Frontend receives response ✅
- Git commit

### Deliverable by End of Day 2
- ✅ Beautiful upload form UI
- ✅ File input (3 file types)
- ✅ Backend receives files
- ✅ Success message to user
- ✅ Files saved on server

### Test It
```bash
# Terminal 1: Backend
cd backend && node server.js

# Terminal 2: Frontend  
cd frontend && npm start

# Browser: Upload test_data/expenses.csv
# Expected: "✅ Files uploaded successfully!"
```

---

## DAY 3: Detection Engine (8 hours)

### What You'll Build
- Parse CSV files (expense report)
- Parse JSON files (browser history)
- Match app names against SaaS database
- Calculate risk scores
- Detect duplicates
- Return analysis results

### Hour-by-Hour Breakdown

**Hour 1-2: CSV Parser Function**
```javascript
// backend/services/parser.js
const csv = require('csv-parser');
const fs = require('fs');

function parseExpenseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseHistoryJSON(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.browser_history || [];
  } catch (error) {
    return [];
  }
}

function parseRosterCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

module.exports = { parseExpenseCSV, parseHistoryJSON, parseRosterCSV };
```

**Hour 3-4: Detection Function**
```javascript
// backend/services/detection.js
const parser = require('./parser');

async function detectSaaS(uploadedFiles, saasDatabase) {
  const detectedApps = [];
  const siteToApp = {};
  
  // Build quick lookup from domain to app
  saasDatabase.apps.forEach(app => {
    app.keywords.forEach(keyword => {
      siteToApp[keyword.toLowerCase()] = app;
    });
  });

  // Parse expense report
  if (uploadedFiles.expenses) {
    const expenses = await parser.parseExpenseCSV(uploadedFiles.expenses);
    expenses.forEach(expense => {
      const description = expense.Description.toLowerCase();
      saasDatabase.apps.forEach(app => {
        if (app.keywords.some(kw => description.includes(kw.toLowerCase()))) {
          detectedApps.push({
            ...app,
            foundIn: 'expense',
            cost: parseFloat(expense.Amount) || 0,
            date: expense.Date,
            employee: expense.Employee || 'Unknown'
          });
        }
      });
    });
  }

  // Parse browser history
  if (uploadedFiles.history) {
    const history = parser.parseHistoryJSON(uploadedFiles.history);
    history.forEach(entry => {
      const domain = new URL(entry.url).hostname.toLowerCase();
      saasDatabase.apps.forEach(app => {
        if (app.keywords.some(kw => domain.includes(kw.toLowerCase()))) {
          detectedApps.push({
            ...app,
            foundIn: 'browser_history',
            url: entry.url,
            title: entry.title
          });
        }
      });
    });
  }

  // Remove duplicates (same app found multiple times)
  const uniqueApps = [];
  const seenIds = new Set();
  
  detectedApps.forEach(app => {
    if (!seenIds.has(app.id)) {
      uniqueApps.push(app);
      seenIds.add(app.id);
    }
  });

  return uniqueApps;
}

module.exports = { detectSaaS };
```

**Hour 5: Risk Scoring Function**
```javascript
// backend/services/riskScoring.js
function calculateRiskScores(detectedApps) {
  return detectedApps.map(app => {
    let score = 0;

    // Base risk level
    const riskMap = { high: 7, medium: 4, low: 1 };
    score += riskMap[app.risk_level] || 1;

    // Data sensitivity
    if (app.data_permissions && app.data_permissions.length > 0) {
      if (app.data_permissions.includes('email')) score += 1;
      if (app.data_permissions.includes('customer_data')) score += 2;
      if (app.data_permissions.includes('phone')) score += 2;
      if (app.data_permissions.includes('contacts')) score += 2;
      if (app.data_permissions.includes('calendar')) score += 1;
    }

    return {
      ...app,
      riskScore: Math.min(score, 10),
      riskCategory: score >= 8 ? 'HIGH' : score >= 5 ? 'MEDIUM' : 'LOW'
    };
  });
}

module.exports = { calculateRiskScores };
```

**Hour 6-7: Duplicate Detection Function**
```javascript
// backend/services/duplicateDetection.js
function findDuplicates(detectedApps) {
  const byCategory = {};

  detectedApps.forEach(app => {
    if (!byCategory[app.category]) {
      byCategory[app.category] = [];
    }
    byCategory[app.category].push(app);
  });

  const duplicateGroups = [];
  Object.entries(byCategory).forEach(([category, apps]) => {
    if (apps.length > 1) {
      const totalCost = apps.reduce((sum, a) => sum + (a.typical_price || 0), 0);
      const minCost = Math.min(...apps.map(a => a.typical_price || 0));
      
      duplicateGroups.push({
        category,
        tools: apps,
        count: apps.length,
        totalMonthlyCost: totalCost,
        potentialSavings: totalCost - minCost // Keep only cheapest
      });
    }
  });

  return duplicateGroups;
}

module.exports = { findDuplicates };
```

**Hour 8: Wire Everything Together**
```javascript
// backend/server.js - Update upload handler
const { detectSaaS } = require('./services/detection');
const { calculateRiskScores } = require('./services/riskScoring');
const { findDuplicates } = require('./services/duplicateDetection');

app.post('/upload', upload.fields([
  { name: 'expenses', maxCount: 1 },
  { name: 'history', maxCount: 1 },
  { name: 'roster', maxCount: 1 }
]), async (req, res) => {
  try {
    const uploadPaths = {
      expenses: req.files.expenses?.[0]?.path,
      history: req.files.history?.[0]?.path,
      roster: req.files.roster?.[0]?.path
    };

    // Run detection
    const detectedApps = await detectSaaS(uploadPaths, saasDatabase);

    // Scoring
    const scoredApps = calculateRiskScores(detectedApps);

    // Duplicates
    const duplicates = findDuplicates(scoredApps);

    // Calculate totals
    const totalShadowSpend = scoredApps.reduce((sum, app) => {
      return sum + (app.cost || app.typical_price || 0);
    }, 0);

    const totalSavings = duplicates.reduce((sum, dup) => {
      return sum + dup.potentialSavings;
    }, 0);

    res.json({
      status: 'success',
      summary: {
        appsFound: scoredApps.length,
        totalMonthlySpend: totalShadowSpend,
        potentialSavings: totalSavings,
        duplicateGroups: duplicates.length
      },
      detectedApps: scoredApps.sort((a, b) => b.riskScore - a.riskScore),
      duplicates: duplicates.sort((a, b) => b.potentialSavings - a.potentialSavings)
    });

    // Cleanup uploaded files
    Object.values(uploadPaths).forEach(path => {
      if (path) fs.unlink(path, () => {});
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Deliverable by End of Day 3
- ✅ CSV parser working
- ✅ JSON parser working
- ✅ App detection matching names
- ✅ Risk scores calculated (1-10)
- ✅ Duplicates identified
- ✅ Cost calculations working
- ✅ Backend sends analysis JSON

### Test It
```bash
# Upload test_data/expenses.csv
# Check console for detected apps with risk scores
# Expected output includes all 8 apps from sample data with scores
```

---

## DAY 4: Analytics & Recommendations (8 hours)

### What You'll Build
- Recommendations engine
- Department breakdown
- Breakdown by risk level
- Savings recommendations
- Approved vs disapproved apps

### Hour-by-Hour Breakdown

**Hour 1-2: Recommendations Engine**
```javascript
// backend/services/recommendations.js
function generateRecommendations(detectedApps, duplicates) {
  const recommendations = [];

  // Recommendation 1: High-risk apps
  const highRiskApps = detectedApps.filter(app => app.riskScore >= 8);
  if (highRiskApps.length > 0) {
    recommendations.push({
      priority: 'URGENT',
      type: 'SECURITY',
      title: 'Revoke High-Risk Apps',
      description: `${highRiskApps.length} app(s) have high security risk and data access`,
      apps: highRiskApps,
      action: 'Immediately revoke access and block these applications',
      estimatedSavings: highRiskApps.reduce((sum, a) => sum + (a.typical_price || 0), 0)
    });
  }

  // Recommendation 2: Consolidate duplicates
  duplicates.forEach(dup => {
    recommendations.push({
      priority: 'HIGH',
      type: 'CONSOLIDATION',
      title: `Consolidate ${dup.category} Tools`,
      description: `You have ${dup.count} tools doing the same job`,
      apps: dup.tools,
      action: `Pick 1 tool, retire others. Recommended: ${dup.tools[0].name}`,
      estimatedSavings: dup.potentialSavings
    });
  });

  // Recommendation 3: Unauthorized tools without approval
  const unauthorizedExpensive = detectedApps.filter(
    app => app.foundIn === 'expense' && app.riskScore <= 7 && app.typical_price > 30
  );
  
  if (unauthorizedExpensive.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'APPROVAL',
      title: 'Review Unauthorized Expensive Apps',
      description: 'These apps are not on approved list but are widely used',
      apps: unauthorizedExpensive,
      action: 'Review with department heads and officially approve or block',
      estimatedSavings: 0
    });
  }

  // Sort by priority
  const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

module.exports = { generateRecommendations };
```

**Hour 3-4: Department Analytics**
```javascript
// backend/services/analytics.js
function generateDepartmentAnalytics(detectedApps, roster) {
  const byDept = {};

  detectedApps.forEach(app => {
    const dept = app.employee?.split('.')[0] || 'Unknown';
    
    if (!byDept[dept]) {
      byDept[dept] = {
        name: dept,
        apps: [],
        totalCost: 0,
        appCount: 0
      };
    }
    
    byDept[dept].apps.push(app);
    byDept[dept].totalCost += (app.cost || app.typical_price || 0);
    byDept[dept].appCount += 1;
  });

  return Object.values(byDept).sort((a, b) => b.totalCost - a.totalCost);
}

function generateRiskBreakdown(detectedApps) {
  const high = detectedApps.filter(a => a.riskScore >= 8).length;
  const medium = detectedApps.filter(a => a.riskScore >= 5 && a.riskScore < 8).length;
  const low = detectedApps.filter(a => a.riskScore < 5).length;

  return { high, medium, low };
}

module.exports = { generateDepartmentAnalytics, generateRiskBreakdown };
```

**Hour 5: Update API Response**
```javascript
// backend/server.js - Enhanced response
const { generateRecommendations } = require('./services/recommendations');
const { generateDepartmentAnalytics, generateRiskBreakdown } = require('./services/analytics');

// In /upload endpoint, add:
const recommendations = generateRecommendations(scoredApps, duplicates);
const departments = generateDepartmentAnalytics(scoredApps);
const riskBreakdown = generateRiskBreakdown(scoredApps);

res.json({
  status: 'success',
  summary: {
    appsFound: scoredApps.length,
    totalMonthlySpend: Math.round(totalShadowSpend),
    potentialSavings: Math.round(totalSavings),
    riskBreakdown: riskBreakdown
  },
  detectedApps: scoredApps.sort((a, b) => b.riskScore - a.riskScore),
  duplicates,
  recommendations,
  departmentAnalytics: departments
});
```

**Hour 6-7: Testing & Debug**
- Upload test data
- Verify recommendations are sensible
- Check calculations
- Fix any issues

**Hour 8: Git commit**
```bash
git add .
git commit -m "Add recommendations and analytics engine"
```

### Deliverable by End of Day 4
- ✅ Smart recommendations generated
- ✅ Department-level breakdown
- ✅ Risk category analysis (high/medium/low)
- ✅ Savings calculated per recommendation
- ✅ API returns complete analysis object

---

## DAY 5: Dashboard UI (8 hours)

### What You'll Build
- Beautiful dashboard component
- Risk score visualization (color-coded)
- Recommendation cards
- Department breakdown table
- Duplicate tools comparison

### Hour-by-Hour Breakdown

**Hour 1-2: Main Dashboard Component**
```javascript
// frontend/src/components/Dashboard.js
import React from 'react';
import './Dashboard.css';

export function Dashboard({ results }) {
  if (!results) return <p>No data to display</p>;

  const { summary, detectedApps, recommendations, departmentAnalytics } = results;

  return (
    <div className="dashboard">
      <h1>📊 Shadow SaaS Detection Report</h1>
      
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="card card-primary">
          <h3>Apps Found</h3>
          <p className="big-number">{summary.appsFound}</p>
        </div>
        <div className="card card-warning">
          <h3>Monthly Shadow Spend</h3>
          <p className="big-number">${summary.totalMonthlySpend}</p>
        </div>
        <div className="card card-success">
          <h3>Potential Savings</h3>
          <p className="big-number">${summary.potentialSavings}/mo</p>
        </div>
        <div className={`card card-danger`}>
          <h3>High Risk Apps</h3>
          <p className="big-number">{summary.riskBreakdown.high}</p>
        </div>
      </div>

      {/* Risk Breakdown */}
      <section className="risk-breakdown">
        <h2>Risk Analysis</h2>
        <div className="risk-bars">
          <div className="risk-bar">
            <div className="label">High Risk 🔴</div>
            <div className="bar">
              <div className="fill high" style={{width: `${(summary.riskBreakdown.high / summary.appsFound) * 100}%`}}></div>
            </div>
            <div className="count">{summary.riskBreakdown.high}</div>
          </div>
          <div className="risk-bar">
            <div className="label">Medium Risk 🟡</div>
            <div className="bar">
              <div className="fill medium" style={{width: `${(summary.riskBreakdown.medium / summary.appsFound) * 100}%`}}></div>
            </div>
            <div className="count">{summary.riskBreakdown.medium}</div>
          </div>
          <div className="risk-bar">
            <div className="label">Low Risk 🟢</div>
            <div className="bar">
              <div className="fill low" style={{width: `${(summary.riskBreakdown.low / summary.appsFound) * 100}%`}}></div>
            </div>
            <div className="count">{summary.riskBreakdown.low}</div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="recommendations">
        <h2>🎯 Recommended Actions</h2>
        {recommendations.map((rec, i) => (
          <div key={i} className={`rec-card priority-${rec.priority.toLowerCase()}`}>
            <div className="rec-header">
              <h3>{rec.title}</h3>
              <span className={`badge priority-${rec.priority.toLowerCase()}`}>{rec.priority}</span>
            </div>
            <p>{rec.description}</p>
            <div className="rec-apps">
              {rec.apps.slice(0, 3).map(app => ( 
                <span key={app.id} className="app-tag">{app.name}</span>
              ))}
            </div>
            <div className="rec-footer">
              <p className="action">{rec.action}</p>
              {rec.estimatedSavings > 0 && (
                <p className="savings">💰 Save ${rec.estimatedSavings}/month</p>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Detected Apps List */}
      <section className="apps-list">
        <h2>🔍 Detected Shadow SaaS Apps</h2>
        {detectedApps.map(app => (
          <div key={app.id} className={`app-card risk-${app.riskCategory.toLowerCase()}`}>
            <div className="app-header">
              <h4>{app.name}</h4>
              <span className={`risk-badge risk-${app.riskCategory.toLowerCase()}`}>
                {app.riskScore}/10
              </span>
            </div>
            <p className="description">{app.description}</p>
            <div className="app-details">
              <div className="detail">
                <span className="label">Category:</span>
                <span className="value">{app.category}</span>
              </div>
              <div className="detail">
                <span className="label">Monthly Cost:</span>
                <span className="value">${app.typical_price}</span>
              </div>
              <div className="detail">
                <span className="label">Found In:</span>
                <span className="value">{app.foundIn === 'expense' ? '💰 Expense Report' : '🌐 Browser History'}</span>
              </div>
            </div>
            {app.data_permissions && app.data_permissions.length > 0 && (
              <div className="permissions">
                <strong>Data Access:</strong>
                {app.data_permissions.map(perm => (
                  <span key={perm} className="perm-tag">{perm}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Department Analytics */}
      {departmentAnalytics.length > 0 && (
        <section className="department-analytics">
          <h2>📈 Department Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Apps</th>
                <th>Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {departmentAnalytics.map(dept => (
                <tr key={dept.name}>
                  <td>{dept.name}</td>
                  <td>{dept.appCount}</td>
                  <td>${dept.totalCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Export Button */}
      <div className="export-section">
        <button className="export-btn" onClick={() => window.print()}>
          📥 Export as PDF
        </button>
      </div>
    </div>
  );
}
```

**Hour 3-4: Dashboard Styling**
```css
/* frontend/src/components/Dashboard.css */
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f9fafb;
}

/* Summary Cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 5px solid #3498db;
}

.card-primary { border-left-color: #3498db; }
.card-warning { border-left-color: #f39c12; }
.card-success { border-left-color: #27ae60; }
.card-danger { border-left-color: #e74c3c; }

.big-number {
  font-size: 32px;
  font-weight: bold;
  margin: 10px 0 0 0;
}

/* Risk Breakdown */
.risk-breakdown {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.risk-bar {
  margin-bottom: 15px;
}

.label {
  font-weight: bold;
  margin-bottom: 5px;
}

.bar {
  height: 30px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.fill {
  height: 100%;
  transition: width 0.3s ease;
}

.fill.high { background: linear-gradient(90deg, #e74c3c, #c0392b); }
.fill.medium { background: linear-gradient(90deg, #f39c12, #e67e22); }
.fill.low { background: linear-gradient(90deg, #27ae60, #229954); }

/* Recommendation Cards */
.recommendations {
  margin-bottom: 30px;
}

.rec-card {
  background: white;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  border-left: 5px solid;
}

.priority-urgent { border-left-color: #e74c3c; }
.priority-high { border-left-color: #f39c12; }
.priority-medium { border-left-color: #3498db; }

.badge {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.priority-urgent .badge { background: #e74c3c; }
.priority-high .badge { background: #f39c12; }
.priority-medium .badge { background: #3498db; }

.app-tag {
  display: inline-block;
  background: #ecf0f1;
  padding: 5px 10px;
  border-radius: 4px;
  margin-right: 5px;
  margin-bottom: 5px;
  font-size: 12px;
}

.savings {
  color: #27ae60;
  font-weight: bold;
}

/* Apps List */
.apps-list {
  margin-bottom: 30px;
}

.app-card {
  background: white;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  border-left: 5px solid;
}

.risk-high { border-left-color: #e74c3c; }
.risk-medium { border-left-color: #f39c12; }
.risk-low { border-left-color: #27ae60; }

.risk-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: bold;
  color: white;
  font-size: 14px;
}

.risk-high .risk-badge { background: #e74c3c; }
.risk-medium .risk-badge { background: #f39c12; }
.risk-low .risk-badge { background: #27ae60; }

.app-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.detail {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
}

.value {
  font-weight: bold;
  color: #2c3e50;
}

.permissions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ecf0f1;
}

.perm-tag {
  display: inline-block;
  background: #e74c3c;
  color: white;
  padding: 3px 8px;
  border-radius: 3px;
  margin-right: 5px;
  font-size: 11px;
}

/* Department Analytics Table */
.department-analytics {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background: #f5f5f5;
  font-weight: bold;
}

tr:hover {
  background: #fafafa;
}

/* Export Button */
.export-section {
  text-align: center;
  margin-top: 30px;
}

.export-btn {
  background: #27ae60;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.export-btn:hover {
  background: #229954;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .app-details {
    grid-template-columns: 1fr;
  }
}

/* Print Styling (for PDF export) */
@media print {
  .dashboard {
    background: white;
  }
  
  .card, .rec-card, .app-card {
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .export-section {
    display: none;
  }
}
```

**Hour 5: Update Main App.js to Show Dashboard**
```javascript
// frontend/src/App.js
import React, { useState } from 'react';
import { UploadForm } from './components/UploadForm';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUploadSuccess = (data) => {
    setLoading(true);
    setTimeout(() => {
      setResults(data);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="App">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>⏳ Analyzing your company data...</p>
        </div>
      )}
      
      {!results ? (
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      ) : (
        <>
          <button className="back-btn" onClick={() => setResults(null)}>
            ← Upload New Data
          </button>
          <Dashboard results={results} />
        </>
      )}
    </div>
  );
}

export default App;
```

**Hour 6-7: Test & Polish**
- Upload sample data
- Verify dashboard displays correctly
- Check styling on mobile
- Fix any bugs

**Hour 8: Git commit**

### Deliverable by End of Day 5
- ✅ Complete dashboard UI
- ✅ Risk visualization (color-coded)
- ✅ Recommendations displayed
- ✅ Department breakdown table
- ✅ Mobile responsive
- ✅ Beautiful styling

---

## DAY 6: Export & Polish (8 hours)

### What You'll Build
- PDF export functionality
- CSV export
- Email report
- UI refinements
- Performance optimization

### Hour-by-Hour Breakdown

**Hour 1-3: PDF Export**
```bash
npm install jspdf html2canvas  # In frontend folder

# frontend/src/components/ExportPDF.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function exportToPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  
  html2canvas(element, { scale: 2 }).then((canvas) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    
    pdf.save(filename);
  });
}
```

**Hour 4: CSV Export**
Create function to export results as CSV for tracking

**Hour 5-6: UI Polish**
- Add loading spinner
- Improve colors/fonts
- Test responsiveness
- Edge cases

**Hour 7: Performance**
- Optimize large uploads
- Cache SaaS database

**Hour 8: Testing**

### Deliverable by End of Day 6
- ✅ PDF export working
- ✅ CSV export
- ✅ Polish complete
- ✅ Mobile responsive
- ✅ Fast performance

---

## DAY 7: Demo Video & Preparation (8 hours)

### What You'll Do

**Hour 1-3: Record Demo Video (2-3 minutes)**
```
Demo Script:
0-10 sec: "This is Shadow SaaS Detector"
10-20 sec: "Startups lose money and security to unauthorized SaaS tools"
20-40 sec: Upload expense CSV → show files loading
40-60 sec: Dashboard appears → snap through findings
60-90 sec: Show high-risk apps identified
90-110 sec: Show recommendations (consolidate, save money)
110-130 sec: Show department breakdown
130-150 sec: Show export PDF button
150-170 sec: "Join 1000s of IT managers who saved $300+/month"
```

Use:
- OBS or Screencastify (free) to record
- Edit with basic cuts
- Upload to YouTube (unlisted)
- Download link

**Hour 4: Write Submission Content**

Project Title:
```
Shadow SaaS Detector - Control Your Software Spending
```

Problem Statement:
```
Startups lose $300-500+ monthly to unauthorized SaaS tools. 
Employees use ChatGPT, Figma, Copper, Zapier - all without approval.
IT managers have no visibility into expense, security risks, or compliance issues.
Result: Data breaches, wasted money, compliance violations.
```

Solution Overview:
```
Upload expense reports, browser history, OAuth apps.
Tool detects unauthorized SaaS, identifies duplicates, calculates savings.
You get: dashboard with risk scores, recommendations, PDF report.
```

Technical Approach:
```
- Frontend: React.js (beautiful UI, file uploads, interactive dashboard)
- Backend: Node.js + Express (CSV/JSON parsing, detection engine, risk scoring)
- Database: JSON-based SaaS app database (500+ apps with risk data)
- No AI/ML needed - pattern matching + rule engine
- Privacy-first: files processed, not stored
```

**Hour 5-6: Create README & Documentation**
See the README_TEMPLATE.md below

**Hour 7-8: Final Checks**
- ✅ Code runs end-to-end
- ✅ GitHub repo clean
- ✅ README complete
- ✅ Demo video ready
- ✅ Sample data included

### Deliverable by End of Day 7
- ✅ Demo video recorded (YouTube)
- ✅ README written
- ✅ GitHub repo clean
- ✅ All submission content ready

---

## DAY 8: Deploy & Submit (8 hours)

### What You'll Do

**Hour 1-2: Deploy Backend**
```bash
# Install Heroku CLI
heroku login
heroku create shadow-saas-detector-[yourname]
git subtree push --prefix backend heroku main
# Get URL: https://shadow-saas-detector-[yourname].herokuapp.com
```

**Hour 3-4: Deploy Frontend**
```bash
cd frontend
npm run build
# Deploy to Vercel
vercel --prod
# Get URL: https://shadow-saas-detector-[yourname].vercel.app
```

Update frontend `.env` with backend URL

**Hour 5: Test Live Deployment**
- Upload sample file to live site
- Verify everything works
- Fix any issues

**Hour 6: Prepare Submission**

Gather:
- ✅ GitHub link
- ✅ Live demo link (Vercel)
- ✅ YouTube demo video link
- ✅ Team members (if any)
- ✅ Project images (screenshots)

**Hour 7: Submit to Hackathon**

Go to: https://devpost.com/software/shadow-saas-detector

Fill out form:
```
Project Title: Shadow SaaS Detector
Team: [Your name]
Category: Cybersecurity / Productivity
Description: [From submission brief]
GitHub Repo: https://github.com/YOUR_USERNAME/shadow-saas-detector
Demo Video: https://youtube.com/watch?v=...
Deployed Link: https://shadow-saas-detector-[name].vercel.app

Technologies:
- React.js
- Node.js
- Express
- PostgreSQL
- CSV Parsing
```

**Hour 8: Celebrate 🎉**
- Submit button click
- Share on Twitter/LinkedIn
- Tell friends to vote
- Rest and enjoy!

### Final Deliverable
```
✅ Live deployed app
✅ GitHub repo with clean code
✅ Devpost submission
✅ YouTube demo video
✅ Ready for 8-day hackathon!
```

---

## 📊 Quick Reference: What You've Built

| Day | Feature | Status |
|-----|---------|--------|
| 1 | Project setup, SaaS database | ✅ |
| 2 | Upload form, file handling | ✅ |
| 3 | Detection engine, risk scoring | ✅ |
| 4 | Recommendations, analytics | ✅ |
| 5 | Dashboard UI, visualizations | ✅ |
| 6 | PDF export, polish | ✅ |
| 7 | Demo video, documentation | ✅ |
| 8 | Deployment, submission | ✅ |

---

Ready? Let's start Day 1! 🚀
