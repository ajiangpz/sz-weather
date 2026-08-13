import { describe, expect, it } from 'vitest';

import { createWindGridPoints, meteorologicalWindToVector, type WindGridFrame } from '@/services/openMeteoWindGrid';
import { createForecastWindStreams, sampleForecastWindVector } from './liveWindField';

const createFrame = (direction: number, speed = 4): WindGridFrame => ({
  timestamp: '2026-08-12T16:00',
  time: '16:00',
  samples: createWindGridPoints().map((point, index) => {
    const localSpeed = speed + (index % 5) * 0.08;
    const vector = meteorologicalWindToVector(localSpeed, direction + Math.floor(index / 5) * 3);
    return {
      ...point,
      speed: localSpeed,
      direction,
      precipitation: 0,
      temperature: 29,
      humidity: 80,
      pressure: 1004,
      ...vector,
    };
  }),
});

describe('forecast wind field', () => {
  it('interpolates nearby forecast wind samples', () => {
    const frame = createFrame(270, 4);
    const sample = frame.samples[7];
    const vector = sampleForecastWindVector(frame, sample.longitude, sample.latitude);
    expect(vector.speed).toBeCloseTo(sample.speed, 6);
    expect(vector.u).toBeCloseTo(sample.u, 6);
    expect(vector.v).toBeCloseTo(sample.v, 6);
  });

  it('traces a dense deterministic field through forecast vectors', () => {
    const streams = createForecastWindStreams(createFrame(270));
    expect(streams.length).toBeGreaterThanOrEqual(350);
    expect(streams.length).toBeLessThanOrEqual(374);
    expect(streams.every((stream) => stream.path.length >= 8)).toBe(true);
    expect(streams.every((stream) => stream.speed >= 4 && stream.speed < 5)).toBe(true);
  });

  it('changes streamline geometry when forecast direction changes', () => {
    const eastbound = createForecastWindStreams(createFrame(270));
    const southbound = createForecastWindStreams(createFrame(0));
    expect(eastbound[120].path).not.toEqual(southbound[120].path);
  });
});
