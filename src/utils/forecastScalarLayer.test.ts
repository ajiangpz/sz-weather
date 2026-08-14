import { describe, expect, it } from 'vitest';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import { getForecastScalarColor, sampleForecastScalar } from './forecastScalarLayer';

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

const northEastTemperature = 24 + (WIND_GRID_COLUMNS - 1) + (WIND_GRID_ROWS - 1) * 2;
const northEastHumidity = 60 + (WIND_GRID_COLUMNS - 1) * 4 + (WIND_GRID_ROWS - 1) * 6;
const centerTemperature = (24 + northEastTemperature) / 2;
const centerHumidity = (60 + northEastHumidity) / 2;

describe('forecast scalar fields', () => {
  it('returns exact temperature and humidity at China grid boundaries', () => {
    const frame = createFrame();
    expect(sampleForecastScalar(frame, 'temperature', WIND_GRID_BOUNDS.west, WIND_GRID_BOUNDS.south)).toBeCloseTo(24, 6);
    expect(sampleForecastScalar(frame, 'humidity', WIND_GRID_BOUNDS.east, WIND_GRID_BOUNDS.north)).toBeCloseTo(northEastHumidity, 6);
  });

  it('bilinearly interpolates continuous scalar values', () => {
    const frame = createFrame();
    const longitude = (WIND_GRID_BOUNDS.west + WIND_GRID_BOUNDS.east) / 2;
    const latitude = (WIND_GRID_BOUNDS.south + WIND_GRID_BOUNDS.north) / 2;
    expect(sampleForecastScalar(frame, 'temperature', longitude, latitude)).toBeCloseTo(centerTemperature, 6);
    expect(sampleForecastScalar(frame, 'humidity', longitude, latitude)).toBeCloseTo(centerHumidity, 6);
  });

  it('clamps out-of-grid coordinates to the China field boundary', () => {
    const frame = createFrame();
    expect(sampleForecastScalar(frame, 'temperature', WIND_GRID_BOUNDS.west - 2, WIND_GRID_BOUNDS.south - 2)).toBeCloseTo(24, 6);
    expect(sampleForecastScalar(frame, 'humidity', WIND_GRID_BOUNDS.east + 2, WIND_GRID_BOUNDS.north + 2)).toBeCloseTo(northEastHumidity, 6);
  });

  it('uses a full-range semantic temperature scale and clamps its extremes', () => {
    expect(getForecastScalarColor('temperature', -30)).toEqual([87, 48, 168, 158]);
    expect(getForecastScalarColor('temperature', 20)).toEqual([230, 210, 75, 158]);
    expect(getForecastScalarColor('temperature', 50)).toEqual([164, 38, 84, 158]);
    expect(getForecastScalarColor('temperature', -80)).toEqual(getForecastScalarColor('temperature', -30));
    expect(getForecastScalarColor('temperature', 70)).toEqual(getForecastScalarColor('temperature', 50));
  });

  it('uses a dry-to-moist humidity scale over the complete percentage domain', () => {
    expect(getForecastScalarColor('humidity', 0)).toEqual([151, 91, 45, 144]);
    expect(getForecastScalarColor('humidity', 60)).toEqual([115, 190, 154, 144]);
    expect(getForecastScalarColor('humidity', 100)).toEqual([54, 67, 166, 144]);
    expect(getForecastScalarColor('humidity', -10)).toEqual(getForecastScalarColor('humidity', 0));
    expect(getForecastScalarColor('humidity', 120)).toEqual(getForecastScalarColor('humidity', 100));
  });
});
