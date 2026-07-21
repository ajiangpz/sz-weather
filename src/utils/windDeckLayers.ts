import type { Layer } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';

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

export const createWindFieldLayer = ({ streams, opacity, visible }: WindFieldLayerInput): Layer =>
  new PathLayer<WindStream>({
    id: 'deck-wind-streamlines',
    data: streams,
    getPath: (stream) => stream.path,
    getColor: (stream) => getWindStreamColor(stream.speed),
    getWidth: (stream) => Math.min(2.4, 0.8 + stream.speed * 0.22),
    widthUnits: 'pixels',
    widthMinPixels: 0.8,
    widthMaxPixels: 2.4,
    jointRounded: true,
    capRounded: true,
    opacity,
    visible,
    pickable: false,
  });
