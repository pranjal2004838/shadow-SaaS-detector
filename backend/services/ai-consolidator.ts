import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedApp } from './simulator';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export interface ConsolidationRecommendation {
  category: string;
  keep: string[];
  remove: string[];
  reasoning: string;
  estimatedSavings: number;
}

// Fallback: keep cheapest, drop expensive duplicates
function ruleBasedConsolidation(apps: DetectedApp[], category: string): ConsolidationRecommendation {
  const appsInCat = apps.filter((a) => a.category === category);

  if (appsInCat.length <= 1) {
    return {
      category,
      keep: appsInCat.map((a) => a.name),
      remove: [],
      reasoning: 'Only one tool in this category.',
      estimatedSavings: 0,
    };
  }

  // Sort by price (cheapest first)
  const sorted = [...appsInCat].sort((a, b) => (a.typical_price || 50) - (b.typical_price || 50));
  const kept = sorted[0];
  const removed = sorted.slice(1);
  const savings = removed.reduce((sum, app) => sum + (app.typical_price || 50), 0);

  return {
    category,
    keep: [kept.name],
    remove: removed.map((a) => a.name),
    reasoning: `Keep ${kept.name} (lowest cost). ${removed.length} duplicates can be removed.`,
    estimatedSavings: savings * 12, // Annual savings
  };
}

export async function getConsolidationAdvice(
  apps: DetectedApp[],
  category: string
): Promise<ConsolidationRecommendation> {
  const appsInCategory = apps.filter((a) => a.category === category);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('⚠️  No API key. Using rule-based consolidation.');
    return ruleBasedConsolidation(apps, category);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const appsString = appsInCategory
      .map((a) => `- ${a.name} ($${a.typical_price}/mo): ${a.evidence?.slice(0, 2).join(', ') || 'Unknown usage'}`)
      .join('\n');

    const prompt = `You are a SaaS management expert. Recommend which apps to keep vs consolidate.

Category: ${category}
Apps in this category:
${appsString}

Rules:
1. Keep at most 1-2 best apps that cover all needed functionality
2. Recommend removing redundant tools
3. Consider: cost, feature overlap, adoption, usage patterns
4. Each recommendation must be actionable (specific app names)

Respond in JSON:
{
  "keep": ["app1", "app2"],
  "remove": ["app3", "app4"],
  "reasoning": "explanation of consolidation strategy",
  "estimatedSavings": 5000
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
      return ruleBasedConsolidation(apps, category);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ConsolidationRecommendation>;

    return {
      category,
      keep: Array.isArray(parsed.keep) ? parsed.keep : [],
      remove: Array.isArray(parsed.remove) ? parsed.remove : [],
      reasoning: parsed.reasoning || 'Consolidation analysis complete',
      estimatedSavings: Math.max(0, parsed.estimatedSavings || 0),
    };
  } catch (err) {
    console.warn('⚠️  AI consolidation failed:', (err as Error).message);
    return ruleBasedConsolidation(apps, category);
  }
}

export async function consolidateAllCategories(
  apps: DetectedApp[]
): Promise<ConsolidationRecommendation[]> {
  const categories = [...new Set(apps.map((a) => a.category))];
  const recommendations: ConsolidationRecommendation[] = [];

  for (const category of categories) {
    const rec = await getConsolidationAdvice(apps, category);
    recommendations.push(rec);
  }

  return recommendations;
}
