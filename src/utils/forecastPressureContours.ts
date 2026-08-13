import type { Layer } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';

import {
  WIND_GRID_BOUNDS,
  WIND_GRID_COLUMNS,
  WIND_GRID_ROWS,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';

export const PRESSURE_CONTOUR_INTERVAL_HPA = 0.5;

export interface PressureContourSegment {
  level: number;
  path: [[number, number], [number, number]];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const interpolate = (left: number, right: number, ratio: number) => left + (right - left) * ratio;

const getPressureSample = (frame: WindGridFrame, column: number, row: number) => (
  frame.samples[row * WIND_GRID_COLUMNS + column]?.pressure ?? 0
);

export const sampleForecastPressure = (
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
    getPressureSample(frame, left, bottom),
    getPressureSample(frame, right, bottom),
    horizontalRatio,
  );
  const topValue = interpolate(
    getPressureSample(frame, left, top),
    getPressureSample(frame, right, top),
    horizontalRatio,
  );
  return interpolate(bottomValue, topValue, verticalRatio);
};

export const createPressureLevels = (
  frame: WindGridFrame,
  interval = PRESSURE_CONTOUR_INTERVAL_HPA,
): number[] => {
  const pressures = frame.samples.map((sample) => sample.pressure).filter(Number.isFinite);
  if (pressures.length === 0 || interval <= 0) return [];
  const minimum = Math.min(...pressures);
  const maximum = Math.max(...pressures);
  const first = Math.ceil(minimum / interval) * interval;
  const levels: number[] = [];
  for (let level = first; level <= maximum + 1e-6; level += interval) {
    if (level > minimum + 1e-6 && level < maximum - 1e-6) {
      levels.push(Number(level.toFixed(1)));
    }
  }
  return levels.slice(0, 12);
};

interface GridVertex {
  longitude: number;
  latitude: number;
  pressure: number;
}

const edgeIntersection = (start: GridVertex, end: GridVertex, level: number): [number, number] | null => {
  const startDelta = start.pressure - level;
  const endDelta = end.pressure - level;
  if (Math.abs(startDelta) < 1e-9 && Math.abs(endDelta) < 1e-9) return null;
  if ((startDelta > 0 && endDelta > 0) || (startDelta < 0 && endDelta < 0)) return null;
  const denominator = end.pressure - start.pressure;
  if (Math.abs(denominator) < 1e-9) return null;
  const ratio = clamp((level - start.pressure) / denominator, 0, 1);
  return [
    interpolate(start.longitude, end.longitude, ratio),
    interpolate(start.latitude, end.latitude, ratio),
  ];
};

export const createForecastPressureContours = (
  frame: WindGridFrame,
  columns = 36,
  rows = 22,
  interval = PRESSURE_CONTOUR_INTERVAL_HPA,
): PressureContourSegment[] => {
  const safeColumns = Math.max(2, Math.floor(columns));
  const safeRows = Math.max(2, Math.floor(rows));
  const vertices = Array.from({ length: safeRows }, (_, row) => {
    const latitude = WIND_GRID_BOUNDS.south
      + (row / (safeRows - 1)) * (WIND_GRID_BOUNDS.north - WIND_GRID_BOUNDS.south);
    return Array.from({ length: safeColumns }, (__, column): GridVertex => {
      const longitude = WIND_GRID_BOUNDS.west
        + (column / (safeColumns - 1)) * (WIND_GRID_BOUNDS.east - WIND_GRID_BOUNDS.west);
      return {
        longitude,
        latitude,
        pressure: sampleForecastPressure(frame, longitude, latitude),
      };
    });
  });

  const segments: PressureContourSegment[] = [];
  for (const level of createPressureLevels(frame, interval)) {
    for (let row = 0; row < safeRows - 1; row += 1) {
      for (let column = 0; column < safeColumns - 1; column += 1) {
        const bottomLeft = vertices[row][column];
        const bottomRight = vertices[row][column + 1];
        const topRight = vertices[row + 1][column + 1];
        const topLeft = vertices[row + 1][column];
        const intersections = [
          edgeIntersection(bottomLeft, bottomRight, level),
          edgeIntersection(bottomRight, topRight, level),
          edgeIntersection(topRight, topLeft, level),
          edgeIntersection(topLeft, bottomLeft, level),
        ].filter((point): point is [number, number] => point !== null);

        const unique = intersections.filter((point, index, points) => (
          points.findIndex((candidate) => (
            Math.abs(candidate[0] - point[0]) < 1e-8
            && Math.abs(candidate[1] - point[1]) < 1e-8
          )) === index
        ));

        if (unique.length === 2) {
          segments.push({ level, path: [unique[0], unique[1]] });
        } else if (unique.length === 4) {
          segments.push({ level, path: [unique[0], unique[1]] });
          segments.push({ level, path: [unique[2], unique[3]] });
        }
      }
    }
  }
  return segments;
};

export const createForecastPressureLayer = ({
  segments,
  opacity,
  visible,
}: {
  segments: PressureContourSegment[];
  opacity: number;
  visible: boolean;
}): Layer => new PathLayer<PressureContourSegment>({
  id: 'deck-forecast-pressure-isolines',
  data: segments,
  getPath: (segment) => segment.path,
  getColor: [211, 231, 244, Math.round(210 * clamp(opacity, 0, 1))],
  getWidth: 1.15,
  widthUnits: 'pixels',
  widthMinPixels: 0.8,
  widthMaxPixels: 1.6,
  jointRounded: true,
  capRounded: true,
  visible,
  pickable: false,
});
