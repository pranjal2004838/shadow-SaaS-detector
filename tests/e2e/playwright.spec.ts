import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '../../artifacts/screenshots');
const REVOKES_PATH = path.join(__dirname, '../../backend/data/revokes_demo.json');
const AUDIT_PATH = path.join(__dirname, '../../backend/data/audit_log.json');

test.beforeAll(() => {
  // Ensure screenshots directory exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  // Reset demo data
  fs.writeFileSync(REVOKES_PATH, '[]', 'utf-8');
  fs.writeFileSync(AUDIT_PATH, '[]', 'utf-8');
});

test.describe('Shadow SaaS Detector E2E', () => {
  test('full workflow: upload → playbook → simulator', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('/');
    await expect(page.locator('.app-header h1')).toContainText('Shadow SaaS Detector');

    // 2. Upload files
    const uploadSection = page.locator('[data-testid="upload-section"]');
    await expect(uploadSection).toBeVisible();

    // Set file inputs
    const expInput = page.locator('[data-testid="expenses-input"]');
    const brInput = page.locator('[data-testid="browser-input"]');

    await expInput.setInputFiles(path.join(__dirname, '../../test_data/expenses.csv'));
    await brInput.setInputFiles(path.join(__dirname, '../../test_data/browser_history.json'));

    // Click upload
    await page.locator('[data-testid="upload-btn"]').click();

    // Wait for apps grid
    await expect(page.locator('[data-testid="apps-grid"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible();

    // Take dashboard screenshot
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'dashboard_after_upload.png'),
      fullPage: true,
    });

    // 3. Find and click Playbook on Recruiting Bot (critical risk)
    // Find the app card for Recruiting Bot
    const recruitingCard = page.locator('[data-testid="app-card-7"]');
    if (await recruitingCard.isVisible()) {
      await recruitingCard.locator('[data-testid="playbook-btn-7"]').click();
    } else {
      // Fallback: click the first playbook button
      await page.locator('.app-card-actions .btn-primary').first().click();
    }

    // Wait for modal
    await expect(page.locator('[data-testid="playbook-modal"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.demo-banner')).toContainText('Preview');

    // Take pre-simulate screenshot
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'playbook_modal_before.png'),
      fullPage: true,
    });

    // 4. Click Simulate Revoke
    await page.locator('[data-testid="simulate-revoke-btn"]').click();

    // Confirm dialog should appear
    await expect(page.locator('[data-testid="confirm-revoke-btn"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="confirm-revoke-btn"]').click();

    // Wait for revoke to complete
    await expect(page.locator('[data-testid="undo-btn"]')).toBeVisible({ timeout: 5000 });

    // Take post-simulate screenshot
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'playbook_modal_after_simulate.png'),
      fullPage: true,
    });

    // 5. Verify backend data updated
    await page.waitForTimeout(500);
    const revokes = JSON.parse(fs.readFileSync(REVOKES_PATH, 'utf-8'));
    expect(revokes.length).toBeGreaterThan(0);
    expect(revokes[0].state).toBe('revoked_demo');

    const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf-8'));
    expect(audit.length).toBeGreaterThan(0);
    expect(audit[0].action).toBe('simulate_revoke');

    // 6. Close modal
    await page.locator('.modal-close').click();
    await expect(page.locator('[data-testid="playbook-modal"]')).not.toBeVisible();

    // 7. Navigate to Simulator
    await page.locator('.nav-tab', { hasText: 'Simulator' }).click();
    await expect(page.locator('[data-testid="simulator"]')).toBeVisible({ timeout: 5000 });

    // Wait for savings calculation
    await page.waitForTimeout(1500);

    // Take simulator screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'simulator_results.png'),
      fullPage: true,
    });

    // Verify savings are displayed
    const savingsDisplay = page.locator('[data-testid="monthly-savings"]');
    await expect(savingsDisplay).toBeVisible();
  });
});
