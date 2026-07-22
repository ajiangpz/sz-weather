import type { Layer } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import type { FeatureCollection, Point } from 'geojson';

import type { RadarLevel } from '@/types/weather';

type DeckColor = [number, number, number, number];
type RadarPointProperties = {
  level?: RadarLevel;
  intensity?: number;
};

export type RadarBitmapBounds = [number, number, number, number];

export interface RadarBitmapOptions {
  points: FeatureCollection<Point, RadarPointProperties>;
  bounds: RadarBitmapBounds;
  width?: number;
  height?: number;
}

export interface RainRadarBitmapLayerInput {
  image: HTMLCanvasElement;
  bounds: RadarBitmapBounds;
  opacity: number;
  visible: boolean;
}

export interface RadarSampleOptions extends RadarBitmapOptions {
  longitude: number;
  latitude: number;
}

interface RadarSeed {
  x: number;
  y: number;
  strength: number;
  radiusX: number;
  radiusY: number;
  angle: number;
}

const radarColors: Record<RadarLevel, [number, number, number]> = {
  light: [75, 163, 255],
  moderate: [55, 214, 122],
  heavy: [244, 208, 63],
  storm: [245, 158, 66],
  severeStorm: [232, 76, 136],
};

const colorStops = [
  { value: 0.08, color: [22, 102, 205] },
  { value: 0.26, color: radarColors.light },
  { value: 0.48, color: radarColors.moderate },
  { value: 0.68, color: radarColors.heavy },
  { value: 0.84, color: radarColors.storm },
  { value: 1, color: radarColors.severeStorm },
] as const;

export const getRadarColor = (level: RadarLevel = 'light', opacity = 1): DeckColor => {
  const [red, green, blue] = radarColors[level];
  return [red, green, blue, Math.round(Math.max(0, Math.min(opacity, 1)) * 255)];
};

const interpolateColor = (value: number): [number, number, number] => {
  const upperIndex = colorStops.findIndex((stop) => value <= stop.value);
  const upper = colorStops[Math.max(0, upperIndex)];
  const lower = colorStops[Math.max(0, upperIndex - 1)];
  const range = Math.max(0.001, upper.value - lower.value);
  const ratio = Math.max(0, Math.min(1, (value - lower.value) / range));
  return upper.color.map((channel, index) => Math.round(lower.color[index] + (channel - lower.color[index]) * ratio)) as [number, number, number];
};

const textureNoise = (x: number, y: number): number => {
  const broad = Math.sin(x * 0.083 + y * 0.047) * 0.045;
  const fine = Math.sin(x * 0.31 - y * 0.19) * Math.cos(y * 0.23) * 0.025;
  return broad + fine;
};

const echoTexture = (x: number, y: number): number =>
  (Math.sin(x * 0.17 + y * 0.09) + Math.cos(y * 0.21 - x * 0.04) + Math.sin((x + y) * 0.071)) / 3;

const createRadarSeeds = (
  points: FeatureCollection<Point, RadarPointProperties>,
  bounds: RadarBitmapBounds,
  width: number,
  height: number,
): RadarSeed[] => {
  const [west, south, east, north] = bounds;
  const lowIntensityStride = Math.max(1, Math.ceil(points.features.length / 420));
  return points.features
    .filter((feature, index) => (feature.properties.intensity ?? 1) >= 16 || index % lowIntensityStride === 0)
    .map((feature, index) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const intensity = Math.max(1, feature.properties.intensity ?? 1);
      return {
        x: ((longitude - west) / (east - west)) * width,
        y: ((north - latitude) / (north - south)) * height,
        strength: Math.min(0.98, intensity >= 32 ? 0.82 + (intensity - 32) * 0.01 : intensity < 16 ? intensity / 36 : Math.pow(intensity / 48, 1.55)),
        radiusX: 8 + Math.sqrt(intensity) * 2.35 + (index % 3) * 1.4,
        radiusY: 5 + Math.sqrt(intensity) * 1.55 + (index % 4) * 0.9,
        angle: -0.36 + Math.sin(index * 1.73) * 0.34,
      };
    })
    .sort((left, right) => left.strength - right.strength);
};

const calculateRadarValue = (x: number, y: number, seeds: RadarSeed[]): number => {
  let field = 0;
  let peak = 0;
  for (const seed of seeds) {
    const dx = x - seed.x;
    const dy = y - seed.y;
    if (Math.abs(dx) > seed.radiusX * 2.5 || Math.abs(dy) > seed.radiusY * 2.5) continue;
    const cos = Math.cos(seed.angle);
    const sin = Math.sin(seed.angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const distance = (rx * rx) / (seed.radiusX * seed.radiusX) + (ry * ry) / (seed.radiusY * seed.radiusY);
    const contribution = seed.strength * Math.exp(-distance * 1.72);
    field += contribution;
    peak = Math.max(peak, contribution);
  }

  const density = 1 - Math.exp(-field * 0.13);
  const baseValue = peak * 0.84 + density * 0.1;
  const texture = echoTexture(x, y);
  const cellular = Math.sin(x * 0.73 + Math.cos(y * 0.19) * 2.1) * Math.cos(y * 0.61 - x * 0.08);
  const fragments = Math.sin(x * 0.43 + y * 0.27) * Math.cos(y * 0.37 - x * 0.16);
  const breakup = cellular * 0.055 + fragments * 0.025 + textureNoise(x, y) * 1.45;
  const value = Math.max(0, Math.min(1, baseValue + breakup * Math.min(1, field * 2.2)));
  const edgeThreshold = 0.082 + texture * 0.038 + cellular * 0.016 + fragments * 0.012;
  if (value < edgeThreshold) return 0;
  return Math.max(0, Math.min(1, value * (0.9 + texture * 0.16 + cellular * 0.06)));
};

const normalizedValueToRainfall = (value: number): number => {
  const stops = [[0, 0], [0.08, 0.1], [0.22, 2.5], [0.4, 8], [0.58, 16], [0.76, 32], [1, 50]] as const;
  const upperIndex = stops.findIndex(([stop]) => value <= stop);
  const upper = stops[Math.max(1, upperIndex)];
  const lower = stops[Math.max(0, upperIndex - 1)];
  const ratio = (value - lower[0]) / Math.max(0.001, upper[0] - lower[0]);
  return lower[1] + (upper[1] - lower[1]) * Math.max(0, Math.min(1, ratio));
};

export const sampleRadarIntensity = ({ points, bounds, longitude, latitude, width = 640, height = 360 }: RadarSampleOptions): number => {
  const [west, south, east, north] = bounds;
  if (longitude < west || longitude > east || latitude < south || latitude > north) return 0;
  const x = ((longitude - west) / (east - west)) * width;
  const y = ((north - latitude) / (north - south)) * height;
  return Number(normalizedValueToRainfall(calculateRadarValue(x, y, createRadarSeeds(points, bounds, width, height))).toFixed(1));
};

export const createRadarBitmap = ({ points, bounds, width = 640, height = 360 }: RadarBitmapOptions): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const seeds = createRadarSeeds(points, bounds, width, height);

  // Only nearby echoes can affect a pixel. Indexing seeds into small screen-space
  // buckets avoids scanning the complete radar dataset for every bitmap pixel.
  const bucketSize = 32;
  const bucketColumns = Math.ceil(width / bucketSize);
  const bucketRows = Math.ceil(height / bucketSize);
  const seedBuckets = Array.from({ length: bucketColumns * bucketRows }, () => [] as typeof seeds);

  seeds.forEach((seed) => {
    const influenceX = seed.radiusX * 2.5;
    const influenceY = seed.radiusY * 2.5;
    const minColumn = Math.max(0, Math.floor((seed.x - influenceX) / bucketSize));
    const maxColumn = Math.min(bucketColumns - 1, Math.floor((seed.x + influenceX) / bucketSize));
    const minRow = Math.max(0, Math.floor((seed.y - influenceY) / bucketSize));
    const maxRow = Math.min(bucketRows - 1, Math.floor((seed.y + influenceY) / bucketSize));

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        seedBuckets[row * bucketColumns + column].push(seed);
      }
    }
  });

  const pixels = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nearbySeeds = seedBuckets[Math.floor(y / bucketSize) * bucketColumns + Math.floor(x / bucketSize)];
      const texturedValue = calculateRadarValue(x, y, nearbySeeds);
      if (texturedValue === 0) continue;
      const [red, green, blue] = interpolateColor(texturedValue);
      const offset = (y * width + x) * 4;
      pixels.data[offset] = red;
      pixels.data[offset + 1] = green;
      pixels.data[offset + 2] = blue;
      const edgeSoftness = Math.max(0.12, Math.min(1, texturedValue / 0.055));
      pixels.data[offset + 3] = Math.round(255 * Math.min(0.9, (0.08 + Math.pow((texturedValue - 0.025) / 0.975, 0.58)) * edgeSoftness));
    }
  }

  context.putImageData(pixels, 0, 0);
  return canvas;
};

export const createRainRadarBitmapLayer = ({ image, bounds, opacity, visible }: RainRadarBitmapLayerInput): Layer =>
  new BitmapLayer({
    id: 'deck-radar-bitmap',
    image,
    bounds,
    opacity,
    visible,
    desaturate: 0,
    transparentColor: [0, 0, 0, 0],
    textureParameters: {
      minFilter: 'linear',
      magFilter: 'linear',
    },
  });
