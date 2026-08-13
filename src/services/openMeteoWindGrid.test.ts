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
      wind_speed_10m: times.map((_, frameIndex) => 2.5 + pointIndex * 0.08 + frameIndex * 0.03),
      wind_direction_10m: times.map((_, frameIndex) => 80 + pointIndex * 2 + frameIndex),
      precipitation: times.map((_, frameIndex) => Math.max(0, (pointIndex % 5 - 1) * 0.08 + (frameIndex - 8) * 0.025)),
      temperature_2m: times.map((_, frameIndex) => 26.5 + (pointIndex % 5) * 0.45 + frameIndex * 0.04),
      relative_humidity_2m: times.map((_, frameIndex) => 88 - Math.floor(pointIndex / 5) * 4 - frameIndex * 0.15),
      surface_pressure: times.map((_, frameIndex) => 1002.5 + (pointIndex % 5) * 0.55 + Math.floor(pointIndex / 5) * 0.35 + frameIndex * 0.02),
    },
  }));
};

describe('Open-Meteo forecast grid adapter', () => {
  it('creates a compact 5x3 Shenzhen sampling grid', () => {
    const points = createWindGridPoints();
    expect(points).toHaveLength(WIND_GRID_COLUMNS * WIND_GRID_ROWS);
    expect(new Set(points.map((point) => point.longitude)).size).toBe(WIND_GRID_COLUMNS);
    expect(new Set(points.map((point) => point.latitude)).size).toBe(WIND_GRID_ROWS);
  });

  it('requests wind and scalar forecast fields in one multi-coordinate request', () => {
    const url = new URL(buildOpenMeteoWindGridUrl());
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')?.split(',')).toHaveLength(15);
    expect(url.searchParams.get('longitude')?.split(',')).toHaveLength(15);
    expect(url.searchParams.get('minutely_15')).toBe(
      'wind_speed_10m,wind_direction_10m,precipitation,temperature_2m,relative_humidity_2m,surface_pressure',
    );
    expect(url.searchParams.get('past_minutely_15')).toBe('12');
    expect(url.searchParams.get('forecast_minutely_15')).toBe('13');
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
    expect(url.searchParams.get('precipitation_unit')).toBe('mm');
    expect(url.searchParams.get('cell_selection')).toBe('nearest');
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
    const snapshot = createWindGridSnapshot(payload, new Date('2026-08-12T10:05:00Z'));
    expect(snapshot.frames).toHaveLength(25);
    expect(snapshot.currentIndex).toBe(12);
    expect(snapshot.frames[12].samples).toHaveLength(15);
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
  });
});
