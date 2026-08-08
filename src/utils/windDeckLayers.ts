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
}

const interpolatePoint = (path: Array<[number, number]>, progress: number): [number, number] => {
  const scaled = Math.max(0, Math.min(0.9999, progress)) * (path.length - 1);
  const index = Math.floor(scaled);
  const ratio = scaled - index;
  const start = path[index];
  const end = path[Math.min(path.length - 1, index + 1)];
  return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio];
};

export const getWindParticleRate = (speed: number) => 0.11 + Math.max(0, speed) * 0.017;

export const createWindParticleStreaks = (
  streams: WindStream[],
  particlePhase: number,
): WindParticleStreak[] => streams
  .filter((stream, index) => index % 3 === 0 && stream.path.length >= 6)
  .map((stream, index) => {
    const initialPhase = (index * 0.61803398875) % 1;
    const progress = (initialPhase + particlePhase * getWindParticleRate(stream.speed)) % 1;
    const trailSpan = Math.min(0.052, 0.034 + stream.speed * 0.0026);
    const sampleCount = 5;
    const startProgress = Math.max(0, progress - trailSpan);
    const path = Array.from({ length: sampleCount }, (_, sampleIndex) => {
      const ratio = sampleIndex / (sampleCount - 1);
      return interpolatePoint(stream.path, startProgress + (progress - startProgress) * ratio);
    });

    return {
      id: stream.id,
      speed: stream.speed,
      path,
      headPath: path.slice(-2),
    };
  });

export const createWindFieldLayers = ({ streams, opacity, visible, particlePhase = 0 }: WindFieldLayerInput): Layer[] => {
  const particles = createWindParticleStreaks(streams, particlePhase);

  return [
    new PathLayer<WindParticleStreak>({
      id: 'deck-wind-particle-trails',
      data: particles,
      getPath: (particle) => particle.path,
      getColor: (particle) => {
        const [red, green, blue] = getWindStreamColor(particle.speed);
        return [red, green, blue, particle.speed >= 5 ? 105 : 78];
      },
      getWidth: (particle) => Math.min(0.86, 0.45 + particle.speed * 0.055),
      widthUnits: 'pixels',
      widthMinPixels: 0.45,
      widthMaxPixels: 0.86,
      jointRounded: true,
      capRounded: true,
      opacity: Math.min(0.7, opacity * 0.82),
      visible,
      pickable: false,
    }),
    new PathLayer<WindParticleStreak>({
      id: 'deck-wind-particle-heads',
      data: particles,
      getPath: (particle) => particle.headPath,
      getColor: (particle) => particle.speed >= 5
        ? [188, 244, 255, 220]
        : [104, 211, 248, 185],
      getWidth: (particle) => Math.min(1.15, 0.72 + particle.speed * 0.065),
      widthUnits: 'pixels',
      widthMinPixels: 0.74,
      widthMaxPixels: 1.15,
      jointRounded: true,
      capRounded: true,
      opacity: Math.min(0.86, opacity * 1.08),
      visible,
      pickable: false,
    }),
  ];
};
