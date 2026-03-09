import { Router, Request, Response } from 'express';
import { simulateSavings } from '../services/simulator';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { detectedApps, keepMap, adoption } = req.body;

    if (!detectedApps || !Array.isArray(detectedApps)) {
      res.status(400).json({ error: 'detectedApps array is required' });
      return;
    }

    const result = simulateSavings(
      detectedApps,
      keepMap || {},
      typeof adoption === 'number' ? adoption : 1.0
    );

    res.json(result);
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
