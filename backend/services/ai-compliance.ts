import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedApp } from './simulator';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export interface ComplianceIssue {
  app: string;
  policy: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface ComplianceReport {
  generatedAt: string;
  totalApps: number;
  criticalIssues: number;
  complianceScore: number; // 0-100
  issues: ComplianceIssue[];
  summary: string;
  forecast12Months: string;
  actionItems: string[];
}

function ruleBasedCompliance(apps: DetectedApp[]): ComplianceReport {
  const issues: ComplianceIssue[] = [];

  for (const app of apps) {
    if (app.risk_level === 'critical') {
      issues.push({
        app: app.name,
        policy: 'Data Protection & Security',
        severity: 'critical',
        description: `${app.name} is flagged as critical risk due to elevated data access.`,
        recommendation: `Scheduled revocation. Evaluate replacement with compliant alternative in ${app.category} category.`,
      });
    }

    if (app.data_permissions?.includes('pii')) {
      issues.push({
        app: app.name,
        policy: 'Privacy Regulation (GDPR/CCPA)',
        severity: 'high',
        description: `Processes employee PII without clear audit trail.`,
        recommendation: 'Implement data processing agreement (DPA) or restrict access.',
      });
    }
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const complianceScore = Math.max(0, 100 - criticalCount * 15);

  return {
    generatedAt: new Date().toISOString(),
    totalApps: apps.length,
    criticalIssues: criticalCount,
    complianceScore,
    issues,
    summary: `Compliance assessment: ${criticalCount} critical issues identified. Recommend immediate review of ${criticalCount} high-risk applications.`,
    forecast12Months: 'If no action: Risk increases 20% quarterly. If remediated: Compliance score reaches 95+ within 60 days.',
    actionItems: [
      'Establish SaaS approval workflow (prevent shadow IT)',
      'Implement monthly spend intelligence reviews',
      'Schedule revocation of 3+ critical-risk apps',
      'Document data processing agreements for PII-accessing tools',
    ],
  };
}

export async function generateComplianceReport(apps: DetectedApp[]): Promise<ComplianceReport> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('⚠️  No API key. Using rule-based compliance report.');
    return ruleBasedCompliance(apps);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const appsSummary = apps
      .map(
        (a) =>
          `${a.name} (${a.category}, $${a.typical_price}/mo): ${a.risk_level} risk, accesses [${a.data_permissions?.join(', ')}]`
      )
      .join('\n');

    const prompt = `You are a compliance and information security officer.

Generate a compliance assessment report for this company's SaaS stack:

${appsSummary}

Analyze against: GDPR, CCPA, SOC 2, data protection best practices.

Respond in JSON:
{
  "criticalIssues": 2,
  "complianceScore": 65,
  "issues": [
    {
      "app": "app name",
      "policy": "which policy/regulation",
      "severity": "critical|high|medium|low",
      "description": "what's the issue",
      "recommendation": "how to fix it"
    }
  ],
  "summary": "overall assessment",
  "forecast12Months": "what will happen in 12 months if actions are/aren't taken",
  "actionItems": ["item1", "item2"]
}`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);

    const responseText = (result as { response: { candidates: Array<{ content: { parts: Array<{ text: string }> } }> } }).response
      .candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return ruleBasedCompliance(apps);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ComplianceReport>;

    return {
      generatedAt: new Date().toISOString(),
      totalApps: apps.length,
      criticalIssues: parsed.criticalIssues || 0,
      complianceScore: Math.min(100, Math.max(0, parsed.complianceScore || 50)),
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: parsed.summary || 'Compliance assessment complete',
      forecast12Months: parsed.forecast12Months || 'See recommendations for risk mitigation',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch (err) {
    console.warn('⚠️  AI compliance analysis failed:', (err as Error).message);
    return ruleBasedCompliance(apps);
  }
}

// Export markdown version for easy document generation
export function complianceReportToMarkdown(report: ComplianceReport): string {
  return `# SaaS Compliance Report
**Generated:** ${new Date(report.generatedAt).toLocaleString()}

## Executive Summary
- **Total SaaS Apps:** ${report.totalApps}
- **Critical Issues:** ${report.criticalIssues}
- **Compliance Score:** ${report.complianceScore}/100

${report.summary}

## Identified Risks
${
  report.issues.length === 0
    ? 'No critical issues identified.'
    : report.issues
        .map(
          (i) => `
### ${i.app} - ${i.severity.toUpperCase()}
**Policy:** ${i.policy}
**Issue:** ${i.description}
**Fix:** ${i.recommendation}
`
        )
        .join('\n')
}

## 12-Month Forecast
${report.forecast12Months}

## Recommended Actions
${report.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

---
*This report was auto-generated using AI compliance analysis.*`;
}
