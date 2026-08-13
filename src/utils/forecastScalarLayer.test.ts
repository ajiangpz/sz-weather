import { describe, expect, it } from 'vitest';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import { sampleForecastScalar } from './forecastScalarLayer';

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
      precipitation: 0.5,
      temperature: 24 + column + row * 2,
      humidity: 60 + column * 4 + row * 6,
      pressure: 1004,
    };
  }),
});

describe('forecast scalar fields', () => {
  it('returns exact temperature and humidity at grid points', () => {
    const frame = createFrame();
    expect(sampleForecastScalar(frame, 'temperature', WIND_GRID_BOUNDS.west, WIND_GRID_BOUNDS.south)).toBeCloseTo(24, 6);
    expect(sampleForecastScalar(frame, 'humidity', WIND_GRID_BOUNDS.east, WIND_GRID_BOUNDS.north)).toBeCloseTo(88, 6);
  });

  it('bilinearly interpolates continuous scalar values', () => {
    const frame = createFrame();
    const longitude = (WIND_GRID_BOUNDS.west + WIND_GRID_BOUNDS.east) / 2;
    const latitude = (WIND_GRID_BOUNDS.south + WIND_GRID_BOUNDS.north) / 2;
    expect(sampleForecastScalar(frame, 'temperature', longitude, latitude)).toBeCloseTo(28, 6);
    expect(sampleForecastScalar(frame, 'humidity', longitude, latitude)).toBeCloseTo(74, 6);
  });

  it('clamps out-of-grid coordinates to the field boundary', () => {
    const frame = createFrame();
    expect(sampleForecastScalar(frame, 'temperature', WIND_GRID_BOUNDS.west - 2, WIND_GRID_BOUNDS.south - 2)).toBeCloseTo(24, 6);
    expect(sampleForecastScalar(frame, 'humidity', WIND_GRID_BOUNDS.east + 2, WIND_GRID_BOUNDS.north + 2)).toBeCloseTo(88, 6);
  });
});
