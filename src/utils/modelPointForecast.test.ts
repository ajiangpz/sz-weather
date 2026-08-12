import { describe, expect, it } from 'vitest';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  meteorologicalWindToVector,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import {
  createModelPointForecastSummary,
  formatWindDirection,
  vectorToMeteorologicalDirection,
} from './modelPointForecast';

const createFrames = (): WindGridFrame[] => Array.from({ length: 6 }, (_, frameIndex) => ({
  timestamp: `2026-08-12T${String(13 + Math.floor(frameIndex / 4)).padStart(2, '0')}:${String((frameIndex % 4) * 15).padStart(2, '0')}`,
  time: `${String(13 + Math.floor(frameIndex / 4)).padStart(2, '0')}:${String((frameIndex % 4) * 15).padStart(2, '0')}`,
  samples: Array.from({ length: WIND_GRID_COLUMNS * WIND_GRID_ROWS }, (_, index) => {
    const row = Math.floor(index / WIND_GRID_COLUMNS);
    const column = index % WIND_GRID_COLUMNS;
    const longitude = WIND_GRID_BOUNDS.west
      + column * (WIND_GRID_BOUNDS.east - WIND_GRID_BOUNDS.west) / (WIND_GRID_COLUMNS - 1);
    const latitude = WIND_GRID_BOUNDS.south
      + row * (WIND_GRID_BOUNDS.north - WIND_GRID_BOUNDS.south) / (WIND_GRID_ROWS - 1);
    const { u, v } = meteorologicalWindToVector(4 + column * 0.1, 270);
    return {
      longitude,
      latitude,
      speed: 4 + column * 0.1,
      direction: 270,
      u,
      v,
      precipitation: 0.25 + frameIndex * 0.25 + column * 0.05,
    };
  }),
}));

describe('model point forecast summary', () => {
  it('converts vector components back to meteorological direction-from bearings', () => {
    expect(vectorToMeteorologicalDirection(0, -5)).toBeCloseTo(0, 6);
    expect(vectorToMeteorologicalDirection(-5, 0)).toBeCloseTo(90, 6);
    expect(vectorToMeteorologicalDirection(0, 5)).toBeCloseTo(180, 6);
    expect(vectorToMeteorologicalDirection(5, 0)).toBeCloseTo(270, 6);
  });

  it('formats eight-way Chinese wind direction labels', () => {
    expect(formatWindDirection(0)).toBe('北风');
    expect(formatWindDirection(92)).toBe('东风');
    expect(formatWindDirection(224)).toBe('西南风');
    expect(formatWindDirection(315)).toBe('西北风');
  });

  it('derives the 15-minute amount, equivalent rate and preceding-hour accumulation', () => {
    const frames = createFrames();
    const longitude = WIND_GRID_BOUNDS.west;
    const latitude = WIND_GRID_BOUNDS.south;
    const summary = createModelPointForecastSummary({
      frames,
      frameIndex: 4,
      longitude,
      latitude,
    });

    expect(summary).not.toBeNull();
    expect(summary?.precipitation15m).toBeCloseTo(1.25, 6);
    expect(summary?.rainfallIntensity).toBeCloseTo(5, 6);
    expect(summary?.rainfall1h).toBeCloseTo(3.5, 6);
    expect(summary?.windSpeed).toBeCloseTo(4, 6);
    expect(summary?.windDirection).toBe('西风');
  });
});
