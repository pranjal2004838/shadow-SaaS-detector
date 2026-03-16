import { Router, Request, Response } from 'express';

const router = Router();

interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  error?: string;
}

interface SlackAppEntry {
  id?: string;
  app_id?: string;
  name?: string;
  title?: string;
  description?: string;
}

router.get('/auth', (_req: Request, res: Response) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Missing SLACK_CLIENT_ID or SLACK_REDIRECT_URI' });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'admin.apps:read,apps:read',
    redirect_uri: redirectUri,
  });

  res.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
});

router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!code) {
    res.status(400).json({ error: 'Missing OAuth code' });
    return;
  }

  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).json({ error: 'Missing Slack OAuth environment variables' });
    return;
  }

  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const tokenData = (await tokenRes.json()) as SlackOAuthResponse;

    if (!tokenData.ok || !tokenData.access_token) {
      res.status(400).json({ error: tokenData.error || 'Slack OAuth token exchange failed' });
      return;
    }

    (req.app.locals as { slackToken?: string }).slackToken = tokenData.access_token;
    res.redirect('/?slack=connected');
  } catch (error) {
    console.error('Slack callback error:', error);
    res.status(500).json({ error: 'Slack OAuth callback failed' });
  }
});

router.get('/apps', async (req: Request, res: Response) => {
  const token = (req.app.locals as { slackToken?: string }).slackToken;

  if (!token) {
    res.status(401).json({ error: 'Slack is not connected. Visit /api/slack/auth first.' });
    return;
  }

  try {
    const slackRes = await fetch('https://slack.com/api/apps.list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const slackData = (await slackRes.json()) as {
      ok: boolean;
      error?: string;
      apps?: SlackAppEntry[];
    };

    if (!slackData.ok) {
      res.status(400).json({ error: slackData.error || 'Failed to fetch Slack apps' });
      return;
    }

    const apps = (slackData.apps || []).map((app, index) => ({
      id: app.app_id || app.id || `slack-${index}`,
      name: app.name || app.title || `Slack App ${index + 1}`,
      category: 'Slack Integration',
      typical_price: 0,
      risk_level: 'medium',
      evidence: [app.description || 'Installed from Slack workspace'],
      data_permissions: ['workspace_access'],
      source: 'slack-live',
    }));

    res.json({
      apps,
      totalApps: apps.length,
    });
  } catch (error) {
    console.error('Slack apps fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch installed Slack apps' });
  }
});

export default router;
