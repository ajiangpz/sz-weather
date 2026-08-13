import { test, expect } from '@playwright/test';

test('exposes explicit 0.5x, 1x, and 2x timeline playback speeds', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const timeline = page.locator('.weather-dashboard__timeline');
  await expect(timeline).toBeVisible();

  const halfSpeed = timeline.getByRole('button', { name: '播放速度 0.5x' });
  const normalSpeed = timeline.getByRole('button', { name: '播放速度 1x' });
  const doubleSpeed = timeline.getByRole('button', { name: '播放速度 2x' });

  await expect(halfSpeed).toBeVisible();
  await expect(normalSpeed).toBeVisible();
  await expect(doubleSpeed).toBeVisible();
  await expect(normalSpeed).toHaveAttribute('aria-pressed', 'true');
  await expect(halfSpeed).toHaveAttribute('aria-pressed', 'false');
  await expect(doubleSpeed).toHaveAttribute('aria-pressed', 'false');

  await halfSpeed.click();
  await expect(halfSpeed).toHaveAttribute('aria-pressed', 'true');
  await expect(normalSpeed).toHaveAttribute('aria-pressed', 'false');

  await doubleSpeed.click();
  await expect(doubleSpeed).toHaveAttribute('aria-pressed', 'true');
  await expect(halfSpeed).toHaveAttribute('aria-pressed', 'false');
  await expect(normalSpeed).toHaveAttribute('aria-pressed', 'false');

  await page.screenshot({
    path: testInfo.outputPath('visual-qa-timeline-speeds-1440x900.png'),
    fullPage: true,
  });
});
