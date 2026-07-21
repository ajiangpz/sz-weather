import type { Layer } from '@deck.gl/core';
import { PathLayer, TextLayer } from '@deck.gl/layers';

import type { WindStream } from '@/types/weather';

export interface WindFieldLayerInput {
  streams: WindStream[];
  opacity: number;
  visible: boolean;
  particlePhase?: number;
}

export const getWindStreamColor = (speed: number): [number, number, number, number] => {
  if (speed >= 5) return [126, 231, 255, 220];
  if (speed >= 3.5) return [94, 193, 255, 205];
  return [92, 157, 220, 180];
};

interface WindDirectionParticle {
  id: string;
  position: [number, number];
  angle: number;
  speed: number;
}

const createDirectionParticles = (streams: WindStream[], particlePhase: number): WindDirectionParticle[] => streams
  .filter((_, index) => index % 3 === 0)
  .map((stream, index) => {
  const travelRange = Math.max(1, stream.path.length - 6);
  const pointIndex = 3 + (Math.floor(particlePhase) + index * 5) % travelRange;
  const previous = stream.path[pointIndex - 1];
  const position = stream.path[pointIndex];
  const next = stream.path[pointIndex + 1];
  const angle = Math.atan2(next[1] - previous[1], next[0] - previous[0]) * 180 / Math.PI;
  return { id: stream.id, position, angle, speed: stream.speed };
});

export const createWindFieldLayers = ({ streams, opacity, visible, particlePhase = 0 }: WindFieldLayerInput): Layer[] => [
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines-glow',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: [30, 142, 225, 48],
    getWidth: 1.8,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: opacity * 0.45,
    visible,
    pickable: false,
  }),
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: (stream) => getWindStreamColor(stream.speed),
    getWidth: (stream) => Math.min(0.88, 0.32 + stream.speed * 0.075),
    widthUnits: 'pixels',
    widthMinPixels: 0.38,
    widthMaxPixels: 0.88,
    jointRounded: true,
    capRounded: true,
    opacity,
    visible,
    pickable: false,
  }),
  new TextLayer<WindDirectionParticle>({
    id: 'deck-wind-direction-particles',
    data: createDirectionParticles(streams, particlePhase),
    getPosition: (particle) => particle.position,
    getText: () => '➤',
    getAngle: (particle) => -particle.angle,
    getColor: (particle) => getWindStreamColor(particle.speed),
    getSize: (particle) => 5.5 + particle.speed * 0.32,
    sizeUnits: 'pixels',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 700,
    characterSet: ['➤'],
    billboard: false,
    opacity: Math.min(1, opacity * 1.7),
    visible,
    pickable: false,
  }),
];
