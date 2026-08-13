import { test, expect } from '@playwright/test';
import {
  createTimeline,
  createReferencePayload,
  createChinaGridPayload,
  defaultGridFields,
} from './china-grid-fixture.mjs';

const selectPrimaryField = async (panel, name) => {
  await panel.locator('.layer-panel__primary-option').filter({ hasText: name }).click();
  await expect(panel.getByRole('radio', { name })).toBeChecked();
};

test('renders future model precipitation as a continuous China live field when observed radar is unavailable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = createTimeline();
  const cityPayload = createReferencePayload(times, {
    precipitation: times.map((_, index) => index >= 14 && index <= 18 ? 1.2 : 0.05),
    weather_code: times.map((_, index) => index >= 14 && index <= 18 ? 63 : 61),
  });
  const gridPayload = createChinaGridPayload(times, ({ column, row, times: frameTimes }) => ({
    ...defaultGridFields({ column, row, times: frameTimes }),
    precipitation: frameTimes.map((_, frameIndex) => {
      if (frameIndex < 14 || frameIndex > 19) return 0.01;
      const temporal = Math.max(0, 1 - Math.abs(frameIndex - 16) / 6);
      const southEastWeight = (column / 11) * 0.8 + (1 - row / 7) * 0.6;
      return Number(Math.max(0.03, temporal * (0.2 + southEastWeight * 1.8)).toFixed(3));
    }),
  }));

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const isGridRequest = (url.searchParams.get('latitude') ?? '').includes(',');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(isGridRequest ? gridPayload : cityPayload) });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const futureIndex = 16;
  await page.getByRole('button', { name: `预报时刻 ${times[futureIndex].slice(11, 16)}` }).click();

  const precipitationLegend = page.getByRole('region', { name: '地图数据图例' });
  await expect(precipitationLegend.getByText('模式降水 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(precipitationLegend.getByText('mm / 15 min', { exact: true })).toBeVisible();

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();
  await expect(layerPanel.getByText('模式降水 LIVE', { exact: true })).toBeVisible();
  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  await windToggle.uncheck();
  await page.keyboard.press('Escape');

  await page.waitForTimeout(350);
  const mapShell = page.locator('.weather-dashboard__map-shell');
  const precipitationOn = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-model-precipitation-on.png') });

  await layerButton.click();
  await selectPrimaryField(layerPanel, '无底色');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);
  const precipitationOff = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-model-precipitation-off.png') });
  expect(precipitationOn.equals(precipitationOff)).toBe(false);

  await layerButton.click();
  await selectPrimaryField(layerPanel, '降水');
  await page.keyboard.press('Escape');

  const mapCanvas = page.locator('.weather-map-panel__canvas');
  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  await page.mouse.click(mapBox.x + mapBox.width * 0.58, mapBox.y + mapBox.height * 0.52);

  const popup = page.locator('.weather-map-panel__popup');
  await expect(popup).toBeVisible();
  const popupTitle = popup.locator('h3');
  await expect(popupTitle).toHaveText(/模式预报 · \d+\.\d{2} mm\/15min/);
  const firstTitle = await popupTitle.textContent();

  const nextIndex = 17;
  await page.getByRole('button', { name: `预报时刻 ${times[nextIndex].slice(11, 16)}` }).click();
  await expect.poll(async () => popupTitle.textContent()).not.toBe(firstTitle);

  await page.screenshot({ path: testInfo.outputPath('visual-qa-china-model-precipitation-1536x1024.png'), fullPage: true });
});
