import { useState, useEffect } from 'react';
import {
  getAIRiskAssessment,
  getAIConsolidation,
  getAIComplianceReport,
  type DetectedApp,
  type RiskAssessmentEntry,
  type ConsolidationEntry,
  type ComplianceReport,
} from '../services/api';

interface AIInsightsProps {
  detectedApps: DetectedApp[];
}

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const SCORE_LABEL = (score: number) =>
  score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

export default function AIInsights({ detectedApps }: AIInsightsProps) {
  const [activePanel, setActivePanel] = useState<'risk' | 'consolidation' | 'compliance'>('risk');

  // Risk Assessment state
  const [riskData, setRiskData] = useState<Record<string, RiskAssessmentEntry> | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Consolidation state
  const [consolidationData, setConsolidationData] = useState<ConsolidationEntry[] | null>(null);
  const [consolidationLoading, setConsolidationLoading] = useState(false);
  const [consolidationError, setConsolidationError] = useState<string | null>(null);

  // Compliance state
  const [complianceData, setComplianceData] = useState<ComplianceReport | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Auto-load risk assessment when apps are available
  useEffect(() => {
    if (detectedApps.length > 0 && !riskData && !riskLoading) {
      loadRisk();
    }
  }, [detectedApps]);

  const loadRisk = async () => {
    setRiskLoading(true);
    setRiskError(null);
    try {
      const data = await getAIRiskAssessment(detectedApps);
      setRiskData(data);
    } catch (e) {
      setRiskError('Risk assessment failed — check backend connection.');
    } finally {
      setRiskLoading(false);
    }
  };

  const loadConsolidation = async () => {
    setConsolidationLoading(true);
    setConsolidationError(null);
    try {
      const data = await getAIConsolidation(detectedApps);
      setConsolidationData(data);
    } catch (e) {
      setConsolidationError('Consolidation analysis failed.');
    } finally {
      setConsolidationLoading(false);
    }
  };

  const loadCompliance = async () => {
    setComplianceLoading(true);
    setComplianceError(null);
    try {
      const data = await getAIComplianceReport(detectedApps);
      setComplianceData(data);
    } catch (e) {
      setComplianceError('Compliance report generation failed.');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleTabChange = (panel: typeof activePanel) => {
    setActivePanel(panel);
    if (panel === 'consolidation' && !consolidationData && !consolidationLoading) loadConsolidation();
    if (panel === 'compliance' && !complianceData && !complianceLoading) loadCompliance();
  };

  if (detectedApps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
        <p>Upload company data first to run AI analysis.</p>
      </div>
    );
  }

  return (
    <div data-testid="ai-insights">
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(
          [
            { id: 'risk', label: '🔴 Risk Assessment', desc: 'Per-app threat scoring' },
            { id: 'consolidation', label: '🎯 Smart Consolidation', desc: 'Remove duplicates' },
            { id: 'compliance', label: '📋 Compliance Audit', desc: 'GDPR / CCPA' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: '1.5px solid',
              borderColor: activePanel === t.id ? 'var(--accent)' : 'var(--border)',
              background: activePanel === t.id ? 'var(--accent)' : 'var(--card-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: activePanel === t.id ? 700 : 400,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            data-testid={`ai-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Risk Assessment Panel ── */}
      {activePanel === 'risk' && (
        <div data-testid="risk-panel">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2>🔴 AI Risk Assessment</h2>
            <button className="btn btn-secondary btn-sm" onClick={loadRisk} disabled={riskLoading}>
              {riskLoading ? '⏳ Analyzing…' : '↻ Re-run'}
            </button>
          </div>

          {riskLoading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>AI is analyzing {detectedApps.length} apps for security risks…</p>
            </div>
          )}

          {riskError && <div className="error-banner">{riskError}</div>}

          {riskData && !riskLoading && (
            <>
              {/* Summary bar */}
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {(['critical', 'high', 'medium', 'low'] as const).map((lvl) => {
                  const count = Object.values(riskData).filter((a) => a.level === lvl).length;
                  return (
                    <div key={lvl} className="stat-card">
                      <div className="stat-label">{lvl.toUpperCase()}</div>
                      <div
                        className="stat-value"
                        style={{ color: RISK_COLORS[lvl] }}
                      >
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* App risk cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {Object.entries(riskData)
                  .sort(([, a], [, b]) => b.score - a.score)
                  .map(([appName, entry]) => (
                    <div
                      key={appName}
                      className="app-card"
                      style={{ borderLeft: `3px solid ${RISK_COLORS[entry.level]}` }}
                      data-testid={`risk-card-${appName.replace(/\s+/g, '-')}`}
                    >
                      <div className="app-card-header">
                        <h3>{appName}</h3>
                        <span
                          className={`risk-badge ${entry.level}`}
                          style={{ fontWeight: 700 }}
                        >
                          {entry.score}/100
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: RISK_COLORS[entry.level],
                          fontWeight: 600,
                          marginBottom: '0.5rem',
                        }}
                      >
                        {SCORE_LABEL(entry.score)} RISK · {entry.category}
                      </div>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.5rem',
                          lineHeight: 1.5,
                        }}
                      >
                        {entry.reasoning}
                      </p>
                      {entry.mainRisks.length > 0 && (
                        <ul
                          style={{
                            margin: '0 0 0.5rem',
                            paddingLeft: '1.1rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {entry.mainRisks.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                      {entry.recommendations.length > 0 && (
                        <div
                          style={{
                            background: 'var(--success-bg, rgba(34,197,94,0.08))',
                            borderRadius: '6px',
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.78rem',
                            color: 'var(--success)',
                          }}
                        >
                          💡 {entry.recommendations[0]}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Consolidation Panel ── */}
      {activePanel === 'consolidation' && (
        <div data-testid="consolidation-panel">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2>🎯 Smart Consolidation</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadConsolidation}
              disabled={consolidationLoading}
            >
              {consolidationLoading ? '⏳ Analyzing…' : '↻ Re-run'}
            </button>
          </div>

          {consolidationLoading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>AI is finding consolidation opportunities…</p>
            </div>
          )}

          {consolidationError && <div className="error-banner">{consolidationError}</div>}

          {consolidationData && !consolidationLoading && (
            <>
              {/* Total savings banner */}
              {(() => {
                const totalAnnual = consolidationData.reduce(
                  (s, r) => s + r.estimatedSavings,
                  0
                );
                return (
                  totalAnnual > 0 && (
                    <div
                      style={{
                        background: 'rgba(34,197,94,0.1)',
                        border: '1.5px solid var(--success)',
                        borderRadius: '10px',
                        padding: '1rem 1.5rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>💰</span>
                      <div>
                        <div
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--success)',
                          }}
                        >
                          ${totalAnnual.toLocaleString()} / year
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          estimated annual savings from AI-recommended consolidation
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}

              {consolidationData.map((rec) => (
                <div
                  key={rec.category}
                  className="app-card"
                  style={{ marginBottom: '1rem' }}
                  data-testid={`consolidation-card-${rec.category}`}
                >
                  <div className="app-card-header">
                    <h3>📁 {rec.category}</h3>
                    {rec.estimatedSavings > 0 && (
                      <span
                        style={{
                          background: 'rgba(34,197,94,0.15)',
                          color: 'var(--success)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.75rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        Save ${rec.estimatedSavings.toLocaleString()}/yr
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '0.83rem',
                      color: 'var(--text-secondary)',
                      margin: '0.5rem 0 0.75rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {rec.reasoning}
                  </p>
                  {rec.keep.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {rec.keep.map((k) => (
                        <span
                          key={k}
                          style={{
                            background: 'rgba(34,197,94,0.15)',
                            color: 'var(--success)',
                            borderRadius: '6px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          ✓ Keep: {k}
                        </span>
                      ))}
                      {rec.remove.map((r) => (
                        <span
                          key={r}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          ✗ Remove: {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {consolidationData.every((r) => r.remove.length === 0) && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  ✅ No duplicate categories found — stack is already optimised.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Compliance Panel ── */}
      {activePanel === 'compliance' && (
        <div data-testid="compliance-panel">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2>📋 Compliance Audit</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadCompliance}
              disabled={complianceLoading}
            >
              {complianceLoading ? '⏳ Generating…' : '↻ Re-run'}
            </button>
          </div>

          {complianceLoading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>AI is auditing your SaaS stack for GDPR / CCPA issues…</p>
            </div>
          )}

          {complianceError && <div className="error-banner">{complianceError}</div>}

          {complianceData && !complianceLoading && (
            <>
              {/* Score header */}
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-label">Compliance Score</div>
                  <div
                    className="stat-value"
                    style={{
                      color:
                        complianceData.complianceScore >= 80
                          ? 'var(--success)'
                          : complianceData.complianceScore >= 60
                          ? '#eab308'
                          : '#ef4444',
                    }}
                    data-testid="compliance-score"
                  >
                    {complianceData.complianceScore}
                    <span style={{ fontSize: '1rem', fontWeight: 400 }}>/100</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Critical Issues</div>
                  <div className="stat-value text-danger">{complianceData.criticalIssues}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Apps Reviewed</div>
                  <div className="stat-value text-accent">{complianceData.totalApps}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Action Items</div>
                  <div className="stat-value text-warning">{complianceData.actionItems.length}</div>
                </div>
              </div>

              {/* Summary */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Summary: </strong>
                {complianceData.summary}
              </div>

              {/* Issues */}
              {complianceData.issues.length > 0 && (
                <>
                  <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>⚠️ Identified Issues</h3>
                  {complianceData.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="app-card"
                      style={{
                        marginBottom: '0.75rem',
                        borderLeft: `3px solid ${RISK_COLORS[issue.severity]}`,
                      }}
                    >
                      <div className="app-card-header">
                        <h4 style={{ fontSize: '0.9rem' }}>{issue.app}</h4>
                        <span
                          className={`risk-badge ${issue.severity}`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.25rem' }}>
                        Policy: {issue.policy}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        {issue.description}
                      </p>
                      <div
                        style={{
                          background: 'rgba(34,197,94,0.08)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.78rem',
                          color: 'var(--success)',
                        }}
                      >
                        💡 Fix: {issue.recommendation}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Action Items */}
              {complianceData.actionItems.length > 0 && (
                <>
                  <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1rem' }}>✅ Action Plan</h3>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '1.5rem',
                      fontSize: '0.88rem',
                      lineHeight: 1.9,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {complianceData.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </>
              )}

              {/* Forecast */}
              <div
                style={{
                  marginTop: '1.5rem',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>📅 12-Month Forecast: </strong>
                {complianceData.forecast12Months}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
