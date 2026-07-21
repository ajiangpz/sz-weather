import type { WindStream } from '@/types/weather';

const roundCoordinate = (value: number) => Number(value.toFixed(4));
const fieldBounds = { west: 113.66, east: 114.76, south: 22.3, north: 22.96 };

interface Vector {
  x: number;
  y: number;
}

const normalize = ({ x, y }: Vector): Vector => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};

const sampleWindVector = (longitude: number, latitude: number, phase: number): Vector => {
  let x = 0.86 + Math.sin(latitude * 19 + phase) * 0.1;
  let y = Math.sin((longitude - 113.7) * 7.8 + phase) * 0.22 + Math.cos(latitude * 14 - phase) * 0.1;

  const vortices = [
    { longitude: 113.94, latitude: 22.62, radius: 0.19, strength: 1.08 },
    { longitude: 114.27, latitude: 22.55, radius: 0.17, strength: -0.96 },
    { longitude: 114.48, latitude: 22.73, radius: 0.16, strength: 0.84 },
  ];

  vortices.forEach((vortex) => {
    const dx = longitude - vortex.longitude;
    const dy = (latitude - vortex.latitude) * 1.65;
    const distanceSquared = dx * dx + dy * dy;
    const influence = Math.exp(-distanceSquared / (vortex.radius * vortex.radius)) * vortex.strength;
    x += -dy * influence * 6.2;
    y += dx * influence * 6.2;
  });

  const convergenceLongitude = 114.08 + Math.sin(phase) * 0.025;
  const convergenceLatitude = 22.48 + Math.cos(phase * 0.7) * 0.018;
  const convergenceDx = convergenceLongitude - longitude;
  const convergenceDy = (convergenceLatitude - latitude) * 1.5;
  const convergence = Math.exp(-(convergenceDx ** 2 + convergenceDy ** 2) / 0.07) * 0.72;
  x += convergenceDx * convergence;
  y += convergenceDy * convergence;

  return normalize({ x, y });
};

const traceStream = (start: [number, number], phase: number, direction: 1 | -1): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  let [longitude, latitude] = start;

  for (let index = 0; index < 18; index += 1) {
    const vector = sampleWindVector(longitude, latitude, phase);
    const step = 0.0135 * direction;
    longitude += vector.x * step;
    latitude += vector.y * step * 0.72;
    if (longitude < fieldBounds.west || longitude > fieldBounds.east || latitude < fieldBounds.south || latitude > fieldBounds.north) break;
    points.push([roundCoordinate(longitude), roundCoordinate(latitude)]);
  }
  return points;
};

export const createMockWindStreams = (frameIndex: number): WindStream[] => {
  const phase = (frameIndex - 12) * 0.16;
  const columns = 18;
  const rows = 12;

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const jitterLongitude = Math.sin(index * 12.9898) * 0.014;
    const jitterLatitude = Math.cos(index * 7.233) * 0.011;
    const start: [number, number] = [
      113.68 + column * 0.058 + jitterLongitude,
      22.34 + row * 0.052 + jitterLatitude,
    ];
    const backward = traceStream(start, phase, -1).reverse();
    const forward = traceStream(start, phase, 1);
    const path = [...backward, [roundCoordinate(start[0]), roundCoordinate(start[1])] as [number, number], ...forward];
    const middleIndex = Math.floor(path.length / 2);
    const previous = path[Math.max(0, middleIndex - 1)];
    const next = path[Math.min(path.length - 1, middleIndex + 1)];
    const bearing = Math.atan2(next[1] - previous[1], next[0] - previous[0]) * 180 / Math.PI;
    const speed = Number((2.1 + ((index * 11 + frameIndex * 5) % 44) / 10).toFixed(1));

    return { id: `wind-${index}`, speed, bearing: Number(bearing.toFixed(1)), path };
  }).filter((stream) => stream.path.length >= 8);
};
