import type { Layer } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import { getForecastFieldEdgeAlpha } from './forecastFieldMask';

export const FORECAST_PRECIPITATION_BOUNDS: [number, number, number, number] = [
  WIND_GRID_BOUNDS.west - 2.5,
  WIND_GRID_BOUNDS.south - 1.5,
  WIND_GRID_BOUNDS.east + 2.5,
  WIND_GRID_BOUNDS.north + 1.5,
];

const colorStops = [
  { value: 0.02, color: [38, 117, 223] },
  { value: 0.12, color: [51, 170, 255] },
  { value: 0.35, color: [54, 211, 199] },
  { value: 0.75, color: [81, 211, 120] },
  { value: 1.5, color: [240, 214, 66] },
  { value: 3, color: [245, 145, 53] },
  { value: 6, color: [226, 68, 109] },
  { value: 10, color: [194, 62, 194] },
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const interpolate = (left: number, right: number, ratio: number) => left + (right - left) * ratio;

const getSample = (frame: WindGridFrame, column: number, row: number) => (
  frame.samples[row * WIND_GRID_COLUMNS + column]?.precipitation ?? 0
);

export const sampleForecastPrecipitation = (
  frame: WindGridFrame,
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
    getSample(frame, left, bottom),
    getSample(frame, right, bottom),
    horizontalRatio,
  );
  const topValue = interpolate(
    getSample(frame, left, top),
    getSample(frame, right, top),
    horizontalRatio,
  );
  return Math.max(0, interpolate(bottomValue, topValue, verticalRatio));
};

const getPrecipitationColor = (precipitation: number): [number, number, number, number] => {
  if (precipitation < 0.015) return [0, 0, 0, 0];
  const upperIndex = colorStops.findIndex((stop) => precipitation <= stop.value);
  const safeUpperIndex = upperIndex < 0 ? colorStops.length - 1 : upperIndex;
  const upper = colorStops[safeUpperIndex];
  const lower = colorStops[Math.max(0, safeUpperIndex - 1)];
  const ratio = upper.value === lower.value
    ? 1
    : clamp((precipitation - lower.value) / (upper.value - lower.value), 0, 1);
  const color = upper.color.map((channel, index) => Math.round(interpolate(lower.color[index], channel, ratio))) as [number, number, number];
  const alpha = Math.round(255 * clamp(0.14 + Math.pow(Math.min(1, precipitation / 4), 0.48) * 0.68, 0.18, 0.82));
  return [...color, alpha];
};

export const createForecastPrecipitationBitmap = (
  frame: WindGridFrame,
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
    const latitude = FORECAST_PRECIPITATION_BOUNDS[3]
      - (y / Math.max(1, height - 1)) * (FORECAST_PRECIPITATION_BOUNDS[3] - FORECAST_PRECIPITATION_BOUNDS[1]);
    for (let x = 0; x < width; x += 1) {
      const longitude = FORECAST_PRECIPITATION_BOUNDS[0]
        + (x / Math.max(1, width - 1)) * (FORECAST_PRECIPITATION_BOUNDS[2] - FORECAST_PRECIPITATION_BOUNDS[0]);
      const precipitation = sampleForecastPrecipitation(frame, longitude, latitude);
      const [red, green, blue, alpha] = getPrecipitationColor(precipitation);
      if (alpha === 0) continue;
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

export const createForecastPrecipitationLayer = ({
  image,
  opacity,
  visible,
}: {
  image: HTMLCanvasElement;
  opacity: number;
  visible: boolean;
}): Layer => new BitmapLayer({
  id: 'deck-forecast-precipitation',
  image,
  bounds: FORECAST_PRECIPITATION_BOUNDS,
  opacity,
  visible,
  desaturate: 0,
  transparentColor: [0, 0, 0, 0],
  textureParameters: {
    minFilter: 'linear',
    magFilter: 'linear',
  },
});
