import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadFiles, getSlackApps, type DetectedApp } from '../services/api';
import PlaybookModal from './PlaybookModal';
import DashboardCharts from './DashboardCharts';
import { showToast } from '../services/toast';
import useCountUp from '../hooks/useCountUp';

interface DashboardProps {
  detectedApps: DetectedApp[];
  setDetectedApps: React.Dispatch<React.SetStateAction<DetectedApp[]>>;
  revokedApps: Set<string | number>;
  setRevokedApps: React.Dispatch<React.SetStateAction<Set<string | number>>>;
}

type ConnectStep = 'idle' | 'connecting' | 'scanning' | 'done';
type ConnectSource = 'google' | 'microsoft' | 'expense' | null;

const mergeDetectedApps = (baseApps: DetectedApp[], incomingApps: DetectedApp[]): DetectedApp[] => {
  const merged = new Map<string, DetectedApp>();

  for (const app of baseApps) {
    const key = `${app.source || 'upload'}:${app.name.toLowerCase()}`;
    merged.set(key, app);
  }

  for (const app of incomingApps) {
    const key = `${app.source || 'upload'}:${app.name.toLowerCase()}`;
    if (!merged.has(key)) {
      merged.set(key, app);
    }
  }

  return Array.from(merged.values());
};

export default function Dashboard({
  detectedApps,
  setDetectedApps,
  revokedApps,
  setRevokedApps,
}: DashboardProps) {
  const [expensesFile, setExpensesFile] = useState<File | null>(null);
  const [browserFile, setBrowserFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DetectedApp | null>(null);
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [connectStep, setConnectStep] = useState<ConnectStep>('idle');
  const [connectSource, setConnectSource] = useState<ConnectSource>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const expRef = useRef<HTMLInputElement>(null);
  const brRef = useRef<HTMLInputElement>(null);

  const fetchSlackAppsSafe = useCallback(async (): Promise<DetectedApp[]> => {
    try {
      return await getSlackApps();
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack') !== 'connected') return;

    fetchSlackAppsSafe().then((slackApps) => {
      if (slackApps.length > 0) {
        setDetectedApps((prev) => mergeDetectedApps(prev, slackApps));
        showToast(`Connected Slack Workspace — found ${slackApps.length} installed apps`, 'success');
      }
    });

    params.delete('slack');
    const next = params.toString();
    const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [fetchSlackAppsSafe, setDetectedApps]);

  const handleUpload = async () => {
    if (!expensesFile && !browserFile) {
      showToast('Please select at least one file', 'error');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadFiles(expensesFile, browserFile);
      const slackApps = await fetchSlackAppsSafe();
      setDetectedApps(mergeDetectedApps(res.detectedApps, slackApps));
      showToast(`Detected ${res.totalApps} shadow SaaS apps!`, 'success');
    } catch (err) {
      showToast('Upload failed. Check your files and try again.', 'error');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Fake OAuth connect flow — loads demo data under the hood
  const handleConnect = useCallback(async (source: ConnectSource) => {
    setConnectSource(source);
    setConnectStep('connecting');
    setScanProgress(0);

    // Simulate OAuth handshake delay
    await new Promise((r) => setTimeout(r, 1200));
    setConnectStep('scanning');
    showToast(`Connected to ${source === 'google' ? 'Google Workspace' : source === 'microsoft' ? 'Microsoft 365' : 'Expense System'}!`, 'success');

    // Animate scan progress
    for (let p = 0; p <= 100; p += 4) {
      setScanProgress(p);
      await new Promise((r) => setTimeout(r, 60));
    }
    setScanProgress(100);

    try {
      // Load demo data behind the scenes
      const [expRes, brRes] = await Promise.all([
        fetch('/test_data/expenses.csv'),
        fetch('/test_data/browser_history.json'),
      ]);
      const expBlob = await expRes.blob();
      const brBlob = await brRes.blob();
      const expFile = new File([expBlob], 'expenses.csv', { type: 'text/csv' });
      const brFile = new File([brBlob], 'browser_history.json', { type: 'application/json' });

      const result = await uploadFiles(expFile, brFile);
      const slackApps = await fetchSlackAppsSafe();
      setDetectedApps(mergeDetectedApps(result.detectedApps, slackApps));
      setConnectStep('done');
      showToast(`🔍 Scanned ${source === 'google' ? 'Google Workspace' : source === 'microsoft' ? 'Microsoft 365' : 'Expense System'} — found ${result.totalApps} shadow SaaS apps!`, 'success');
    } catch (err) {
      showToast('Connection failed. Start backend and try again.', 'error');
      console.error(err);
      setConnectStep('idle');
    }
  }, [setDetectedApps, fetchSlackAppsSafe]);

  const handleRevoked = (appId: string | number) => {
    setRevokedApps((prev) => new Set(prev).add(appId));
  };

  const handleUndone = (appId: string | number) => {
    setRevokedApps((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
  };

  const totalSpend = detectedApps.reduce((s, a) => s + a.typical_price, 0);
  const highRiskCount = detectedApps.filter(
    (a) => a.risk_level === 'high' || a.risk_level === 'critical'
  ).length;
  const categoryCount = new Set(detectedApps.map((a) => a.category)).size;
  const departmentCount = new Set(detectedApps.map((a) => a.department).filter(Boolean)).size;

  const animatedTotalApps = useCountUp(detectedApps.length, {
    duration: 1500,
    enabled: detectedApps.length > 0,
  });
  const animatedTotalSpend = useCountUp(totalSpend, {
    duration: 1500,
    enabled: detectedApps.length > 0,
  });
  const animatedHighRisk = useCountUp(highRiskCount, {
    duration: 1500,
    enabled: detectedApps.length > 0,
  });
  const animatedCategories = useCountUp(categoryCount, {
    duration: 1500,
    enabled: detectedApps.length > 0,
  });

  const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString()}`;

  return (
    <div>
      {/* Connect Your Tools Section */}
      {detectedApps.length === 0 && (
        <div data-testid="upload-section">
          {/* OAuth-style Integration Connect */}
          <div className="connect-section">
            <div className="connect-header">
              <h2>🔗 Connect Your Tools</h2>
              <p>Link your organization's platforms to automatically discover shadow SaaS across all employees</p>
            </div>

            {connectStep === 'idle' && (
              <>
                <div className="integrations-grid">
                  <button className="integration-card" onClick={() => handleConnect('google')} data-testid="connect-google">
                    <div className="integration-icon">
                      <svg viewBox="0 0 24 24" width="32" height="32">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="integration-info">
                      <strong>Google Workspace</strong>
                      <span>Scan Gmail, Drive, Calendar & OAuth apps</span>
                    </div>
                    <span className="connect-arrow">→</span>
                  </button>

                  <button className="integration-card" onClick={() => handleConnect('microsoft')} data-testid="connect-microsoft">
                    <div className="integration-icon">
                      <svg viewBox="0 0 24 24" width="32" height="32">
                        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                        <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                        <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                        <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                      </svg>
                    </div>
                    <div className="integration-info">
                      <strong>Microsoft 365</strong>
                      <span>Scan Outlook, OneDrive, Teams & Azure AD</span>
                    </div>
                    <span className="connect-arrow">→</span>
                  </button>

                  <button className="integration-card" onClick={() => handleConnect('expense')} data-testid="connect-expense">
                    <div className="integration-icon">
                      <div style={{ fontSize: '2rem', lineHeight: 1 }}>💳</div>
                    </div>
                    <div className="integration-info">
                      <strong>Expense System</strong>
                      <span>Connect Brex, Ramp, Expensify, or corporate cards</span>
                    </div>
                    <span className="connect-arrow">→</span>
                  </button>

                  <a className="integration-card" href="/api/slack/auth" data-testid="connect-slack">
                    <div className="integration-icon">
                      <div style={{ fontSize: '2rem', lineHeight: 1 }}>💬</div>
                    </div>
                    <div className="integration-info">
                      <strong>Connect Slack Workspace</strong>
                      <span>Authorize Slack and import installed apps live</span>
                    </div>
                    <span className="connect-arrow">→</span>
                  </a>
                </div>

                <div className="connect-divider">
                  <span>or upload files manually</span>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowManualUpload(!showManualUpload)}
                  style={{ margin: '0 auto', display: 'block' }}
                >
                  {showManualUpload ? '▲ Hide Manual Upload' : '▼ Manual CSV/JSON Upload'}
                </button>

                {showManualUpload && (
                  <div className="manual-upload-area">
                    <div className="upload-controls">
                      <div className="file-input-wrapper">
                        <input
                          ref={expRef}
                          type="file"
                          accept=".csv"
                          id="expenses-file"
                          data-testid="expenses-input"
                          onChange={(e) => setExpensesFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="expenses-file" className="file-label">
                          📄 {expensesFile ? <span className="file-name">{expensesFile.name}</span> : 'Expenses CSV'}
                        </label>
                      </div>

                      <div className="file-input-wrapper">
                        <input
                          ref={brRef}
                          type="file"
                          accept=".json"
                          id="browser-file"
                          data-testid="browser-input"
                          onChange={(e) => setBrowserFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="browser-file" className="file-label">
                          🌐 {browserFile ? <span className="file-name">{browserFile.name}</span> : 'Browser History JSON'}
                        </label>
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={uploading || (!expensesFile && !browserFile)}
                        data-testid="upload-btn"
                      >
                        {uploading ? '🔍 Analyzing...' : '🚀 Detect Shadow SaaS'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Connecting / Scanning animation */}
            {(connectStep === 'connecting' || connectStep === 'scanning') && (
              <div className="connect-progress">
                <div className="connect-progress-icon">
                  {connectStep === 'connecting' ? (
                    <div className="pulse-ring">🔐</div>
                  ) : (
                    <div className="pulse-ring">🔍</div>
                  )}
                </div>
                <h3>
                  {connectStep === 'connecting'
                    ? `Authenticating with ${connectSource === 'google' ? 'Google Workspace' : connectSource === 'microsoft' ? 'Microsoft 365' : 'Expense System'}…`
                    : 'Scanning organization for shadow SaaS…'}
                </h3>
                {connectStep === 'scanning' && (
                  <div className="scan-progress-bar">
                    <div className="scan-progress-fill" style={{ width: `${scanProgress}%` }} />
                  </div>
                )}
                <p className="connect-sub">
                  {connectStep === 'connecting'
                    ? 'Establishing secure OAuth 2.0 connection…'
                    : `Analyzing OAuth tokens, email receipts, SSO logs… ${scanProgress}%`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {detectedApps.length > 0 && (
        <>
          <div className="stats-grid" data-testid="stats-grid">
            <div className="stat-card stat-card-highlight">
              <div className="stat-label">Total Apps Detected</div>
              <div className="stat-value text-accent">{animatedTotalApps}</div>
              <div className="stat-sub">across {departmentCount} departments</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Monthly Shadow Spend</div>
              <div className="stat-value text-warning">{formatCurrency(animatedTotalSpend)}</div>
              <div className="stat-sub">{formatCurrency(totalSpend * 12)}/yr projected</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">High / Critical Risk</div>
              <div className="stat-value text-danger">{animatedHighRisk}</div>
              <div className="stat-sub">require immediate action</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Categories</div>
              <div className="stat-value text-success">{animatedCategories}</div>
              <div className="stat-sub">tool categories found</div>
            </div>
          </div>

          {/* Interactive Charts */}
          <DashboardCharts detectedApps={detectedApps} />

          {/* App Cards */}
          <div className="section-header">
            <h2>🔍 Detected Shadow SaaS</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setDetectedApps([]);
                setRevokedApps(new Set());
                setConnectStep('idle');
                setConnectSource(null);
                setShowManualUpload(false);
                if (expRef.current) expRef.current.value = '';
                if (brRef.current) brRef.current.value = '';
                setExpensesFile(null);
                setBrowserFile(null);
              }}
            >
              ↻ New Scan
            </button>
          </div>

          <div className="apps-grid" data-testid="apps-grid">
            {detectedApps.map((app) => (
              <div
                key={app.id}
                className={`app-card ${revokedApps.has(app.id) ? 'revoked' : ''}`}
                data-testid={`app-card-${app.id}`}
              >
                <div className="app-card-header">
                  <h3>
                    {app.name}
                    {app.source === 'slack-live' && <span className="app-live-badge">Live</span>}
                  </h3>
                  <span className={`risk-badge ${app.risk_level || 'low'}`}>
                    {app.risk_level || 'unknown'}
                  </span>
                </div>

                <div className="app-card-meta">
                  <span>📁 {app.category}</span>
                  {app.employee && <span>👤 {app.employee}</span>}
                  {app.department && <span>🏢 {app.department}</span>}
                </div>

                <div className="app-card-price">${app.typical_price}/mo</div>

                {app.data_permissions && app.data_permissions.length > 0 && (
                  <div className="permissions-list" style={{ marginBottom: '0.75rem' }}>
                    {app.data_permissions.map((p) => (
                      <span key={p} className="permission-tag">{p}</span>
                    ))}
                  </div>
                )}

                <div className="app-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedApp(app)}
                    data-testid={`playbook-btn-${app.id}`}
                    disabled={revokedApps.has(app.id)}
                  >
                    🛡️ Playbook
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Playbook Modal */}
      {selectedApp && (
        <PlaybookModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onRevoked={handleRevoked}
          onUndone={handleUndone}
        />
      )}
    </div>
  );
}
