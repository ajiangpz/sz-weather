import { test, expect } from '@playwright/test';

test('temporarily hides the timeline while Phase 1 uses the full-screen map', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page.locator('.weather-dashboard__timeline')).toHaveCount(0);
  await expect(page.locator('.weather-dashboard__map-shell')).toBeVisible();
});
