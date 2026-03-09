import * as fs from 'fs';
import * as path from 'path';

const REVOKES_PATH = path.join(__dirname, '..', 'data', 'revokes_demo.json');
const AUDIT_PATH = path.join(__dirname, '..', 'data', 'audit_log.json');

export interface RevokeEntry {
  revokeId: string;
  appId: string | number;
  appName?: string;
  actor: string;
  time: string;
  state: 'revoked_demo' | 'undone';
}

export interface AuditEntry {
  who: string;
  action: string;
  appId?: string | number;
  revokeId: string;
  time: string;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

function readJSON<T>(filePath: string): T[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeJSON<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateRevokeEmail(
  app: { name: string; id: string | number; risk_level?: string; data_permissions?: string[] },
  evidence: string[],
  tenant: string
): EmailDraft {
  const evidenceBlock = evidence.map((e) => `  • ${e}`).join('\n');
  const permissionsBlock = app.data_permissions
    ? app.data_permissions.map((p) => `  • ${p}`).join('\n')
    : '  • N/A';

  return {
    to: `it-admin@${tenant}`,
    subject: `[Action Required] Unauthorized SaaS Detected: ${app.name}`,
    body: `Hi IT Admin,

Our Shadow SaaS Detector has identified an unauthorized application in use at ${tenant}.

Application: ${app.name}
Risk Level: ${app.risk_level || 'Unknown'}
Data Access Permissions:
${permissionsBlock}

Evidence Found:
${evidenceBlock}

Recommended Action: Revoke access to ${app.name} and consolidate with an approved tool.

This is a simulated action for demonstration purposes only.

— Shadow SaaS Detector (DEMO MODE)`,
  };
}

export function simulateRevoke(
  appId: string | number,
  actor: string,
  appName?: string
): { revokeId: string; entry: RevokeEntry } {
  const revokeId = `r_${Date.now()}`;
  const time = new Date().toISOString();

  const entry: RevokeEntry = {
    revokeId,
    appId,
    appName: appName || String(appId),
    actor,
    time,
    state: 'revoked_demo',
  };

  // Append to revokes_demo.json
  const revokes = readJSON<RevokeEntry>(REVOKES_PATH);
  revokes.push(entry);
  writeJSON(REVOKES_PATH, revokes);

  // Append audit entry
  const auditLog = readJSON<AuditEntry>(AUDIT_PATH);
  auditLog.push({
    who: actor,
    action: 'simulate_revoke',
    appId,
    revokeId,
    time,
  });
  writeJSON(AUDIT_PATH, auditLog);

  return { revokeId, entry };
}

export function undoSimulateRevoke(
  revokeId: string,
  actor: string
): { success: boolean; newState?: string } {
  const revokes = readJSON<RevokeEntry>(REVOKES_PATH);
  const idx = revokes.findIndex((r) => r.revokeId === revokeId);

  if (idx === -1) {
    return { success: false };
  }

  revokes[idx].state = 'undone';
  writeJSON(REVOKES_PATH, revokes);

  const auditLog = readJSON<AuditEntry>(AUDIT_PATH);
  auditLog.push({
    who: actor,
    action: 'undo_simulate_revoke',
    revokeId,
    time: new Date().toISOString(),
  });
  writeJSON(AUDIT_PATH, auditLog);

  return { success: true, newState: 'undone' };
}
