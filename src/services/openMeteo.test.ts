import { describe, expect, it } from 'vitest';

import {
  REFERENCE_FORECAST_COORDINATES,
  buildOpenMeteoForecastUrl,
  createForecastSnapshot,
  weatherCodeToCondition,
  type OpenMeteoForecastResponse,
} from './openMeteo';

const createPayload = (): OpenMeteoForecastResponse => {
  const start = new Date('2026-08-12T08:00:00Z');
  const times = Array.from({ length: 40 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    return timestamp.toISOString().slice(0, 16);
  });
  const currentIndex = 20;

  return {
    timezone: 'Asia/Shanghai',
    current: { time: times[currentIndex] },
    minutely_15: {
      time: times,
      temperature_2m: times.map((_, index) => 27 + index * 0.1),
      relative_humidity_2m: times.map((_, index) => 80 - index * 0.2),
      precipitation: times.map(() => 0.25),
      weather_code: times.map((_, index) => index === currentIndex ? 63 : 61),
      wind_speed_10m: times.map((_, index) => 3 + index * 0.05),
      wind_direction_10m: times.map((_, index) => 90 + index),
      surface_pressure: times.map((_, index) => 1004 + index * 0.1),
    },
  };
};

describe('Open-Meteo forecast adapter', () => {
  it('requests a 24-hour precipitation history and 15-minute Beijing reference window', () => {
    const url = new URL(buildOpenMeteoForecastUrl());
    expect(url.pathname).toBe('/v1/forecast');
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(Number(url.searchParams.get('latitude'))).toBeCloseTo(REFERENCE_FORECAST_COORDINATES.latitude, 4);
    expect(Number(url.searchParams.get('longitude'))).toBeCloseTo(REFERENCE_FORECAST_COORDINATES.longitude, 4);
    expect(url.searchParams.get('timezone')).toBe('Asia/Shanghai');
    expect(url.searchParams.get('past_minutely_15')).toBe('96');
    expect(url.searchParams.get('forecast_minutely_15')).toBe('13');
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
    expect(url.searchParams.get('minutely_15')).toContain('precipitation');
    expect(url.searchParams.get('minutely_15')).toContain('wind_speed_10m');
  });

  it('routes GFS through the dedicated Open-Meteo GFS endpoint', () => {
    const url = new URL(buildOpenMeteoForecastUrl('gfs'));
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.pathname).toBe('/v1/gfs');
    expect(url.searchParams.get('forecast_minutely_15')).toBe('13');
  });

  it('normalizes the live response into a centered 25-frame timeline', () => {
    const payload = createPayload();
    const fetchedAt = new Date('2026-08-12T08:30:00Z');
    const snapshot = createForecastSnapshot(payload, fetchedAt, 'Open-Meteo GFS');

    expect(snapshot.frames).toHaveLength(25);
    expect(snapshot.currentIndex).toBe(12);
    expect(snapshot.frames[12].timestamp).toBe(payload.current?.time);
    expect(snapshot.frames[12].condition).toBe('中雨');
    expect(snapshot.frames[12].rainfall1h).toBe(1);
    expect(snapshot.frames[12].rainfallIntensity).toBe(1);
    expect(snapshot.dashboardTrends.times).toHaveLength(25);
    expect(snapshot.dashboardTrends.windSpeed[12]).toBe(snapshot.frames[12].windSpeed);
    expect(snapshot.fetchedAt).toBe(fetchedAt);
    expect(snapshot.source).toBe('Open-Meteo GFS');
  });

  it('maps WMO weather codes to compact Chinese conditions', () => {
    expect(weatherCodeToCondition(0)).toBe('晴');
    expect(weatherCodeToCondition(3)).toBe('多云');
    expect(weatherCodeToCondition(61)).toBe('小雨');
    expect(weatherCodeToCondition(82)).toBe('大雨');
    expect(weatherCodeToCondition(95)).toBe('雷雨');
  });
});
