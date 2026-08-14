import type { WindStream } from '@/types/weather';
import { WIND_GRID_BOUNDS } from '@/services/openMeteoWindGrid';

const roundCoordinate = (value: number) => Number(value.toFixed(4));
const fieldBounds = WIND_GRID_BOUNDS;

interface Vector {
  x: number;
  y: number;
}

const noise = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const normalize = ({ x, y }: Vector): Vector => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};

const sampleWindVector = (longitude: number, latitude: number, phase: number): Vector => {
  let x = 0.7 + Math.sin(latitude * 0.36 + phase * 0.8) * 0.14;
  let y = Math.sin((longitude - 100) * 0.28 + phase) * 0.22
    + Math.cos((longitude + latitude) * 0.2 - phase * 0.65) * 0.1;

  const vortices = [
    { longitude: 104 + Math.sin(phase * 0.5) * 0.9, latitude: 31.5, radius: 7.2, strength: 0.74 },
    { longitude: 121.5, latitude: 29.5 + Math.cos(phase * 0.45) * 0.7, radius: 6.8, strength: -0.62 },
    { longitude: 113.5 + Math.cos(phase * 0.4) * 0.8, latitude: 23.5, radius: 6.2, strength: 0.56 },
    { longitude: 124.0, latitude: 44 + Math.sin(phase * 0.38) * 0.8, radius: 7.5, strength: -0.4 },
  ];

  vortices.forEach((vortex) => {
    const latitudeScale = Math.max(0.45, Math.cos(latitude * Math.PI / 180));
    const dx = (longitude - vortex.longitude) * latitudeScale;
    const dy = latitude - vortex.latitude;
    const distanceSquared = dx * dx + dy * dy;
    const influence = Math.exp(-distanceSquared / (vortex.radius * vortex.radius)) * vortex.strength;
    x += -dy * influence * 0.18;
    y += dx * influence * 0.18;
  });

  return normalize({ x, y });
};

const traceStream = (
  start: [number, number],
  phase: number,
  direction: 1 | -1,
  maxSteps: number,
  baseStep: number,
): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  let [longitude, latitude] = start;

  for (let index = 0; index < maxSteps; index += 1) {
    const first = sampleWindVector(longitude, latitude, phase);
    const step = baseStep * direction;
    const midpointLongitude = longitude + first.x * step * 0.5;
    const midpointLatitude = latitude + first.y * step * 0.36;
    const midpoint = sampleWindVector(midpointLongitude, midpointLatitude, phase);
    longitude += midpoint.x * step;
    latitude += midpoint.y * step * 0.72;
    if (longitude < fieldBounds.west || longitude > fieldBounds.east || latitude < fieldBounds.south || latitude > fieldBounds.north) break;
    points.push([roundCoordinate(longitude), roundCoordinate(latitude)]);
  }
  return points;
};

export const createMockWindStreams = (frameIndex: number, density = 1.45): WindStream[] => {
  const phase = (frameIndex - 12) * 0.16;
  const columns = Math.max(8, Math.round(20 * density));
  const rows = Math.max(6, Math.round(15 * density));
  const longitudeSpan = fieldBounds.east - fieldBounds.west;
  const latitudeSpan = fieldBounds.north - fieldBounds.south;
  const baseStep = longitudeSpan / 480;

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cellWidth = longitudeSpan / columns;
    const cellHeight = latitudeSpan / rows;
    const start: [number, number] = [
      fieldBounds.west + (column + 0.08 + noise(index * 2.1) * 0.84) * cellWidth,
      fieldBounds.south + (row + 0.08 + noise(index * 3.7 + 11) * 0.84) * cellHeight,
    ];
    const totalSteps = 14 + Math.floor(noise(index * 5.3 + 7) * 21);
    const backwardSteps = Math.max(6, Math.round(totalSteps * (0.38 + noise(index + 19) * 0.2)));
    const forwardSteps = totalSteps - backwardSteps;
    const step = baseStep * (1 + noise(index * 4.1 + 3) * 0.28);
    const backward = traceStream(start, phase, -1, backwardSteps, step).reverse();
    const forward = traceStream(start, phase, 1, forwardSteps, step);
    const path = [...backward, [roundCoordinate(start[0]), roundCoordinate(start[1])] as [number, number], ...forward];
    const middleIndex = Math.floor(path.length / 2);
    const previous = path[Math.max(0, middleIndex - 1)];
    const next = path[Math.min(path.length - 1, middleIndex + 1)];
    const bearing = Math.atan2(next[1] - previous[1], next[0] - previous[0]) * 180 / Math.PI;
    const speed = Number((2.1 + noise(index * 8.9 + frameIndex) * 8.4).toFixed(1));

    return { id: `wind-${index}`, speed, bearing: Number(bearing.toFixed(1)), path };
  }).filter((stream) => stream.path.length >= 8);
};
