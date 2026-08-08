import { describe, expect, it } from 'vitest';

import type { WindStream } from '@/types/weather';
import {
  createWindParticleStreaks,
  getWindParticleRate,
  getWindStreamColor,
} from './windDeckLayers';

const createStream = (id: string, speed: number, offset: number): WindStream => ({
  id,
  speed,
  bearing: 0,
  path: Array.from({ length: 20 }, (_, index) => [113.8 + offset + index * 0.01, 22.5 + index * 0.002]),
});

describe('wind deck layers', () => {
  it('uses brighter colors for faster wind', () => {
    expect(getWindStreamColor(2)).toEqual([76, 139, 204, 105]);
    expect(getWindStreamColor(4)).toEqual([82, 181, 244, 135]);
    expect(getWindStreamColor(6)).toEqual([118, 222, 255, 165]);
  });

  it('moves faster particles farther per animation phase', () => {
    expect(getWindParticleRate(6)).toBeGreaterThan(getWindParticleRate(2));
  });

  it('keeps only a sparse set of short particle trails', () => {
    const streams = Array.from({ length: 12 }, (_, index) => createStream(`wind-${index}`, 3 + index * 0.2, index * 0.001));
    const particles = createWindParticleStreaks(streams, 0.6);

    expect(particles).toHaveLength(4);
    particles.forEach((particle) => {
      expect(particle.path).toHaveLength(5);
      expect(particle.headPath).toEqual(particle.path.slice(-2));

      const source = streams.find((stream) => stream.id === particle.id);
      expect(source).toBeDefined();
      expect(particle.path[0]).not.toEqual(source?.path[0]);
      expect(particle.path.at(-1)).not.toEqual(source?.path.at(-1));
    });
  });
});
