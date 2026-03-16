import { describe, it, expect } from 'vitest';
import { assessRiskWithAI, assessMultipleRisks } from '../../backend/services/ai-risk-scorer';
import { generateComplianceReport, complianceReportToMarkdown } from '../../backend/services/ai-compliance';
import type { DetectedApp } from '../../backend/services/simulator';

const criticalPiiApp: DetectedApp = {
  id: 101,
  name: 'Shadow CRM',
  category: 'crm',
  risk_level: 'critical',
  typical_price: 120,
  data_permissions: ['pii', 'employee_phones', 'emails'],
  employee: 'alice@company.com',
  department: 'sales',
};

const lowRiskApp: DetectedApp = {
  id: 102,
  name: 'Simple Notes',
  category: 'productivity',
  risk_level: 'low',
  typical_price: 8,
  data_permissions: ['calendar'],
  employee: 'bob@company.com',
  department: 'ops',
};

describe('AI Services (Fallback + Reliability)', () => {
  it('returns critical/high score for critical app with PII in fallback mode', async () => {
    const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const result = await assessRiskWithAI(criticalPiiApp);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['critical', 'high']).toContain(result.level);
    expect(result.mainRisks.join(' ').toLowerCase()).toMatch(/critical|pii|data/);

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
  });

  it('assesses multiple apps and preserves all ids in result map', async () => {
    const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const result = await assessMultipleRisks([criticalPiiApp, lowRiskApp]);

    expect(result.size).toBe(2);
    expect(result.has(criticalPiiApp.id)).toBe(true);
    expect(result.has(lowRiskApp.id)).toBe(true);
    expect((result.get(criticalPiiApp.id)?.score || 0)).toBeGreaterThan(
      result.get(lowRiskApp.id)?.score || 0
    );

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
  });

  it('generates compliance report with critical issue detection in fallback mode', async () => {
    const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const report = await generateComplianceReport([criticalPiiApp, lowRiskApp]);

    expect(report.totalApps).toBe(2);
    expect(report.criticalIssues).toBeGreaterThanOrEqual(1);
    expect(report.complianceScore).toBeGreaterThanOrEqual(0);
    expect(report.complianceScore).toBeLessThanOrEqual(100);
    expect(report.issues.length).toBeGreaterThan(0);

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
  });

  it('renders markdown compliance report with executive summary and actions', async () => {
    const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const report = await generateComplianceReport([criticalPiiApp]);
    const markdown = complianceReportToMarkdown(report);

    expect(markdown).toContain('# SaaS Compliance Report');
    expect(markdown).toContain('## Executive Summary');
    expect(markdown).toContain('## Recommended Actions');
    expect(markdown).toContain('Compliance Score');

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
  });
});
