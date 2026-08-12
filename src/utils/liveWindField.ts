import type { WindStream } from '@/types/weather';
import {
  WIND_GRID_BOUNDS,
  type WindGridFrame,
  type WindGridSample,
} from '@/services/openMeteoWindGrid';

interface WindVector {
  u: number;
  v: number;
  speed: number;
}

const roundCoordinate = (value: number) => Number(value.toFixed(4));
const noise = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const normalizeVector = ({ u, v, speed }: WindVector): WindVector => {
  const magnitude = Math.hypot(u, v);
  if (magnitude < 0.0001) return { u: 1, v: 0, speed };
  return { u: u / magnitude, v: v / magnitude, speed };
};

const distanceSquared = (sample: WindGridSample, longitude: number, latitude: number) => {
  const longitudeScale = Math.cos(latitude * Math.PI / 180);
  const dx = (sample.longitude - longitude) * longitudeScale;
  const dy = sample.latitude - latitude;
  return dx * dx + dy * dy;
};

export const sampleForecastWindVector = (
  frame: WindGridFrame,
  longitude: number,
  latitude: number,
): WindVector => {
  if (frame.samples.length === 0) return { u: 1, v: 0, speed: 0 };

  const nearest = [...frame.samples]
    .map((sample) => ({ sample, distance: distanceSquared(sample, longitude, latitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  if (nearest[0].distance < 1e-10) {
    const { u, v, speed } = nearest[0].sample;
    return { u, v, speed };
  }

  let weightTotal = 0;
  let u = 0;
  let v = 0;
  let speed = 0;
  nearest.forEach(({ sample, distance }) => {
    const weight = 1 / Math.max(distance, 0.00008);
    weightTotal += weight;
    u += sample.u * weight;
    v += sample.v * weight;
    speed += sample.speed * weight;
  });

  return {
    u: u / weightTotal,
    v: v / weightTotal,
    speed: speed / weightTotal,
  };
};

const traceStream = (
  frame: WindGridFrame,
  start: [number, number],
  direction: 1 | -1,
  maxSteps: number,
  baseStep: number,
): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  let [longitude, latitude] = start;

  for (let index = 0; index < maxSteps; index += 1) {
    const first = normalizeVector(sampleForecastWindVector(frame, longitude, latitude));
    const step = baseStep * direction;
    const midpointLongitude = longitude + first.u * step * 0.5;
    const midpointLatitude = latitude + first.v * step * 0.36;
    const midpoint = normalizeVector(sampleForecastWindVector(frame, midpointLongitude, midpointLatitude));
    longitude += midpoint.u * step;
    latitude += midpoint.v * step * 0.72;

    if (
      longitude < WIND_GRID_BOUNDS.west || longitude > WIND_GRID_BOUNDS.east
      || latitude < WIND_GRID_BOUNDS.south || latitude > WIND_GRID_BOUNDS.north
    ) break;

    points.push([roundCoordinate(longitude), roundCoordinate(latitude)]);
  }

  return points;
};

export const createForecastWindStreams = (frame: WindGridFrame, density = 1.12): WindStream[] => {
  const columns = Math.max(8, Math.round(20 * density));
  const rows = Math.max(6, Math.round(15 * density));
  const longitudeSpan = WIND_GRID_BOUNDS.east - WIND_GRID_BOUNDS.west;
  const latitudeSpan = WIND_GRID_BOUNDS.north - WIND_GRID_BOUNDS.south;

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cellWidth = longitudeSpan / columns;
    const cellHeight = latitudeSpan / rows;
    const start: [number, number] = [
      WIND_GRID_BOUNDS.west + (column + 0.08 + noise(index * 2.1) * 0.84) * cellWidth,
      WIND_GRID_BOUNDS.south + (row + 0.08 + noise(index * 3.7 + 11) * 0.84) * cellHeight,
    ];
    const totalSteps = 14 + Math.floor(noise(index * 5.3 + 7) * 21);
    const backwardSteps = Math.max(6, Math.round(totalSteps * (0.38 + noise(index + 19) * 0.2)));
    const forwardSteps = totalSteps - backwardSteps;
    const step = 0.0085 + noise(index * 4.1 + 3) * 0.0025;
    const backward = traceStream(frame, start, -1, backwardSteps, step).reverse();
    const forward = traceStream(frame, start, 1, forwardSteps, step);
    const path = [
      ...backward,
      [roundCoordinate(start[0]), roundCoordinate(start[1])] as [number, number],
      ...forward,
    ];
    const vector = sampleForecastWindVector(frame, start[0], start[1]);
    const middleIndex = Math.floor(path.length / 2);
    const previous = path[Math.max(0, middleIndex - 1)];
    const next = path[Math.min(path.length - 1, middleIndex + 1)];
    const bearing = Math.atan2(next[1] - previous[1], next[0] - previous[0]) * 180 / Math.PI;

    return {
      id: `forecast-wind-${index}`,
      speed: Number(vector.speed.toFixed(1)),
      bearing: Number(bearing.toFixed(1)),
      path,
    };
  }).filter((stream) => stream.path.length >= 8);
};
