# 🚀 AI Integration Guide — Shadow SaaS Detector

## Quick Start

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **"Create API Key"** 
3. Copy the key and store it securely

### 2. Set Up Environment

```bash
cd backend

# Create .env.local (won't be committed - secure!)
cp .env.example .env.local

# Edit .env.local and paste your API key:
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

### 3. Start Backend

```bash
# Backend will auto-load .env.local
npm start
```

### 4. Test AI Features

```bash
# Risk Assessment API
curl -X POST http://localhost:5000/api/ai/risk-assessment \
  -H "Content-Type: application/json" \
  -d '{"detectedApps": [...]}'

# Consolidation API  
curl -X POST http://localhost:5000/api/ai/consolidation \
  -H "Content-Type: application/json" \
  -d '{"detectedApps": [...]}'

# Compliance Report API
curl -X POST http://localhost:5000/api/ai/compliance-report \
  -H "Content-Type: application/json" \
  -d '{"detectedApps": [...]}'
```

---

## API Endpoints

### POST `/api/ai/health`
Check if AI service is online and which API is configured.

**Response:**
```json
{
  "status": "ok",
  "aiEnabled": true,
  "cacheStats": {
    "riskAssessments": 5,
    "consolidations": 2,
    "complianceReports": 1
  },
  "features": ["risk-assessment", "consolidation", "compliance-report"]
}
```

---

### POST `/api/ai/risk-assessment`
Analyze detected apps for cybersecurity risk using Gemini AI.

**Request:**
```json
{
  "detectedApps": [
    {
      "id": 1,
      "name": "Copper CRM",
      "category": "CRM",
      "typical_price": 50,
      "risk_level": "high",
      "employee": "john.smith",
      "data_permissions": ["contacts", "emails", "calendar"],
      "evidence": ["Uses email data for customer sync"]
    }
  ]
}
```

**Response:**
```json
{
  "status": "completed",
  "timestamp": "2026-03-09T15:45:12.907Z",
  "totalApps": 1,
  "assessments": {
    "Copper CRM": {
      "level": "critical",
      "score": 95,
      "reasoning": "Critical risk: accesses PII, unmanaged user access, no SSO",
      "mainRisks": [
        "Accesses employee PII (contacts, emails)",
        "Unauthorized user access",
        "No SSO enforcement"
      ],
      "recommendations": [
        "Immediate revocation recommended",
        "Replace with compliant alternative (e.g., HubSpot with SSO)"
      ],
      "category": "CRM",
      "cost": 50
    }
  }
}
```

---

### POST `/api/ai/consolidation`
Get AI recommendations for consolidating duplicate SaaS tools.

**Request:**
```json
{
  "detectedApps": [...],
  "category": "Communication"  // optional: for single category
}
```

**Response (all categories):**
```json
{
  "status": "completed",
  "timestamp": "2026-03-09T15:45:17.250Z",
  "recommendations": [
    {
      "category": "Communication",
      "keep": ["Slack"],
      "remove": ["Microsoft Teams", "Discord"],
      "reasoning": "Slack covers all messaging needs and is cheapest",
      "estimatedSavings": 440
    },
    {
      "category": "CRM",
      "keep": ["HubSpot"],
      "remove": ["Copper CRM"],
      "reasoning": "HubSpot is more feature-complete and cheaper",
      "estimatedSavings": 600
    }
  ]
}
```

---

### POST `/api/ai/compliance-report`
Generate a compliance assessment (GDPR, CCPA, SOC 2).

**Request:**
```json
{
  "detectedApps": [...],
  "format": "json"  // or "markdown"
}
```

**Response (JSON format):**
```json
{
  "status": "completed",
  "timestamp": "2026-03-09T15:45:22.100Z",
  "report": {
    "generatedAt": "2026-03-09T15:45:22.100Z",
    "totalApps": 5,
    "criticalIssues": 2,
    "complianceScore": 72,
    "issues": [
      {
        "app": "Copper CRM",
        "policy": "GDPR Data Protection",
        "severity": "critical",
        "description": "Processes EU employee PII without DPA",
        "recommendation": "Execute Data Processing Agreement or restrict EU access"
      }
    ],
    "summary": "2 critical issues identified. Compliance score: 72/100",
    "forecast12Months": "Without action: Risk increases 20% quarterly. With remediation: 95+ within 60 days",
    "actionItems": [
      "Establish SaaS approval workflow",
      "Review data processing agreements",
      "Schedule revocation of critical-risk apps",
      "Document GDPR compliance for 3+ apps"
    ]
  }
}
```

---

### POST `/api/ai/clear-cache`
Clear all cached AI responses (admin endpoint).

**Response:**
```json
{
  "status": "caches cleared",
  "timestamp": "2026-03-09T15:46:00.000Z"
}
```

---

## 🔒 Security Features

### Fallback Logic
- **No API key?** Endpoint automatically uses rule-based analysis (always works)
- **API timeout?** Falls back to rule-based, no demo failure
- **API error?** Graceful degradation with fallback scoring

### Caching Strategy
- **5-minute cache** for risk assessments (prevent rate limits)
- **5-minute cache** for consolidations
- **10-minute cache** for compliance reports
- Keyed by app ID + permissions hash

### Environment Variables
```bash
# .env.local (NEVER commit this!)
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

---

## Local Testing (Without API Key)

All endpoints work without a Gemini API key using rule-based logic:

```bash
# Risk Assessment (rule-based)
curl -X POST http://localhost:5000/api/ai/risk-assessment \
  -H "Content-Type: application/json" \
  -d '{"detectedApps": [{"id":1,"name":"Test","category":"CRM","typical_price":50,"risk_level":"high"}]}'

# Returns rule-based risk score based on permissions + risk_level
# -> {level: "critical", score: 80, mainRisks: [...], recommendations: [...]}
```

---

## 🎯 Integration with Frontend

### For Judges Demo

1. **Dashboard Risk Widget:**
   ```
   Call POST /api/ai/risk-assessment after upload
   Display: "AI Risk Score: 7.2/10" with breakdown
   ```

2. **Smart Consolidation Tab:**
   ```
   Call POST /api/ai/consolidation after upload
   Show: "AI recommends removing $X/month in duplicates"
   ```

3. **Compliance Modal:**
   ```
   Call POST /api/ai/compliance-report
   Display: "GDPR Violations: 2 | Action Items: 4"
   Download as markdown or PDF
   ```

### API Progress Bar
While Gemini analyzes (max 5 sec):
```
"Analyzing 12 apps for security risks..." → Progress spinner
Falls back to rule-based if timeout
```

---

## 🛡️ Timeout & Reliability

```typescript
// All AI calls timeout after 3-5 seconds
const result = await Promise.race([
  model.generateContent(prompt),    // AI request
  new Promise<void>((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)  // 5 sec max
  )
]);

// If timeout → catch block → fallback to rule-based
```

**This ensures demo day reliability:**
- ✅ No hanging requests
- ✅ Always returns a result
- ✅ Shows AI reasoning OR rule-based score (both are useful)

---

## Environment Variable Template

See `backend/.env.example`:

```env
# Get this from https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

**Never commit `.env` or `.env.local`** — they're in `.gitignore`

---

## Debugging

### Check if AI is enabled:
```bash
curl http://localhost:5000/api/ai/health | jq '.aiEnabled'
# true = API key is set and working
# false = No API key, using fallbacks
```

### View cache stats:
```bash
curl http://localhost:5000/api/ai/health | jq '.cacheStats'
```

### Clear cache if needed:
```bash
curl -X POST http://localhost:5000/api/ai/clear-cache
```

### Check backend logs:
```bash
# Look for "⚠️ No API key found. Using rule-based..."
# or "Using fallback to rule-based scoring"
```

---

## Judges Will See

1. **Risk Assessment** — "Copper CRM is CRITICAL risk because it accesses PII without SSO. Recommendation: Revoke immediately."
2. **Consolidation** — "You're paying for 3 communication tools. Keep Slack ($8/mo), remove Teams & Discord → Save $264/year."
3. **Compliance** — "2 GDPR violations detected. Execute DPA within 30 days or restrict EU access."

All powered by Gemini AI (or rule-based fallback) with **transparent reasoning**. 🎯

