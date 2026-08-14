import { describe, expect, it } from 'vitest';

import { createNationalDemoRadarPoints } from './nationalDemoRadar';

describe('createNationalDemoRadarPoints', () => {
  it('creates irregular national rain bands with weak and strong echoes', () => {
    const radar = createNationalDemoRadarPoints();
    const intensities = radar.features.map((feature) => feature.properties.intensity);
    const coordinates = radar.features.map((feature) => feature.geometry.coordinates);

    expect(radar.features.length).toBeGreaterThan(500);
    expect(Math.min(...intensities)).toBeLessThan(2.5);
    expect(Math.max(...intensities)).toBeGreaterThan(32);
    expect(Math.min(...coordinates.map(([longitude]) => longitude))).toBeGreaterThanOrEqual(73.4);
    expect(Math.max(...coordinates.map(([longitude]) => longitude))).toBeLessThanOrEqual(135.2);
    expect(Math.min(...coordinates.map(([, latitude]) => latitude))).toBeGreaterThanOrEqual(18);
    expect(Math.max(...coordinates.map(([, latitude]) => latitude))).toBeLessThanOrEqual(53.8);
  });
});
