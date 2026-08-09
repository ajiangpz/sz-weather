import { describe, expect, it } from 'vitest';

import type { WindStream } from '@/types/weather';
import {
  createWindParticleSegments,
  createWindParticleStreaks,
  getWindLifecycleAlpha,
  getWindParticleRate,
  getWindStreamColor,
  shouldRenderWindParticle,
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

  it('uses deterministic non-grid particle selection around the target density', () => {
    const selected = Array.from({ length: 300 }, (_, index) => index).filter(shouldRenderWindParticle);
    expect(selected.length).toBeGreaterThanOrEqual(120);
    expect(selected.length).toBeLessThanOrEqual(180);
    expect(selected.slice(0, 6)).not.toEqual([0, 3, 6, 9, 12, 15]);
  });

  it('fades particles near lifecycle boundaries', () => {
    expect(getWindLifecycleAlpha(0.01)).toBeLessThan(0.2);
    expect(getWindLifecycleAlpha(0.5)).toBe(1);
    expect(getWindLifecycleAlpha(0.99)).toBeLessThan(0.2);
  });

  it('creates short multi-segment trails with a brighter visual head', () => {
    const streams = Array.from({ length: 12 }, (_, index) => createStream(`wind-${index}`, 3 + index * 0.2, index * 0.001));
    const particles = createWindParticleStreaks(streams, 0.6);
    const segments = createWindParticleSegments(particles);

    expect(particles).toHaveLength(3);
    particles.forEach((particle) => {
      expect(particle.path).toHaveLength(7);
      expect(particle.headPath).toEqual(particle.path.slice(-2));

      const source = streams.find((stream) => stream.id === particle.id);
      expect(source).toBeDefined();
      expect(particle.path[0]).not.toEqual(source?.path[0]);
      expect(particle.path.at(-1)).not.toEqual(source?.path.at(-1));
    });

    expect(segments).toHaveLength(particles.length * 6);
    const firstParticleSegments = segments.filter((segment) => segment.id.startsWith(`${particles[0].id}-segment-`));
    expect(firstParticleSegments.at(-1)?.alpha).toBeGreaterThan(firstParticleSegments[0].alpha);
    expect(firstParticleSegments.at(-1)?.widthScale).toBeGreaterThan(firstParticleSegments[0].widthScale);
  });
});
