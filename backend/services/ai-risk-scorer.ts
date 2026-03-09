import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedApp } from './simulator';

// Initialize Gemini with env key (will fail gracefully if missing)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export interface RiskAssessment {
  level: 'critical' | 'high' | 'medium' | 'low';
  score: number; // 0-100
  reasoning: string;
  mainRisks: string[];
  recommendations: string[];
}

// Fallback rule-based scorer (for when API fails)
function ruleBasedRiskScore(app: DetectedApp): RiskAssessment {
  let score = 0;
  const mainRisks: string[] = [];

  if (app.risk_level === 'critical') {
    score += 90;
    mainRisks.push('Critical risk designation in database');
  } else if (app.risk_level === 'high') {
    score += 70;
    mainRisks.push('High risk designation');
  }

  if (app.data_permissions?.includes('employee_phones') || app.data_permissions?.includes('pii')) {
    score += 15;
    mainRisks.push('Accesses PII (employees phone numbers, personal data)');
  }

  if (app.data_permissions?.includes('contacts') || app.data_permissions?.includes('emails')) {
    score += 10;
    mainRisks.push('Accesses company contacts and email data');
  }

  if (!app.employee) {
    score += 5;
    mainRisks.push('Usage not clearly attributed to single employee');
  }

  score = Math.min(score, 100);

  const level: 'critical' | 'high' | 'medium' | 'low' =
    score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    level,
    score,
    reasoning: `Risk score: ${score}/100. ${mainRisks.join(' ')}`,
    mainRisks,
    recommendations:
      score >= 80
        ? [`Immediate revocation recommended. ${app.name} poses significant security risk.`]
        : score >= 60
          ? [
              `High risk. Recommend access review and potential consolidation within ${app.category} category.`,
            ]
          : [`Monitor usage. Consider consolidating with approved ${app.category} tool.`],
  };
}

export async function assessRiskWithAI(app: DetectedApp): Promise<RiskAssessment> {
  // If no API key, use fallback
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('⚠️  No API key found. Using rule-based risk assessment.');
    return ruleBasedRiskScore(app);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a cybersecurity risk analyst. Assess the security risk of this SaaS application for a company.

Application: ${app.name}
Category: ${app.category}
Monthly Cost: $${app.typical_price}
Data Permissions: ${app.data_permissions?.join(', ') || 'Unknown'}
Evidence: ${(app.evidence || []).join(' | ')}
Employee: ${app.employee || 'Unknown'}
Department: ${app.department || 'Unknown'}

Respond in JSON format:
{
  "level": "critical|high|medium|low",
  "score": 0-100,
  "reasoning": "brief explanation",
  "mainRisks": ["risk1", "risk2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Focus on: Data sensitivity, unauthorized access, compliance issues, user attribution, consolidation opportunities.`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 5000)
      ),
    ]);

    const responseText =
      (result as { response: { candidates: Array<{ content: { parts: Array<{ text: string }> } }> } }).response
        .candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️  Could not parse AI response. Using fallback.');
      return ruleBasedRiskScore(app);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<RiskAssessment>;

    return {
      level: (parsed.level || 'medium') as 'critical' | 'high' | 'medium' | 'low',
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      reasoning: parsed.reasoning || 'Analysis complete',
      mainRisks: Array.isArray(parsed.mainRisks) ? parsed.mainRisks : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (err) {
    console.warn('⚠️  AI assessment failed:', (err as Error).message);
    console.warn('    Falling back to rule-based scoring');
    return ruleBasedRiskScore(app);
  }
}

// Batch assess multiple apps
export async function assessMultipleRisks(apps: DetectedApp[]): Promise<Map<string | number, RiskAssessment>> {
  const results = new Map<string | number, RiskAssessment>();

  for (const app of apps) {
    const assessment = await assessRiskWithAI(app);
    results.set(app.id, assessment);
  }

  return results;
}
