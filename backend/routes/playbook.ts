import { Router, Request, Response } from 'express';
import {
  generateRevokeEmail,
  simulateRevoke,
  undoSimulateRevoke,
} from '../services/playbook';

const router = Router();

// POST /api/playbook/simulate
router.post('/simulate', (req: Request, res: Response) => {
  try {
    const { appId, appName, evidence, tenant, actor, risk_level, data_permissions } = req.body;

    if (!appId) {
      res.status(400).json({ error: 'appId is required' });
      return;
    }

    const safeActor = actor || 'demo@company.local';
    const safeTenant = tenant || 'company.local';

    const emailDraft = generateRevokeEmail(
      {
        name: appName || String(appId),
        id: appId,
        risk_level: risk_level || 'unknown',
        data_permissions: data_permissions || [],
      },
      evidence || [],
      safeTenant
    );

    const { revokeId } = simulateRevoke(appId, safeActor, appName);

    res.json({
      status: 'revoked_demo',
      revokeId,
      emailDraft,
      newState: 'revoked_demo',
      demo: true,
    });
  } catch (err) {
    console.error('Playbook simulate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/playbook/undo
router.post('/undo', (req: Request, res: Response) => {
  try {
    const { revokeId, actor } = req.body;

    if (!revokeId) {
      res.status(400).json({ error: 'revokeId is required' });
      return;
    }

    const safeActor = actor || 'demo@company.local';
    const result = undoSimulateRevoke(revokeId, safeActor);

    if (!result.success) {
      res.status(404).json({ error: 'Revoke entry not found' });
      return;
    }

    res.json({
      status: 'undone',
      newState: result.newState,
      demo: true,
    });
  } catch (err) {
    console.error('Playbook undo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
