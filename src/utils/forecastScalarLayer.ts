import type { Layer } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import { getForecastFieldEdgeAlpha } from './forecastFieldMask';

export type ForecastScalarField = 'temperature' | 'humidity';

export const FORECAST_SCALAR_BOUNDS: [number, number, number, number] = [
  WIND_GRID_BOUNDS.west - 2.5,
  WIND_GRID_BOUNDS.south - 1.5,
  WIND_GRID_BOUNDS.east + 2.5,
  WIND_GRID_BOUNDS.north + 1.5,
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const interpolate = (left: number, right: number, ratio: number) => left + (right - left) * ratio;

const getSample = (
  frame: WindGridFrame,
  field: ForecastScalarField,
  column: number,
  row: number,
) => frame.samples[row * WIND_GRID_COLUMNS + column]?.[field] ?? 0;

export const sampleForecastScalar = (
  frame: WindGridFrame,
  field: ForecastScalarField,
  longitude: number,
  latitude: number,
): number => {
  const longitudeRatio = clamp(
    (longitude - WIND_GRID_BOUNDS.west) / (WIND_GRID_BOUNDS.east - WIND_GRID_BOUNDS.west),
    0,
    1,
  );
  const latitudeRatio = clamp(
    (latitude - WIND_GRID_BOUNDS.south) / (WIND_GRID_BOUNDS.north - WIND_GRID_BOUNDS.south),
    0,
    1,
  );
  const gridX = longitudeRatio * (WIND_GRID_COLUMNS - 1);
  const gridY = latitudeRatio * (WIND_GRID_ROWS - 1);
  const left = Math.floor(gridX);
  const right = Math.min(WIND_GRID_COLUMNS - 1, left + 1);
  const bottom = Math.floor(gridY);
  const top = Math.min(WIND_GRID_ROWS - 1, bottom + 1);
  const horizontalRatio = gridX - left;
  const verticalRatio = gridY - bottom;
  const bottomValue = interpolate(
    getSample(frame, field, left, bottom),
    getSample(frame, field, right, bottom),
    horizontalRatio,
  );
  const topValue = interpolate(
    getSample(frame, field, left, top),
    getSample(frame, field, right, top),
    horizontalRatio,
  );
  return interpolate(bottomValue, topValue, verticalRatio);
};

type ColorStop = { value: number; color: [number, number, number] };

const temperatureStops: ColorStop[] = [
  { value: -30, color: [87, 48, 168] },
  { value: -20, color: [68, 65, 190] },
  { value: -10, color: [53, 92, 202] },
  { value: 0, color: [38, 162, 218] },
  { value: 10, color: [67, 193, 166] },
  { value: 20, color: [230, 210, 75] },
  { value: 30, color: [244, 153, 61] },
  { value: 40, color: [221, 77, 74] },
  { value: 50, color: [164, 38, 84] },
];

const humidityStops: ColorStop[] = [
  { value: 0, color: [151, 91, 45] },
  { value: 20, color: [216, 143, 55] },
  { value: 40, color: [224, 203, 91] },
  { value: 60, color: [115, 190, 154] },
  { value: 80, color: [52, 157, 211] },
  { value: 100, color: [54, 67, 166] },
];

export const getForecastScalarColor = (
  field: ForecastScalarField,
  value: number,
): [number, number, number, number] => {
  const stops = field === 'temperature' ? temperatureStops : humidityStops;
  const safeValue = clamp(value, stops[0].value, stops[stops.length - 1].value);
  const upperIndex = stops.findIndex((stop) => safeValue <= stop.value);
  const resolvedUpperIndex = upperIndex < 0 ? stops.length - 1 : upperIndex;
  const upper = stops[resolvedUpperIndex];
  const lower = stops[Math.max(0, resolvedUpperIndex - 1)];
  const ratio = upper.value === lower.value
    ? 1
    : clamp((safeValue - lower.value) / (upper.value - lower.value), 0, 1);
  const color = upper.color.map((channel, index) => (
    Math.round(interpolate(lower.color[index], channel, ratio))
  )) as [number, number, number];
  return [...color, field === 'temperature' ? 158 : 144];
};

export const createForecastScalarBitmap = (
  frame: WindGridFrame,
  field: ForecastScalarField,
  width = 480,
  height = 300,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const pixels = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const latitude = FORECAST_SCALAR_BOUNDS[3]
      - (y / Math.max(1, height - 1)) * (FORECAST_SCALAR_BOUNDS[3] - FORECAST_SCALAR_BOUNDS[1]);
    for (let x = 0; x < width; x += 1) {
      const longitude = FORECAST_SCALAR_BOUNDS[0]
        + (x / Math.max(1, width - 1)) * (FORECAST_SCALAR_BOUNDS[2] - FORECAST_SCALAR_BOUNDS[0]);
      const value = sampleForecastScalar(frame, field, longitude, latitude);
      const [red, green, blue, alpha] = getForecastScalarColor(field, value);
      const offset = (y * width + x) * 4;
      pixels.data[offset] = red;
      pixels.data[offset + 1] = green;
      pixels.data[offset + 2] = blue;
      pixels.data[offset + 3] = Math.round(alpha * getForecastFieldEdgeAlpha(x, y, width, height));
    }
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
};

export const createForecastScalarLayer = ({
  field,
  image,
  opacity,
  visible,
}: {
  field: ForecastScalarField;
  image: HTMLCanvasElement;
  opacity: number;
  visible: boolean;
}): Layer => new BitmapLayer({
  id: `deck-forecast-${field}`,
  image,
  bounds: FORECAST_SCALAR_BOUNDS,
  opacity,
  visible,
  desaturate: 0,
  transparentColor: [0, 0, 0, 0],
  textureParameters: {
    minFilter: 'linear',
    magFilter: 'linear',
  },
});
