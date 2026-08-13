import { describe, expect, it } from 'vitest';

import {
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  createWindGridPoints,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import {
  PRESSURE_CONTOUR_INTERVAL_HPA,
  createForecastPressureContours,
  createPressureLevels,
  sampleForecastPressure,
} from './forecastPressureContours';

const createPressureFrame = (): WindGridFrame => {
  const points = createWindGridPoints();
  return {
    timestamp: '2026-08-13T08:30',
    time: '08:30',
    samples: points.map((point, index) => {
      const column = index % WIND_GRID_COLUMNS;
      const row = Math.floor(index / WIND_GRID_COLUMNS);
      return {
        ...point,
        speed: 3,
        direction: 90,
        u: -3,
        v: 0,
        precipitation: 0,
        temperature: 29,
        humidity: 78,
        pressure: 1001.2 + column * 0.8 + row * 0.45,
      };
    }),
  };
};

describe('forecast pressure contours', () => {
  it('bilinearly samples pressure inside the 5x3 forecast grid', () => {
    const frame = createPressureFrame();
    const center = sampleForecastPressure(frame, 114.21, 22.63);
    expect(center).toBeGreaterThan(1002.5);
    expect(center).toBeLessThan(1004.5);
  });

  it('builds bounded contour levels inside the frame pressure range', () => {
    const frame = createPressureFrame();
    const levels = createPressureLevels(frame);
    expect(levels.length).toBeGreaterThan(2);
    expect(levels.length).toBeLessThanOrEqual(12);
    expect(levels.every((level) => Number.isInteger(level / PRESSURE_CONTOUR_INTERVAL_HPA))).toBe(true);
    const minimum = Math.min(...frame.samples.map((sample) => sample.pressure));
    const maximum = Math.max(...frame.samples.map((sample) => sample.pressure));
    expect(levels.every((level) => level > minimum && level < maximum)).toBe(true);
  });

  it('creates deterministic line segments inside Shenzhen forecast bounds', () => {
    const frame = createPressureFrame();
    const first = createForecastPressureContours(frame, 24, 16);
    const second = createForecastPressureContours(frame, 24, 16);
    expect(first.length).toBeGreaterThan(10);
    expect(first).toEqual(second);
    expect(first.every((segment) => (
      segment.path.length === 2
      && segment.path.flat().every(Number.isFinite)
      && Number.isFinite(segment.level)
    ))).toBe(true);
  });

  it('returns no contours for a spatially uniform pressure field', () => {
    const frame = createPressureFrame();
    const uniform: WindGridFrame = {
      ...frame,
      samples: frame.samples.map((sample) => ({ ...sample, pressure: 1004 })),
    };
    expect(createForecastPressureContours(uniform)).toEqual([]);
  });

  it('keeps the synthetic fixture aligned with the configured grid size', () => {
    expect(createPressureFrame().samples).toHaveLength(WIND_GRID_COLUMNS * WIND_GRID_ROWS);
  });
});
