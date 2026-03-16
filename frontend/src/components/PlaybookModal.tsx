import { useState, useEffect } from 'react';
import {
  playbookSimulate,
  playbookUndo,
  type DetectedApp,
  type PlaybookSimulateResponse,
} from '../services/api';
import { showToast } from '../services/toast';

interface PlaybookModalProps {
  app: DetectedApp;
  onClose: () => void;
  onRevoked: (appId: string | number, revokeId: string) => void;
  onUndone: (appId: string | number) => void;
}

export default function PlaybookModal({ app, onClose, onRevoked, onUndone }: PlaybookModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlaybookSimulateResponse | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState(30);
  const [copied, setCopied] = useState(false);

  // Undo countdown
  useEffect(() => {
    if (!showUndo) return;
    if (undoTimer <= 0) {
      setShowUndo(false);
      return;
    }
    const interval = setInterval(() => setUndoTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [showUndo, undoTimer]);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await playbookSimulate(
        app.id,
        app.name,
        app.evidence || [],
        'growthlab.com',
        'demo@company.local',
        app.risk_level,
        app.data_permissions
      );
      setResult(res);
      setShowConfirm(false);
      setShowUndo(true);
      setUndoTimer(30);
      onRevoked(app.id, res.revokeId);
      showToast(`${app.name} revocation executed`, 'success');
    } catch (err) {
      showToast('Failed to execute revocation', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!result) return;
    try {
      await playbookUndo(result.revokeId, 'demo@company.local');
      setShowUndo(false);
      setResult(null);
      onUndone(app.id);
      showToast(`${app.name} revoke undone`, 'info');
    } catch (err) {
      showToast('Failed to undo revoke', 'error');
      console.error(err);
    }
  };

  const handleCopyEmail = () => {
    if (result?.emailDraft) {
      navigator.clipboard.writeText(
        `To: ${result.emailDraft.to}\nSubject: ${result.emailDraft.subject}\n\n${result.emailDraft.body}`
      );
      setCopied(true);
      showToast('Email copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" data-testid="playbook-modal">
        <div className="modal-header">
          <h2>🛡️ Playbook: {app.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="demo-banner">
            <strong>⚠️ Preview</strong>
          </div>

          {/* App Info */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>{app.name}</h3>
              <span className={`risk-badge ${app.risk_level || 'low'}`}>
                {app.risk_level || 'unknown'}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Category: {app.category} · ${app.typical_price}/mo
              {app.employee && ` · User: ${app.employee}`}
              {app.department && ` · Dept: ${app.department}`}
            </div>
          </div>

          {/* Data Permissions */}
          {app.data_permissions && app.data_permissions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                Data Access Permissions:
              </div>
              <div className="permissions-list">
                {app.data_permissions.map((p) => (
                  <span key={p} className="permission-tag">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {app.evidence && app.evidence.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                Evidence Found ({app.evidence.length} records):
              </div>
              <ul className="evidence-list">
                {app.evidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Draft (after simulate) */}
          {result?.emailDraft && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                Generated Revoke Email:
              </div>
              <div className="email-draft">
                <strong>To:</strong> {result.emailDraft.to}{'\n'}
                <strong>Subject:</strong> {result.emailDraft.subject}{'\n\n'}
                {result.emailDraft.body}
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirm && !result && (
            <div className="confirm-dialog">
              <p>
                Are you sure you want to execute revocation for <strong>{app.name}</strong>?
              </p>
              <div className="confirm-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleSimulate}
                  disabled={loading}
                  data-testid="confirm-revoke-btn"
                >
                  {loading ? 'Executing playbook step...' : '⚡ Confirm Execute Revocation'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {result?.emailDraft && (
            <button className="btn btn-secondary btn-sm" onClick={handleCopyEmail}>
              {copied ? '✓ Copied!' : '📋 Copy Email'}
            </button>
          )}

          {showUndo && result && (
            <button className="btn btn-secondary btn-sm" onClick={handleUndo} data-testid="undo-btn">
              ↩ Undo ({undoTimer}s)
            </button>
          )}

          {!result && !showConfirm && (
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirm(true)}
              data-testid="simulate-revoke-btn"
            >
              ⚡ Execute Revocation (Preview)
            </button>
          )}

          {result && (
            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              ✓ Revocation executed — ID: {result.revokeId}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
