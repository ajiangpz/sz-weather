import type { Layer } from '@deck.gl/core';
import { PathLayer, TextLayer } from '@deck.gl/layers';

import type { WindStream } from '@/types/weather';

export interface WindFieldLayerInput {
  streams: WindStream[];
  opacity: number;
  visible: boolean;
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

const createDirectionParticles = (streams: WindStream[]): WindDirectionParticle[] => streams.map((stream, index) => {
  const pointIndex = 5 + index % 7;
  const previous = stream.path[pointIndex - 1];
  const position = stream.path[pointIndex];
  const next = stream.path[pointIndex + 1];
  const angle = Math.atan2(next[1] - previous[1], next[0] - previous[0]) * 180 / Math.PI;
  return { id: stream.id, position, angle, speed: stream.speed };
});

export const createWindFieldLayers = ({ streams, opacity, visible }: WindFieldLayerInput): Layer[] => [
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines-glow',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: [35, 151, 235, 72],
    getWidth: 2.8,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: opacity * 0.7,
    visible,
    pickable: false,
  }),
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: (stream) => getWindStreamColor(stream.speed),
    getWidth: (stream) => Math.min(1.35, 0.45 + stream.speed * 0.12),
    widthUnits: 'pixels',
    widthMinPixels: 0.55,
    widthMaxPixels: 1.35,
    jointRounded: true,
    capRounded: true,
    opacity,
    visible,
    pickable: false,
  }),
  new TextLayer<WindDirectionParticle>({
    id: 'deck-wind-direction-particles',
    data: createDirectionParticles(streams),
    getPosition: (particle) => particle.position,
    getText: () => '➤',
    getAngle: (particle) => -particle.angle,
    getColor: (particle) => getWindStreamColor(particle.speed),
    getSize: (particle) => 10 + particle.speed * 0.55,
    sizeUnits: 'pixels',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 700,
    characterSet: ['➤'],
    billboard: false,
    opacity: Math.min(1, opacity * 1.35),
    visible,
    pickable: false,
  }),
];
