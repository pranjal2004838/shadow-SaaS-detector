import { Router, Request, Response } from 'express';
import multer from 'multer';
import { detectShadowSaaS } from '../services/detector';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload — upload expenses.csv and browser_history.json
router.post(
  '/',
  upload.fields([
    { name: 'expenses', maxCount: 1 },
    { name: 'browser_history', maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files?.expenses?.[0] && !files?.browser_history?.[0]) {
        res.status(400).json({ error: 'At least one file (expenses or browser_history) is required' });
        return;
      }

      const expensesCSV = files?.expenses?.[0]
        ? files.expenses[0].buffer.toString('utf-8')
        : '';

      const browserJSON = files?.browser_history?.[0]
        ? files.browser_history[0].buffer.toString('utf-8')
        : '{"browser_history":[]}';

      const detectedApps = detectShadowSaaS(expensesCSV, browserJSON);

      res.json({
        detectedApps,
        totalApps: detectedApps.length,
        totalMonthlySpend: detectedApps.reduce((sum, app) => sum + app.typical_price, 0),
        categories: [...new Set(detectedApps.map((a) => a.category))],
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
