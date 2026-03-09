import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  generateRevokeEmail,
  simulateRevoke,
  undoSimulateRevoke,
} from '../../backend/services/playbook';

const REVOKES_PATH = path.join(__dirname, '../../backend/data/revokes_demo.json');
const AUDIT_PATH = path.join(__dirname, '../../backend/data/audit_log.json');

describe('Playbook Service', () => {
  // Reset data files before each test
  beforeEach(() => {
    fs.writeFileSync(REVOKES_PATH, '[]', 'utf-8');
    fs.writeFileSync(AUDIT_PATH, '[]', 'utf-8');
  });

  afterEach(() => {
    fs.writeFileSync(REVOKES_PATH, '[]', 'utf-8');
    fs.writeFileSync(AUDIT_PATH, '[]', 'utf-8');
  });

  describe('generateRevokeEmail', () => {
    it('should generate email with app name in subject', () => {
      const email = generateRevokeEmail(
        { name: 'Recruiting Bot', id: 7, risk_level: 'critical', data_permissions: ['employee_phones', 'pii'] },
        ['Expense: Recruiting Bot Tool License ($30) on 2026-01-25'],
        'growthlab.com'
      );
      expect(email.subject).toContain('Recruiting Bot');
    });

    it('should include evidence in body', () => {
      const evidence = ['Expense: Recruiting Bot Tool License ($30) on 2026-01-25'];
      const email = generateRevokeEmail(
        { name: 'Recruiting Bot', id: 7, risk_level: 'critical', data_permissions: [] },
        evidence,
        'growthlab.com'
      );
      expect(email.body).toContain('Recruiting Bot Tool License');
      expect(email.body).toContain('$30');
    });

    it('should include tenant in to address', () => {
      const email = generateRevokeEmail(
        { name: 'Test App', id: 1, risk_level: 'high' },
        [],
        'acme.com'
      );
      expect(email.to).toBe('it-admin@acme.com');
    });

    it('should include data permissions in body', () => {
      const email = generateRevokeEmail(
        { name: 'Test', id: 1, risk_level: 'high', data_permissions: ['contacts', 'emails'] },
        [],
        'test.com'
      );
      expect(email.body).toContain('contacts');
      expect(email.body).toContain('emails');
    });

    it('should include DEMO MODE disclaimer', () => {
      const email = generateRevokeEmail(
        { name: 'Test', id: 1 },
        [],
        'test.com'
      );
      expect(email.body).toContain('DEMO MODE');
    });
  });

  describe('simulateRevoke', () => {
    it('should write revoke entry to revokes_demo.json', () => {
      const { revokeId } = simulateRevoke(7, 'demo@company.local', 'Recruiting Bot');
      expect(revokeId).toMatch(/^r_\d+$/);

      const revokes = JSON.parse(fs.readFileSync(REVOKES_PATH, 'utf-8'));
      expect(revokes).toHaveLength(1);
      expect(revokes[0].appId).toBe(7);
      expect(revokes[0].state).toBe('revoked_demo');
      expect(revokes[0].actor).toBe('demo@company.local');
    });

    it('should write audit entry to audit_log.json', () => {
      simulateRevoke(7, 'demo@company.local');

      const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf-8'));
      expect(audit).toHaveLength(1);
      expect(audit[0].action).toBe('simulate_revoke');
      expect(audit[0].who).toBe('demo@company.local');
    });
  });

  describe('undoSimulateRevoke', () => {
    it('should mark revoke as undone', () => {
      const { revokeId } = simulateRevoke(7, 'demo@company.local');
      const result = undoSimulateRevoke(revokeId, 'demo@company.local');

      expect(result.success).toBe(true);
      expect(result.newState).toBe('undone');

      const revokes = JSON.parse(fs.readFileSync(REVOKES_PATH, 'utf-8'));
      expect(revokes[0].state).toBe('undone');
    });

    it('should append undo audit entry', () => {
      const { revokeId } = simulateRevoke(7, 'demo@company.local');
      undoSimulateRevoke(revokeId, 'demo@company.local');

      const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf-8'));
      expect(audit).toHaveLength(2);
      expect(audit[1].action).toBe('undo_simulate_revoke');
    });

    it('should return failure for non-existent revokeId', () => {
      const result = undoSimulateRevoke('r_nonexistent', 'demo@company.local');
      expect(result.success).toBe(false);
    });
  });
});
