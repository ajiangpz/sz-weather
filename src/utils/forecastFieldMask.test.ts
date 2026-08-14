import { describe, expect, it } from 'vitest';

import { getForecastFieldEdgeAlpha } from './forecastFieldMask';

describe('forecast field edge mask', () => {
  it('makes the bitmap boundary transparent and keeps the interior opaque', () => {
    expect(getForecastFieldEdgeAlpha(0, 40, 100, 80)).toBe(0);
    expect(getForecastFieldEdgeAlpha(99, 40, 100, 80)).toBe(0);
    expect(getForecastFieldEdgeAlpha(50, 0, 100, 80)).toBe(0);
    expect(getForecastFieldEdgeAlpha(50, 79, 100, 80)).toBe(0);
    expect(getForecastFieldEdgeAlpha(50, 40, 100, 80)).toBe(1);
  });

  it('uses a smooth monotonic transition inside the feather band', () => {
    const nearEdge = getForecastFieldEdgeAlpha(1, 40, 100, 80);
    const middleBand = getForecastFieldEdgeAlpha(3, 40, 100, 80);
    const interior = getForecastFieldEdgeAlpha(6, 40, 100, 80);
    expect(nearEdge).toBeGreaterThan(0);
    expect(middleBand).toBeGreaterThan(nearEdge);
    expect(interior).toBe(1);
  });
});
