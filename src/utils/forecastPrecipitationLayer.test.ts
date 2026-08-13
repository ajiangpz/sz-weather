import { describe, expect, it } from 'vitest';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import { sampleForecastPrecipitation } from './forecastPrecipitationLayer';

const createFrame = (): WindGridFrame => ({
  timestamp: '2026-08-12T16:00',
  time: '16:00',
  samples: Array.from({ length: WIND_GRID_COLUMNS * WIND_GRID_ROWS }, (_, index) => {
    const row = Math.floor(index / WIND_GRID_COLUMNS);
    const column = index % WIND_GRID_COLUMNS;
    return {
      longitude: WIND_GRID_BOUNDS.west + column * (WIND_GRID_BOUNDS.east - WIND_GRID_BOUNDS.west) / (WIND_GRID_COLUMNS - 1),
      latitude: WIND_GRID_BOUNDS.south + row * (WIND_GRID_BOUNDS.north - WIND_GRID_BOUNDS.south) / (WIND_GRID_ROWS - 1),
      speed: 4,
      direction: 270,
      u: 4,
      v: 0,
      precipitation: column + row * 2,
      temperature: 29,
      humidity: 80,
      pressure: 1004,
    };
  }),
});

describe('forecast precipitation field', () => {
  it('returns exact values at sampling-grid points', () => {
    const frame = createFrame();
    expect(sampleForecastPrecipitation(frame, WIND_GRID_BOUNDS.west, WIND_GRID_BOUNDS.south)).toBeCloseTo(0, 6);
    expect(sampleForecastPrecipitation(frame, WIND_GRID_BOUNDS.east, WIND_GRID_BOUNDS.north)).toBeCloseTo(8, 6);
  });

  it('bilinearly interpolates a continuous value between grid points', () => {
    const frame = createFrame();
    const longitude = (WIND_GRID_BOUNDS.west + WIND_GRID_BOUNDS.east) / 2;
    const latitude = (WIND_GRID_BOUNDS.south + WIND_GRID_BOUNDS.north) / 2;
    expect(sampleForecastPrecipitation(frame, longitude, latitude)).toBeCloseTo(4, 6);
  });

  it('clamps sampling to the forecast-grid boundary', () => {
    const frame = createFrame();
    expect(sampleForecastPrecipitation(frame, WIND_GRID_BOUNDS.west - 5, WIND_GRID_BOUNDS.south - 5)).toBeCloseTo(0, 6);
    expect(sampleForecastPrecipitation(frame, WIND_GRID_BOUNDS.east + 5, WIND_GRID_BOUNDS.north + 5)).toBeCloseTo(8, 6);
  });
});
