import type { WindStream } from '@/types/weather';

const roundCoordinate = (value: number) => Number(value.toFixed(4));
const fieldBounds = { west: 113.64, east: 114.78, south: 22.28, north: 22.98 };

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
  let x = 0.72 + Math.sin(latitude * 17.5 + phase * 0.8) * 0.1;
  let y = Math.sin((longitude - 113.7) * 6.7 + phase) * 0.2
    + Math.cos((longitude + latitude) * 10.8 - phase * 0.65) * 0.09;

  const vortices = [
    { longitude: 113.91 + Math.sin(phase * 0.5) * 0.018, latitude: 22.63, radius: 0.27, strength: 0.62 },
    { longitude: 114.22, latitude: 22.52 + Math.cos(phase * 0.45) * 0.015, radius: 0.24, strength: -0.56 },
    { longitude: 114.47 + Math.cos(phase * 0.4) * 0.016, latitude: 22.75, radius: 0.22, strength: 0.48 },
    { longitude: 114.08, latitude: 22.82 + Math.sin(phase * 0.38) * 0.012, radius: 0.3, strength: -0.34 },
  ];

  vortices.forEach((vortex) => {
    const dx = longitude - vortex.longitude;
    const dy = (latitude - vortex.latitude) * 1.55;
    const distanceSquared = dx * dx + dy * dy;
    const influence = Math.exp(-distanceSquared / (vortex.radius * vortex.radius)) * vortex.strength;
    x += -dy * influence * 4.25;
    y += dx * influence * 4.25;
  });

  const convergenceLongitude = 114.05 + Math.sin(phase * 0.7) * 0.028;
  const convergenceLatitude = 22.47 + Math.cos(phase * 0.55) * 0.016;
  const convergenceDx = convergenceLongitude - longitude;
  const convergenceDy = (convergenceLatitude - latitude) * 1.45;
  const convergence = Math.exp(-(convergenceDx ** 2 + convergenceDy ** 2) / 0.085) * 0.52;
  x += convergenceDx * convergence;
  y += convergenceDy * convergence;

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

export const createMockWindStreams = (frameIndex: number, density = 1.12): WindStream[] => {
  const phase = (frameIndex - 12) * 0.16;
  const columns = Math.max(8, Math.round(20 * density));
  const rows = Math.max(6, Math.round(15 * density));

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cellWidth = 1.08 / columns;
    const cellHeight = 0.64 / rows;
    const start: [number, number] = [
      113.66 + (column + 0.08 + noise(index * 2.1) * 0.84) * cellWidth,
      22.3 + (row + 0.08 + noise(index * 3.7 + 11) * 0.84) * cellHeight,
    ];
    const totalSteps = 14 + Math.floor(noise(index * 5.3 + 7) * 21);
    const backwardSteps = Math.max(6, Math.round(totalSteps * (0.38 + noise(index + 19) * 0.2)));
    const forwardSteps = totalSteps - backwardSteps;
    const step = 0.0085 + noise(index * 4.1 + 3) * 0.0025;
    const backward = traceStream(start, phase, -1, backwardSteps, step).reverse();
    const forward = traceStream(start, phase, 1, forwardSteps, step);
    const path = [...backward, [roundCoordinate(start[0]), roundCoordinate(start[1])] as [number, number], ...forward];
    const middleIndex = Math.floor(path.length / 2);
    const previous = path[Math.max(0, middleIndex - 1)];
    const next = path[Math.min(path.length - 1, middleIndex + 1)];
    const bearing = Math.atan2(next[1] - previous[1], next[0] - previous[0]) * 180 / Math.PI;
    const speed = Number((2.1 + noise(index * 8.9 + frameIndex) * 4.4).toFixed(1));

    return { id: `wind-${index}`, speed, bearing: Number(bearing.toFixed(1)), path };
  }).filter((stream) => stream.path.length >= 8);
};
