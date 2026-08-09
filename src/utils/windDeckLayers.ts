import type { Layer } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';

import type { WindStream } from '@/types/weather';

export interface WindFieldLayerInput {
  streams: WindStream[];
  opacity: number;
  visible: boolean;
  particlePhase?: number;
}

export const getWindStreamColor = (speed: number): [number, number, number, number] => {
  if (speed >= 5) return [118, 222, 255, 165];
  if (speed >= 3.5) return [82, 181, 244, 135];
  return [76, 139, 204, 105];
};

export interface WindParticleStreak {
  id: string;
  path: Array<[number, number]>;
  headPath: Array<[number, number]>;
  speed: number;
  lifecycleAlpha: number;
}

export interface WindParticleSegment {
  id: string;
  path: [[number, number], [number, number]];
  speed: number;
  alpha: number;
  widthScale: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const particleNoise = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const interpolatePoint = (path: Array<[number, number]>, progress: number): [number, number] => {
  const scaled = Math.max(0, Math.min(0.9999, progress)) * (path.length - 1);
  const index = Math.floor(scaled);
  const ratio = scaled - index;
  const start = path[index];
  const end = path[Math.min(path.length - 1, index + 1)];
  return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio];
};

export const shouldRenderWindParticle = (index: number) => particleNoise(index, 1.7) < 0.46;

// WeatherMapPanel currently redraws the wind layer on a throttled cadence. Keep the
// phase rate high enough that the visible particle speed still tracks wind speed.
export const getWindParticleRate = (speed: number) => 0.42 + Math.max(0, speed) * 0.065;

export const getWindLifecycleAlpha = (progress: number) => {
  const fadeIn = clamp01(progress / 0.09);
  const fadeOut = clamp01((1 - progress) / 0.12);
  return Math.min(fadeIn, fadeOut);
};

export const createWindParticleStreaks = (
  streams: WindStream[],
  particlePhase: number,
): WindParticleStreak[] => streams.flatMap((stream, streamIndex) => {
  if (!shouldRenderWindParticle(streamIndex) || stream.path.length < 6) return [];

  const initialPhase = particleNoise(streamIndex, 3.1);
  const progress = (initialPhase + particlePhase * getWindParticleRate(stream.speed)) % 1;
  const trailSpan = Math.min(0.12, 0.072 + stream.speed * 0.007);
  const sampleCount = 7;
  const startProgress = Math.max(0, progress - trailSpan);
  const path = Array.from({ length: sampleCount }, (_, sampleIndex) => {
    const ratio = sampleIndex / (sampleCount - 1);
    return interpolatePoint(stream.path, startProgress + (progress - startProgress) * ratio);
  });

  return [{
    id: stream.id,
    speed: stream.speed,
    path,
    headPath: path.slice(-2),
    lifecycleAlpha: getWindLifecycleAlpha(progress),
  }];
});

export const createWindParticleSegments = (particles: WindParticleStreak[]): WindParticleSegment[] => particles.flatMap((particle) => {
  const segmentCount = particle.path.length - 1;
  return particle.path.slice(1).map((point, segmentIndex) => {
    const headRatio = (segmentIndex + 1) / segmentCount;
    return {
      id: `${particle.id}-segment-${segmentIndex}`,
      path: [particle.path[segmentIndex], point],
      speed: particle.speed,
      alpha: particle.lifecycleAlpha * (0.16 + headRatio * 0.84),
      widthScale: 0.58 + headRatio * 0.42,
    };
  });
});

export const createWindFieldLayers = ({ streams, opacity, visible, particlePhase = 0 }: WindFieldLayerInput): Layer[] => {
  const particles = createWindParticleStreaks(streams, particlePhase);
  const segments = createWindParticleSegments(particles);

  return [
    new PathLayer<WindParticleSegment>({
      id: 'deck-wind-particle-trails',
      data: segments,
      getPath: (segment) => segment.path,
      getColor: (segment) => {
        const [red, green, blue] = getWindStreamColor(segment.speed);
        const baseAlpha = segment.speed >= 5 ? 148 : 122;
        return [red, green, blue, Math.round(baseAlpha * segment.alpha)];
      },
      getWidth: (segment) => Math.min(1.05, (0.5 + segment.speed * 0.05) * segment.widthScale),
      widthUnits: 'pixels',
      widthMinPixels: 0.46,
      widthMaxPixels: 1.05,
      jointRounded: true,
      capRounded: true,
      opacity: Math.min(0.76, opacity * 0.86),
      visible,
      pickable: false,
    }),
    new PathLayer<WindParticleStreak>({
      id: 'deck-wind-particle-heads',
      data: particles,
      getPath: (particle) => particle.headPath,
      getColor: (particle) => particle.speed >= 5
        ? [188, 244, 255, Math.round(224 * particle.lifecycleAlpha)]
        : [104, 211, 248, Math.round(194 * particle.lifecycleAlpha)],
      getWidth: (particle) => Math.min(1.22, 0.76 + particle.speed * 0.068),
      widthUnits: 'pixels',
      widthMinPixels: 0.78,
      widthMaxPixels: 1.22,
      jointRounded: true,
      capRounded: true,
      opacity: Math.min(0.9, opacity * 1.12),
      visible,
      pickable: false,
    }),
  ];
};
