import { describe, expect, it } from 'vitest';

import {
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  buildOpenMeteoWindGridUrl,
  createWindGridPoints,
  createWindGridSnapshot,
  meteorologicalWindToVector,
} from './openMeteoWindGrid';

const createPayload = () => {
  const points = createWindGridPoints();
  const start = new Date('2026-08-12T10:00:00Z');
  const times = Array.from({ length: 25 }, (_, index) => new Date(start.getTime() + index * 15 * 60 * 1000).toISOString().slice(0, 16));

  return points.map((point, pointIndex) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    current: { time: times[12] },
    minutely_15: {
      time: times,
      wind_speed_10m: times.map((_, frameIndex) => 2.5 + (pointIndex % WIND_GRID_COLUMNS) * 0.08 + frameIndex * 0.03),
      wind_direction_10m: times.map((_, frameIndex) => 80 + (pointIndex % WIND_GRID_COLUMNS) * 2 + frameIndex),
      precipitation: times.map((_, frameIndex) => Math.max(0, ((pointIndex % WIND_GRID_COLUMNS) % 5 - 1) * 0.08 + (frameIndex - 8) * 0.025)),
      temperature_2m: times.map((_, frameIndex) => 16.5 + (pointIndex % WIND_GRID_COLUMNS) * 0.75 + frameIndex * 0.04),
      relative_humidity_2m: times.map((_, frameIndex) => 82 - Math.floor(pointIndex / WIND_GRID_COLUMNS) * 3 - frameIndex * 0.12),
      surface_pressure: times.map((_, frameIndex) => 1002.5 + (pointIndex % WIND_GRID_COLUMNS) * 0.25 + Math.floor(pointIndex / WIND_GRID_COLUMNS) * 0.2 + frameIndex * 0.02),
    },
  }));
};

describe('Open-Meteo forecast grid adapter', () => {
  it('creates a China-scale sampling grid', () => {
    const points = createWindGridPoints();
    expect(WIND_GRID_COLUMNS).toBe(12);
    expect(WIND_GRID_ROWS).toBe(8);
    expect(points).toHaveLength(WIND_GRID_COLUMNS * WIND_GRID_ROWS);
    expect(new Set(points.map((point) => point.longitude)).size).toBe(WIND_GRID_COLUMNS);
    expect(new Set(points.map((point) => point.latitude)).size).toBe(WIND_GRID_ROWS);
  });

  it('requests wind and scalar forecast fields in one multi-coordinate request', () => {
    const url = new URL(buildOpenMeteoWindGridUrl());
    const expectedCount = WIND_GRID_COLUMNS * WIND_GRID_ROWS;
    expect(url.pathname).toBe('/v1/forecast');
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')?.split(',')).toHaveLength(expectedCount);
    expect(url.searchParams.get('longitude')?.split(',')).toHaveLength(expectedCount);
    expect(url.searchParams.get('minutely_15')).toBe(
      'wind_speed_10m,wind_direction_10m,precipitation,temperature_2m,relative_humidity_2m,surface_pressure',
    );
    expect(url.searchParams.get('past_minutely_15')).toBe('12');
    expect(url.searchParams.get('forecast_minutely_15')).toBe('13');
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
    expect(url.searchParams.get('precipitation_unit')).toBe('mm');
    expect(url.searchParams.get('cell_selection')).toBe('nearest');
  });

  it('routes the full multi-coordinate grid through the GFS endpoint', () => {
    const url = new URL(buildOpenMeteoWindGridUrl('gfs'));
    expect(url.pathname).toBe('/v1/gfs');
    expect(url.searchParams.get('latitude')?.split(',')).toHaveLength(WIND_GRID_COLUMNS * WIND_GRID_ROWS);
    expect(url.searchParams.get('forecast_minutely_15')).toBe('13');
  });

  it('converts meteorological direction-from bearings to motion vectors', () => {
    const northWind = meteorologicalWindToVector(5, 0);
    expect(northWind.u).toBeCloseTo(0, 6);
    expect(northWind.v).toBeCloseTo(-5, 6);

    const eastWind = meteorologicalWindToVector(4, 90);
    expect(eastWind.u).toBeCloseTo(-4, 6);
    expect(eastWind.v).toBeCloseTo(0, 6);
  });

  it('normalizes all scalar and vector values into the same centered 25-frame grid', () => {
    const payload = createPayload();
    const snapshot = createWindGridSnapshot(
      payload,
      new Date('2026-08-12T10:05:00Z'),
      'Open-Meteo GFS forecast grid',
    );
    expect(snapshot.frames).toHaveLength(25);
    expect(snapshot.currentIndex).toBe(12);
    expect(snapshot.frames[12].samples).toHaveLength(WIND_GRID_COLUMNS * WIND_GRID_ROWS);
    expect(snapshot.frames[12].samples.every((sample) => (
      Number.isFinite(sample.u)
      && Number.isFinite(sample.v)
      && Number.isFinite(sample.precipitation)
      && Number.isFinite(sample.temperature)
      && Number.isFinite(sample.humidity)
      && Number.isFinite(sample.pressure)
      && sample.precipitation >= 0
      && sample.humidity >= 0
      && sample.humidity <= 100
      && sample.pressure > 900
      && sample.pressure < 1100
    ))).toBe(true);
    expect(snapshot.frames[12].timestamp).toBe(payload[0].current.time);
    expect(snapshot.source).toBe('Open-Meteo GFS forecast grid');
  });
});
