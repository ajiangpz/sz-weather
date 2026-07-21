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

interface WindParticleStreak {
  id: string;
  path: Array<[number, number]>;
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

const createParticleStreaks = (streams: WindStream[], particlePhase: number): WindParticleStreak[] => streams
  .filter((_, index) => index % 6 === 0)
  .map((stream, index) => {
    const initialPhase = ((index * 0.61803398875) % 1);
    const progress = (initialPhase + particlePhase * (0.045 + stream.speed * 0.004)) % 1;
    const tailProgress = Math.max(0, progress - 0.028);
    return {
      id: stream.id,
      speed: stream.speed,
      path: [interpolatePoint(stream.path, tailProgress), interpolatePoint(stream.path, progress)],
    };
  });

export const createWindFieldLayers = ({ streams, opacity, visible, particlePhase = 0 }: WindFieldLayerInput): Layer[] => [
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines-glow',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: [26, 133, 214, 28],
    getWidth: 1.25,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: opacity * 0.35,
    visible,
    pickable: false,
  }),
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: (stream) => getWindStreamColor(stream.speed),
    getWidth: (stream) => Math.min(0.68, 0.28 + stream.speed * 0.058),
    widthUnits: 'pixels',
    widthMinPixels: 0.32,
    widthMaxPixels: 0.68,
    jointRounded: true,
    capRounded: true,
    opacity: Math.min(1, opacity * 1.35),
    visible,
    pickable: false,
  }),
  new PathLayer<WindParticleStreak>({
    id: 'deck-wind-particle-streaks',
    data: createParticleStreaks(streams, particlePhase),
    getPath: (particle) => particle.path,
    getColor: (particle) => particle.speed >= 5 ? [178, 244, 255, 245] : [101, 218, 255, 225],
    getWidth: (particle) => Math.min(1.35, 0.86 + particle.speed * 0.07),
    widthUnits: 'pixels',
    widthMinPixels: 0.9,
    widthMaxPixels: 1.35,
    jointRounded: true,
    capRounded: true,
    opacity: Math.min(1, opacity * 2),
    visible,
    pickable: false,
  }),
];
