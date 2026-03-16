import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const DB_PATH = path.join(__dirname, '..', 'data', 'saas_database.json');

interface SaaSEntry {
  id: number;
  name: string;
  category: string;
  typical_price: number;
  risk_level: string;
  data_permissions: string[];
  keywords: string[];
}

router.post('/', (req: Request, res: Response) => {
  try {
    const { domains } = req.body as { domains?: string[] };

    if (!Array.isArray(domains)) {
      res.status(400).json({ error: 'domains must be an array of hostnames' });
      return;
    }

    const saasDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as SaaSEntry[];
    const normalizedDomains = domains
      .map((domain) => String(domain || '').toLowerCase().trim())
      .filter(Boolean);

    const matched = saasDb.filter((saas) => {
      const normalizedName = saas.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      return normalizedDomains.some((domain) => {
        const cleanDomain = domain.replace(/^www\./, '');
        const domainCompact = cleanDomain.replace(/[^a-z0-9]/g, '');

        const keywordMatch = saas.keywords.some((keyword) => {
          const normalizedKeyword = keyword.toLowerCase();
          return cleanDomain.includes(normalizedKeyword) || normalizedKeyword.includes(cleanDomain);
        });

        const nameMatch = domainCompact.includes(normalizedName) || normalizedName.includes(domainCompact);
        return keywordMatch || nameMatch;
      });
    });

    const detectedApps = matched.map((saas) => ({
      id: `browser-${saas.id}`,
      name: saas.name,
      category: saas.category,
      typical_price: saas.typical_price,
      risk_level: saas.risk_level,
      data_permissions: saas.data_permissions,
      source: 'browser-history-live',
      evidence: ['Detected from Chrome extension browser history scan'],
    }));

    (req.app.locals as { browserHistoryApps?: unknown[] }).browserHistoryApps = detectedApps;

    res.json({
      detectedApps,
      detectedCount: detectedApps.length,
    });
  } catch (error) {
    console.error('Browser history ingestion error:', error);
    res.status(500).json({ error: 'Failed to process browser history domains' });
  }
});

export default router;
