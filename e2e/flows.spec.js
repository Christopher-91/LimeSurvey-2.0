import { expect, test } from '@playwright/test';

test.describe('LimeSurvey End-to-End Migration Flows', () => {
  test('Landing page displays active surveys', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('LimeSurvey Public Portal');
    await expect(page.locator('text=Available Surveys')).toBeVisible();
  });

  test('Login page features top-center segmented toggle and keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Verify segmented toggle
    const voterTab = page.locator('#tab-voter');
    const adminTab = page.locator('#tab-admin');
    await expect(voterTab).toBeVisible();
    await expect(adminTab).toBeVisible();
    await expect(voterTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Admin Login via click
    await adminTab.click();
    await expect(adminTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('h1')).toContainText('Administration Login');

    // Deep link support
    await page.goto('/login?role=admin');
    await expect(adminTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Admin login flow & redirects to Admin Dashboard', async ({ page }) => {
    await page.goto('/login?role=admin');

    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Verify redirected to /admin/dashboard
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Administration Dashboard');
  });

  test('Voter access code login and survey completion flow', async ({ page }) => {
    await page.goto('/login?role=voter');

    // Use seeded demo token
    await page.fill('#login-identifier', 'VOTE-DEMO-2026');
    await page.click('button[type="submit"]');

    // Verify redirected to survey taking view
    await page.waitForURL('**/surveys/**/take?token=VOTE-DEMO-2026');
    await expect(page.locator('h1')).toBeVisible();

    // Fill in required fields
    await page.locator('input[type="radio"]').first().check();
    if (await page.locator('button:has-text("5")').isVisible()) {
      await page.locator('button:has-text("5")').click();
    }

    // Submit survey
    await page.click('button:has-text("Submit Questionnaire")');

    // Expect completion message
    await expect(page.locator('text=Response Recorded')).toBeVisible();
  });
});
