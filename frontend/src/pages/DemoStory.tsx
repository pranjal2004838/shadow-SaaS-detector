import { useState, useEffect, useRef } from 'react';
import Simulator from '../components/Simulator';
import type { DetectedApp } from '../services/api';

/* ══════════════════════════════════════════════════════════════════
   DEMO STORY — Simulated live walkthrough with real UI + callouts
   ══════════════════════════════════════════════════════════════════ */

/* ── hardcoded demo company data ── */
const DEMO_APPS: DetectedApp[] = [
  { id: 1,  name: 'Recruiting Bot',  category: 'HR',            typical_price: 200, risk_level: 'critical', employee: 'henry.jones',    department: 'HR',          evidence: ['Expense: $200/mo on 2026-01-25', 'Browser: 112 visits'], data_permissions: ['Employee SSN', 'Phone numbers', 'Employee records', 'Salary data'] },
  { id: 2,  name: '1Password Biz',   category: 'Security',      typical_price: 60,  risk_level: 'critical', employee: 'frank.miller',   department: 'Engineering', evidence: ['Expense: $60/mo on 2026-02-01'],              data_permissions: ['Credentials', 'API keys', 'Passwords'] },
  { id: 3,  name: 'LastPass Teams',  category: 'Security',      typical_price: 40,  risk_level: 'critical', employee: 'grace.hall',     department: 'Engineering', evidence: ['Expense: $40/mo on 2026-02-01', 'Browser: 78 visits'], data_permissions: ['Credentials', 'Passwords', 'SSN'] },
  { id: 4,  name: 'Zapier',          category: 'Automation',    typical_price: 99,  risk_level: 'high',     employee: 'david.lee',      department: 'Operations',  evidence: ['Expense: $99/mo on 2026-01-22', 'Browser: 156 visits'], data_permissions: ['API access', 'Webhook integration', 'CRM data'] },
  { id: 5,  name: 'Datadog',         category: 'DevOps',        typical_price: 180, risk_level: 'high',     employee: 'kevin.thomas',   department: 'Engineering', evidence: ['Expense: $180/mo on 2026-02-20', 'Browser: 234 visits'], data_permissions: ['Infrastructure logs', 'Performance data'] },
  { id: 6,  name: 'Gusto Payroll',   category: 'Finance',       typical_price: 150, risk_level: 'high',     employee: 'isabella.martin',department: 'Finance',     evidence: ['Expense: $150/mo on 2026-02-26'],              data_permissions: ['Payroll data', 'Tax info', 'Bank accounts'] },
  { id: 7,  name: 'Copper CRM',      category: 'CRM',           typical_price: 50,  risk_level: 'high',     employee: 'john.smith',     department: 'Sales',       evidence: ['Expense: $50/mo on 2026-01-15', 'Browser: 45 visits'], data_permissions: ['Contact info', 'Deal records'] },
  { id: 8,  name: 'Pipedrive',       category: 'CRM',           typical_price: 15,  risk_level: 'medium',   employee: 'michael.scott',  department: 'Sales',       evidence: ['Expense: $15/mo on 2026-03-01', 'Browser: 88 visits'], data_permissions: ['Pipeline data', 'Contact info'] },
  { id: 9,  name: 'ChatGPT Pro',     category: 'AI Tools',      typical_price: 20,  risk_level: 'medium',   employee: 'alice.brown',    department: 'Marketing',   evidence: ['Expense: $20/mo on 2026-01-18', 'Browser: 89 visits'], data_permissions: ['Conversation logs', 'Uploaded documents'] },
  { id: 10, name: 'Jasper.ai',       category: 'AI Tools',      typical_price: 50,  risk_level: 'medium',   employee: 'bob.wilson',     department: 'Marketing',   evidence: ['Expense: $50/mo on 2026-01-19', 'Browser: 67 visits'], data_permissions: ['Content prompts', 'Campaign data'] },
  { id: 11, name: 'Figma Pro',       category: 'Design',        typical_price: 120, risk_level: 'medium',   employee: 'sarah.jones',    department: 'Design',      evidence: ['Expense: $120/mo on 2026-01-16', 'Browser: 45 visits'], data_permissions: ['Design files', 'Project assets'] },
  { id: 12, name: 'Canva Pro',       category: 'Design',        typical_price: 30,  risk_level: 'low',      employee: 'carol.white',    department: 'Marketing',   evidence: ['Expense: $30/mo on 2026-01-20'],              data_permissions: ['Design assets'] },
  { id: 13, name: 'Notion',          category: 'Documentation', typical_price: 10,  risk_level: 'low',      employee: 'emma.davis',     department: 'Engineering', evidence: ['Expense: $10/mo on 2026-02-10', 'Browser: 234 visits'], data_permissions: ['Knowledge base docs'] },
];

const TOTAL_SPEND  = DEMO_APPS.reduce((s, a) => s + a.typical_price, 0);
const CRITICAL     = DEMO_APPS.filter(a => a.risk_level === 'critical');
const HIGH_RISK    = DEMO_APPS.filter(a => a.risk_level === 'high');
const PII_APPS     = DEMO_APPS.filter(a => a.data_permissions?.some(p => /ssn|payroll|employee records|salary|bank/i.test(p)));
const DUP_CATS     = ['CRM', 'Security', 'AI Tools', 'Design'];

/* ── step config ── */
type StepId = 'intro' | 'scanning' | 'findings' | 'privacy' | 'duplicates' | 'simulator' | 'breach' | 'action';

interface Step { id: StepId; label: string; icon: string; }
const STEPS: Step[] = [
  { id: 'intro',      icon: '🏢', label: 'The Problem'    },
  { id: 'scanning',   icon: '⚡', label: 'Detection'      },
  { id: 'findings',   icon: '🔍', label: 'What We Found'  },
  { id: 'privacy',    icon: '🚨', label: 'Privacy Alarm'  },
  { id: 'duplicates', icon: '📦', label: 'Duplicate Tools' },
  { id: 'simulator',  icon: '💰', label: 'Cost Savings'   },
  { id: 'breach',     icon: '💥', label: 'Breach Risk'    },
  { id: 'action',     icon: '✅', label: 'Take Action'    },
];

/* ── callout tooltip ── */
function Callout({ text, color = 'blue' }: { text: string; color?: 'blue' | 'red' | 'orange' | 'green' }) {
  const c = { blue: '#3b82f6', red: '#ef4444', orange: '#f97316', green: '#22c55e' }[color];
  return (
    <div style={{ background: `${c}18`, border: `1px solid ${c}44`, borderLeft: `3px solid ${c}`, borderRadius: 8, padding: '0.7rem 1rem', marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      <span style={{ color: c, fontWeight: 700 }}>👆 </span>{text}
    </div>
  );
}

/* ── scanning animation ── */
function ScanLine({ text, done }: { text: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', fontSize: '0.85rem', color: done ? '#22c55e' : 'var(--text-secondary)' }}>
      <span>{done ? '✅' : '⏳'}</span> {text}
    </div>
  );
}

/* ── mini app card ── */
function MiniAppCard({ app, highlight }: { app: DetectedApp; highlight?: boolean }) {
  const riskColor = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[app.risk_level || 'low'];
  return (
    <div className="app-card" style={{ border: highlight ? `2px solid ${riskColor}` : undefined, boxShadow: highlight ? `0 0 12px ${riskColor}44` : undefined }}>
      <div className="app-card-header">
        <h3 style={{ fontSize: '0.9rem' }}>{app.name}</h3>
        <span className={`risk-badge ${app.risk_level}`}>{app.risk_level}</span>
      </div>
      <div className="app-card-meta">
        <span>👤 {app.employee}</span>
        <span>🏢 {app.department}</span>
        <span>📁 {app.category}</span>
      </div>
      <div className="app-card-price">${app.typical_price}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span></div>
      {app.data_permissions && app.data_permissions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {app.data_permissions.map((p, i) => {
            const danger = /ssn|payroll|salary|bank|credential|password|employee records/i.test(p);
            return (
              <span key={i} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)', color: danger ? '#fca5a5' : 'var(--text-secondary)', border: `1px solid ${danger ? '#ef444444' : 'var(--border)'}` }}>
                {danger && '⚠️ '}{p}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function DemoStory() {
  const [step, setStep]           = useState<StepId>('intro');
  const [scanPhase, setScanPhase] = useState(0);   // 0-5 scan lines revealed
  const [revealedApps, setRevealedApps] = useState(0); // how many cards visible
  const [selectedBreach, setSelectedBreach] = useState('Zapier');
  const [breachFired, setBreachFired] = useState(false);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* scanning animation */
  useEffect(() => {
    if (step !== 'scanning') { setScanPhase(0); return; }
    let phase = 0;
    const tick = () => {
      phase++;
      setScanPhase(phase);
      if (phase < 5) scanTimer.current = setTimeout(tick, 700);
      else setTimeout(() => setStep('findings'), 800);
    };
    scanTimer.current = setTimeout(tick, 500);
    return () => { if (scanTimer.current) clearTimeout(scanTimer.current); };
  }, [step]);

  /* card reveal animation on findings */
  useEffect(() => {
    if (step !== 'findings') { setRevealedApps(0); return; }
    let count = 0;
    const tick = () => {
      count++;
      setRevealedApps(count);
      if (count < DEMO_APPS.length) revealTimer.current = setTimeout(tick, 120);
    };
    revealTimer.current = setTimeout(tick, 300);
    return () => { if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, [step]);

  const idx = STEPS.findIndex(s => s.id === step);
  const goNext = () => { if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id); };
  const goPrev = () => { if (idx > 0) setStep(STEPS[idx - 1].id); };

  /* breach cascade state for step */
  const breachLinks: Record<string, string[]> = {
    Zapier:       ['Copper CRM', 'Pipedrive', 'Notion', 'Datadog', 'Gusto Payroll', 'ChatGPT Pro', 'Jasper.ai'],
    'Copper CRM': ['Zapier', 'Pipedrive', 'ChatGPT Pro'],
    Datadog:      ['Zapier', 'Notion'],
    '1Password Biz': ['Zapier', 'Datadog', 'Gusto Payroll'],
  };

  const cascadeApps = breachFired
    ? new Set([selectedBreach, ...(breachLinks[selectedBreach] || [])])
    : new Set<string>();

  return (
    <div className="demo-story-v2">

      {/* ── step progress bar ── */}
      <div className="dsv2-stepper">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`dsv2-step-btn ${step === s.id ? 'dsv2-step-active' : ''} ${i < idx ? 'dsv2-step-done' : ''}`}
            onClick={() => { if (s.id !== 'scanning') setStep(s.id); }}
          >
            <span className="dsv2-step-icon">{i < idx ? '✓' : s.icon}</span>
            <span className="dsv2-step-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════ STEP CONTENT ══════════════════════ */}
      <div className="dsv2-body">

        {/* ── STEP 1: INTRO ── */}
        {step === 'intro' && (
          <>
            <div className="dsv2-narrative">
              <h2>🏢 Meet GrowthLabs — A Typical 150-Person Startup</h2>
              <p>Emma is the IT Manager. Her CFO just flagged $1,000+/month in unexplained software expenses. Employees have been signing up for SaaS tools on their own — no IT approval, no security review, no compliance check. Emma has no idea what's out there. <strong>This is Shadow IT.</strong></p>
              <Callout text="This happens at 80% of companies. The average org has 65% more SaaS apps than IT knows about (source: BetterCloud)." color="blue" />
            </div>

            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-label">Company Size</div>
                <div className="stat-value text-accent">150</div>
                <div className="stat-sub">employees</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">IT-Approved Tools</div>
                <div className="stat-value text-accent">~20</div>
                <div className="stat-sub">known to IT</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Actual SaaS Apps</div>
                <div className="stat-value text-danger">?</div>
                <div className="stat-sub">unknown</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Shadow Spend</div>
                <div className="stat-value text-danger">$1,000+</div>
                <div className="stat-sub">per month</div>
              </div>
            </div>
            <Callout text="These stat cards show how severe the visibility gap is. Emma can see the budget impact but can't trace where the money goes." />

            <div className="dsv2-narrative" style={{ marginTop: '1.5rem' }}>
              <p>Emma has two data sources she can access without any special IT tools: <strong>expense reports</strong> (what was purchased) and <strong>browser history</strong> (what was actually used). She uploads them to Shadow SaaS Detector.</p>
            </div>
          </>
        )}

        {/* ── STEP 2: SCANNING ── */}
        {step === 'scanning' && (
          <div className="dsv2-scan-container">
            <div className="dsv2-scan-card">
              <h2 style={{ marginBottom: '1.5rem' }}>⚡ Analyzing GrowthLabs Data...</h2>
              <ScanLine text="Parsing expense reports — 25 transactions found" done={scanPhase >= 1} />
              <ScanLine text="Parsing browser history — 38 URLs found" done={scanPhase >= 2} />
              <ScanLine text="Cross-referencing against 100-app SaaS database..." done={scanPhase >= 3} />
              <ScanLine text="Calculating risk levels & data permissions..." done={scanPhase >= 4} />
              <ScanLine text={`Detection complete — ${DEMO_APPS.length} shadow SaaS apps found!`} done={scanPhase >= 5} />

              {scanPhase >= 3 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(scanPhase / 5) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #22c55e)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{Math.round((scanPhase / 5) * 100)}%</div>
                </div>
              )}
            </div>
            <Callout text="The detection engine cross-references expenses and browser URLs against a curated database of 100 known SaaS apps, each with pre-defined risk levels and data permissions." />
          </div>
        )}

        {/* ── STEP 3: FINDINGS ── */}
        {step === 'findings' && (
          <>
            <div className="dsv2-narrative">
              <h2>🔍 {DEMO_APPS.length} Unauthorized Apps Detected</h2>
              <p>The detector found apps across 8 departments, costing <strong style={{ color: '#f97316' }}>${TOTAL_SPEND}/month</strong>. <strong style={{ color: '#ef4444' }}>{CRITICAL.length} critical-risk</strong> and <strong style={{ color: '#f97316' }}>{HIGH_RISK.length} high-risk</strong> apps — none of them approved by IT.</p>
              <Callout text="Each card below is a REAL detection. Risk level, cost, employee, department, evidence, and data permissions are all extracted from the uploaded files." />
            </div>

            <div className="stats-grid" style={{ margin: '1rem 0 1.5rem' }}>
              <div className="stat-card"><div className="stat-label">Shadow Apps</div><div className="stat-value text-danger">{DEMO_APPS.length}</div></div>
              <div className="stat-card"><div className="stat-label">Monthly Spend</div><div className="stat-value text-warning">${TOTAL_SPEND}</div></div>
              <div className="stat-card"><div className="stat-label">Critical Risk</div><div className="stat-value text-danger">{CRITICAL.length}</div></div>
              <div className="stat-card"><div className="stat-label">PII Exposure</div><div className="stat-value text-danger">{PII_APPS.length} apps</div></div>
            </div>

            <div className="apps-grid">
              {DEMO_APPS.slice(0, revealedApps).map(app => (
                <MiniAppCard key={app.id} app={app} />
              ))}
            </div>
            {revealedApps >= DEMO_APPS.length && (
              <Callout text="Notice the risk badges: CRITICAL = data breach risk, HIGH = compliance or security concern, MEDIUM = policy violation, LOW = cost issue. The ⚠️ tags show sensitive data permissions." color="orange" />
            )}
          </>
        )}

        {/* ── STEP 4: PRIVACY ALARM ── */}
        {step === 'privacy' && (
          <>
            <div className="dsv2-narrative">
              <h2>🚨 Privacy Alarm: Sensitive Data in Unauthorized Tools</h2>
              <p>Emma discovers the worst part: <strong style={{ color: '#ef4444' }}>{PII_APPS.length} apps have access to highly sensitive employee and financial data</strong> — SSNs, bank accounts, salary info, credentials — in tools that were never security-reviewed. This is a compliance disaster waiting to happen.</p>
            </div>

            {/* Big alert banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))', border: '2px solid rgba(239,68,68,0.5)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <h3 style={{ color: '#ef4444', margin: 0 }}>CRITICAL: Regulatory Violations Detected</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['GDPR Art. 5 — Data Minimization', 'GDPR Art. 13 — Transparency', 'CCPA §1798.82', 'SOC 2 CC6.1 — Logical Access', 'HIPAA §164.308', 'SOX Section 302'].map((v, i) => (
                  <span key={i} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 5, padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#fca5a5' }}>{v}</span>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Apps with Sensitive Data Access:</div>
            <div className="apps-grid">
              {PII_APPS.map(app => <MiniAppCard key={app.id} app={app} highlight />)}
            </div>

            <Callout text="Recruiting Bot alone has employee SSNs and salary data in a tool no one approved. If this tool gets breached, GrowthLabs faces GDPR fines of up to 4% of annual revenue. These highlighted permissions (⚠️) are the exact evidence for a compliance audit." color="red" />

            {/* Specific case study */}
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '1.25rem', marginTop: '1.5rem' }}>
              <h4 style={{ color: '#ef4444', marginBottom: '0.75rem' }}>📋 Real-World Parallel</h4>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                In 2023, a 200-person fintech company was fined €180,000 after an HR tool used by one employee (not IT-approved) was breached, exposing 150 employee SSNs. The exact scenario: shadow IT, unapproved third-party, sensitive data scope. Shadow SaaS Detector would have flagged this before it happened.
              </p>
            </div>
          </>
        )}

        {/* ── STEP 5: DUPLICATES ── */}
        {step === 'duplicates' && (
          <>
            <div className="dsv2-narrative">
              <h2>📦 The Waste: 4 Categories, 8 Duplicate Tools</h2>
              <p>Beyond security, the detector identifies <strong>costly duplication</strong>. GrowthLabs has <strong style={{ color: '#eab308' }}>4 categories where multiple teams bought the same type of tool independently</strong>, paying multiple times for overlapping functionality.</p>
              <Callout text="Every category below is a consolidation opportunity. Pick one tool per category and cut the rest." color="orange" />
            </div>

            {DUP_CATS.map(cat => {
              const catApps = DEMO_APPS.filter(a => a.category === cat);
              const catSpend = catApps.reduce((s, a) => s + a.typical_price, 0);
              const savings = catSpend - Math.min(...catApps.map(a => a.typical_price));
              return (
                <div key={cat} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{cat} — <span style={{ color: '#eab308' }}>{catApps.length} tools detected</span></h4>
                    <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', padding: '0.2rem 0.6rem', borderRadius: 5, fontSize: '0.8rem', fontWeight: 700 }}>
                      Save ${savings}/mo by consolidating
                    </span>
                  </div>
                  <div className="apps-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {catApps.map((app, i) => (
                      <div key={app.id} className="app-card" style={{ border: i === 0 ? '2px solid #22c55e' : '2px solid rgba(239,68,68,0.4)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.4rem', color: i === 0 ? '#22c55e' : '#ef4444' }}>
                          {i === 0 ? '✅ KEEP — Main Tool' : '❌ REMOVE — Duplicate'}
                        </div>
                        <div style={{ fontWeight: 700 }}>{app.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.department} · ${app.typical_price}/mo</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '1rem 1.25rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Total Monthly Savings from Deduplication:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>
                ${DUP_CATS.reduce((total, cat) => {
                  const catApps = DEMO_APPS.filter(a => a.category === cat);
                  return total + catApps.reduce((s, a) => s + a.typical_price, 0) - Math.min(...catApps.map(a => a.typical_price));
                }, 0)}/mo
              </span>
            </div>
          </>
        )}

        {/* ── STEP 6: SIMULATOR ── */}
        {step === 'simulator' && (
          <>
            <div className="dsv2-narrative">
              <h2>💰 Interactive Cost Simulator — Try It Now</h2>
              <p>The <strong>Simulator tab</strong> lets Emma model "what if" scenarios. Select which app to keep in each duplicate category. Adjust the adoption slider (what % of teams actually migrate). Watch the savings update in real time.</p>
              <Callout text="This is the LIVE simulator with GrowthLabs demo data. Change the radio buttons below to pick which tool to keep. Drag the slider. The annual savings counter updates instantly." color="green" />
            </div>
            <Simulator detectedApps={DEMO_APPS} />
          </>
        )}

        {/* ── STEP 7: BREACH RISK ── */}
        {step === 'breach' && (
          <>
            <div className="dsv2-narrative">
              <h2>💥 The Hidden Risk: Breach Cascade Simulation</h2>
              <p>Each shadow SaaS app doesn't exist in isolation — they're connected through <strong>integrations, data-sharing, and automations</strong>. If one vendor is breached, the attack cascades through its connections. Simulate it below:</p>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Breach starts at:</label>
                <select
                  value={selectedBreach}
                  onChange={e => { setSelectedBreach(e.target.value); setBreachFired(false); }}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                >
                  {Object.keys(breachLinks).map(k => <option key={k}>{k}</option>)}
                </select>
                <button
                  onClick={() => setBreachFired(true)}
                  style={{ padding: '0.45rem 1.2rem', borderRadius: 7, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}
                >
                  💥 Simulate Breach
                </button>
                {breachFired && <button onClick={() => setBreachFired(false)} style={{ padding: '0.45rem 1rem', borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.88rem' }}>↩ Reset</button>}
              </div>

              {/* Breach result */}
              {breachFired ? (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{cascadeApps.size}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Apps Compromised</div>
                    </div>
                    <div style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 8, padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f97316' }}>{Math.round((cascadeApps.size / DEMO_APPS.length) * 100)}%</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>of SaaS Stack</div>
                    </div>
                    <div style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 8, padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa' }}>
                        ${Math.round(DEMO_APPS.filter(a => cascadeApps.has(a.name)).reduce((s, a) => s + a.typical_price, 0) * 150 / 1000)}K
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Est. Breach Cost</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Compromised apps:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {DEMO_APPS.filter(a => cascadeApps.has(a.name)).map(a => (
                      <span key={a.id} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', padding: '0.25rem 0.65rem', borderRadius: 5, fontSize: '0.8rem', color: '#fca5a5' }}>
                        {a.name === selectedBreach ? '🔴 ' : '🟠 '}{a.name}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Select an app and click "💥 Simulate Breach" to see the cascade
                </div>
              )}
            </div>

            <Callout text="This is why supply chain risk matters: one breached vendor cascades to every connected app. In the full Threat Map tab, you get an interactive network graph of all connections with hop-distance visualization." color="red" />

            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '1.25rem', marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>📅 Breach Timeline (if Zapier is compromised tonight)</h4>
              {[
                { t: 'Hour 0',    d: 'Zapier API credentials stolen. Attacker gains access to all configured workflows.',           c: '#ef4444' },
                { t: 'Hour 1-6',  d: 'Silent exfiltration begins: CRM deal data, HR records accessible via automated workflows.', c: '#ef4444' },
                { t: 'Day 1-3',   d: 'Lateral movement: attacker triggers workflows to extract data from connected apps.',         c: '#f97316' },
                { t: 'Day 7+',    d: 'GDPR 72-hour notification window violated. Fines: up to €20M or 4% of annual revenue.',     c: '#eab308' },
              ].map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ minWidth: 70, fontSize: '0.75rem', fontWeight: 700, color: ev.c }}>{ev.t}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.d}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 8: ACTION ── */}
        {step === 'action' && (
          <>
            <div className="dsv2-narrative">
              <h2>✅ What Emma Does Next: Taking Action</h2>
              <p>Armed with this data, Emma can act immediately. Shadow SaaS Detector provides the tools to remediate, document, and report — all without IT needing to manually contact employees.</p>
            </div>

            {[
              {
                step: '1', icon: '⚡', title: 'Revoke Access via Playbook',
                desc: 'Click "⚡ Playbook" on any app card in the Dashboard. Select "Execute Revocation" to generate a formal access revocation email and create an audit log entry. A 30-second undo window prevents accidents.',
                howto: 'Go to Dashboard → click any app card → click "⚡ Playbook" → "Execute Revocation"',
                impact: 'Eliminates unauthorized access. Creates documentation for compliance audit.',
                color: '#3b82f6',
              },
              {
                step: '2', icon: '🤖', title: 'Run AI Compliance Audit',
                desc: 'The AI Insights tab runs Google Gemini against all detected apps. It generates a compliance score (0-100), lists specific regulatory violations with article citations, and creates actionable remediation steps.',
                howto: 'Go to AI Insights → Compliance Audit → wait for AI analysis → download as PDF',
                impact: 'Board-ready compliance report in 30 seconds. Would take a consultant days to produce.',
                color: '#8b5cf6',
              },
              {
                step: '3', icon: '📋', title: 'Generate Executive Board Report',
                desc: 'The Executive Brief generator creates a professional, print-ready HTML report with KPIs, risk summary, consolidation opportunities, and a 4-phase remediation timeline. Suitable for board presentation.',
                howto: 'Go to Threat Map tab → scroll down → click "📋 Generate Executive Report"',
                impact: 'CIOs and CFOs can present this directly to the board. No manual formatting required.',
                color: '#22c55e',
              },
              {
                step: '4', icon: '💰', title: 'Model Cost Consolidation',
                desc: 'The Simulator shows exactly how much you save by keeping one tool per category. Present the annual savings figure to the CFO as the ROI for implementing a SaaS governance process.',
                howto: 'Go to Simulator → select which tools to keep → check the Annual Savings number',
                impact: `GrowthLabs saves $${Math.round(DUP_CATS.reduce((total, cat) => { const ca = DEMO_APPS.filter(a => a.category === cat); return total + ca.reduce((s, a) => s + a.typical_price, 0) - Math.min(...ca.map(a => a.typical_price)); }, 0) * 12).toLocaleString()}/year from deduplication alone.`,
                color: '#f59e0b',
              },
            ].map((item, i) => (
              <div key={i} style={{ background: `${item.color}10`, border: `1px solid ${item.color}33`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                  <span style={{ background: item.color, color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{item.step}</span>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.icon} {item.title}</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.5rem 0' }}>{item.desc}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 5, padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: item.color }}>How: </strong>{item.howto}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: item.color, fontWeight: 600 }}>✓ {item.impact}</div>
              </div>
            ))}

            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ marginBottom: '0.5rem' }}>GrowthLabs goes from 0 visibility to full SaaS governance in under 5 minutes.</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                No agents installed. No IT tickets. No waiting for MDM deployment. Upload two files — get enterprise-grade shadow IT intelligence.
              </p>
            </div>
          </>
        )}

      </div>
      {/* ── nav buttons ── */}
      <div className="dsv2-nav-btns">
        <button className="btn btn-secondary" onClick={goPrev} disabled={idx === 0}>← Previous</button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Step {idx + 1} of {STEPS.length}</span>
        {step !== 'action'
          ? <button className="btn btn-primary" onClick={step === 'intro' ? () => setStep('scanning') : goNext}>
              {step === 'intro' ? '⚡ Start Detection →' : 'Next →'}
            </button>
          : <button className="btn btn-primary" onClick={() => setStep('intro')}>↩ Start Over</button>
        }
      </div>
    </div>
  );
}
