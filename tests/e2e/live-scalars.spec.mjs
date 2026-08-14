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

test('renders precipitation, temperature and humidity as mutually exclusive China primary fields', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = createTimeline();
  const cityPayload = createReferencePayload(times);
  const gridPayload = createChinaGridPayload(times, ({ column, row, times: frameTimes }) => ({
    ...defaultGridFields({ column, row, times: frameTimes }),
    temperature_2m: frameTimes.map((_, frameIndex) => Number((8 + row * 3.6 + column * 0.8 + frameIndex * 0.04).toFixed(2))),
    relative_humidity_2m: frameTimes.map((_, frameIndex) => Number((94 - row * 4.2 - column * 1.9 - frameIndex * 0.05).toFixed(1))),
  }));

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const isGridRequest = (url.searchParams.get('latitude') ?? '').includes(',');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(isGridRequest ? gridPayload : cityPayload),
    });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();

  const precipitationField = layerPanel.getByRole('radio', { name: '降水' });
  const temperatureField = layerPanel.getByRole('radio', { name: '温度' });
  const humidityField = layerPanel.getByRole('radio', { name: '湿度' });
  const noneField = layerPanel.getByRole('radio', { name: '无底色' });
  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  const pressureToggle = layerPanel.getByRole('checkbox', { name: '气压等值线' });

  await expect(precipitationField).toBeChecked();
  await expect(temperatureField).toBeEnabled();
  await expect(humidityField).toBeEnabled();
  await expect(noneField).toBeEnabled();
  await expect(pressureToggle).toBeEnabled();

  await windToggle.uncheck();
  await selectPrimaryField(layerPanel, '温度');
  await page.keyboard.press('Escape');

  const legend = page.getByRole('region', { name: '地图数据图例' });
  await expect(legend.getByText('温度预报场', { exact: true })).toBeVisible();
  await expect(legend.getByText('°C · 12×8 · 插值', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  const mapShell = page.locator('.weather-dashboard__map-shell');
  const temperatureFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-temperature-field.png') });

  await layerButton.click();
  await selectPrimaryField(layerPanel, '湿度');
  await page.keyboard.press('Escape');
  await expect(legend.getByText('湿度预报场', { exact: true })).toBeVisible();
  await expect(legend.getByText('% · 12×8 · 插值', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  const humidityFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-humidity-field.png') });
  expect(temperatureFrame.equals(humidityFrame)).toBe(false);

  await layerButton.click();
  await selectPrimaryField(layerPanel, '无底色');
  await page.keyboard.press('Escape');
  await expect(legend.getByText('温度预报场', { exact: true })).toHaveCount(0);
  await expect(legend.getByText('湿度预报场', { exact: true })).toHaveCount(0);
  await expect(legend.getByText('模式降水 LIVE', { exact: true })).toHaveCount(0);

  await page.screenshot({ path: testInfo.outputPath('visual-qa-china-primary-fields-1536x1024.png'), fullPage: true });
});
