import { Router, Request, Response } from 'express';
import { assessRiskWithAI, RiskAssessment } from '../services/ai-risk-scorer';
import { getConsolidationAdvice, consolidateAllCategories, ConsolidationRecommendation } from '../services/ai-consolidator';
import { generateComplianceReport, complianceReportToMarkdown, ComplianceReport } from '../services/ai-compliance';
import { riskAssessmentCache, consolidationCache, complianceReportCache } from '../services/cache';
import { DetectedApp } from '../services/simulator';

const router = Router();

// GET /api/ai/health - Check AI service status
router.get('/health', (_req: Request, res: Response) => {
  const hasKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  res.json({
    status: 'ok',
    aiEnabled: hasKey,
    cacheStats: {
      riskAssessments: riskAssessmentCache.size(),
      consolidations: consolidationCache.size(),
      complianceReports: complianceReportCache.size(),
    },
    features: ['risk-assessment', 'consolidation', 'compliance-report'],
  });
});

// POST /api/ai/risk-assessment - Analyze detected apps for risk
router.post('/risk-assessment', async (req: Request, res: Response) => {
  try {
    const { detectedApps } = req.body;

    if (!detectedApps || !Array.isArray(detectedApps)) {
      return res.status(400).json({ error: 'detectedApps array required' });
    }

    if (detectedApps.length === 0) {
      return res.status(404).json({ error: 'No detected apps to analyze' });
    }

    const assessments: Record<string, unknown> = {};

    for (const app of detectedApps) {
      const cacheKey = `risk:${app.id}:${JSON.stringify(app.data_permissions || [])}`;

      // Check cache first
      let assessment: RiskAssessment | null = (riskAssessmentCache.get(cacheKey) as RiskAssessment) || null;

      if (!assessment) {
        assessment = await assessRiskWithAI(app);
        riskAssessmentCache.set(cacheKey, assessment);
      }

      assessments[app.name] = {
        level: assessment.level,
        score: assessment.score,
        reasoning: assessment.reasoning,
        mainRisks: assessment.mainRisks,
        recommendations: assessment.recommendations,
        appName: app.name,
        category: app.category,
        cost: app.typical_price,
      };
    }

    res.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      totalApps: detectedApps.length,
      assessments,
    });
  } catch (err) {
    console.error('Risk assessment error:', err);
    res.status(500).json({ error: 'Risk assessment failed', details: (err as Error).message });
  }
});

// POST /api/ai/consolidation - Get consolidation advice
router.post('/consolidation', async (req: Request, res: Response) => {
  try {
    const { detectedApps, category } = req.body;

    if (!detectedApps || !Array.isArray(detectedApps)) {
      return res.status(400).json({ error: 'detectedApps array required' });
    }

    if (detectedApps.length === 0) {
      return res.status(404).json({ error: 'No detected apps' });
    }

    let recommendations;

    if (category) {
      // Single category consolidation
      const cacheKey = `consolidate:${category}`;
      recommendations = consolidationCache.get(cacheKey);

      if (!recommendations) {
        recommendations = await getConsolidationAdvice(detectedApps, category);
        consolidationCache.set(cacheKey, recommendations);
      }

      res.json({
        status: 'completed',
        timestamp: new Date().toISOString(),
        recommendations: recommendations,
      });
    } else {
      // All categories
      const cacheKey = 'consolidate:all';
      let allRecommendations = consolidationCache.get(cacheKey);

      if (!allRecommendations) {
        allRecommendations = await consolidateAllCategories(detectedApps);
        consolidationCache.set(cacheKey, allRecommendations);
      }

      res.json({
        status: 'completed',
        timestamp: new Date().toISOString(),
        recommendations: allRecommendations,
      });
    }
  } catch (err) {
    console.error('Consolidation error:', err);
    res.status(500).json({ error: 'Consolidation analysis failed', details: (err as Error).message });
  }
});

// POST /api/ai/compliance-report - Generate compliance report
router.post('/compliance-report', async (req: Request, res: Response) => {
  try {
    const { detectedApps, format = 'json' } = req.body;

    if (!detectedApps || !Array.isArray(detectedApps)) {
      return res.status(400).json({ error: 'detectedApps array required' });
    }

    if (detectedApps.length === 0) {
      return res.status(404).json({ error: 'No detected apps to analyze' });
    }

    const cacheKey = `compliance:${detectedApps.map((a: DetectedApp) => a.id).join(',')}`;
    let cachedReport = complianceReportCache.get(cacheKey);
    let report: ComplianceReport;

    if (!cachedReport) {
      report = await generateComplianceReport(detectedApps);
      complianceReportCache.set(cacheKey, report);
    } else {
      report = cachedReport as ComplianceReport;
    }

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.send(complianceReportToMarkdown(report));
    } else {
      res.json({
        status: 'completed',
        timestamp: new Date().toISOString(),
        report,
      });
    }
  } catch (err) {
    console.error('Compliance report error:', err);
    res.status(500).json({ error: 'Compliance report generation failed', details: (err as Error).message });
  }
});

// POST /api/ai/clear-cache - Clear all caches (admin)
router.post('/clear-cache', (_req: Request, res: Response) => {
  riskAssessmentCache.clear();
  consolidationCache.clear();
  complianceReportCache.clear();

  res.json({ status: 'caches cleared', timestamp: new Date().toISOString() });
});

export default router;
