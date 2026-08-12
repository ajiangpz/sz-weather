import type { WindGridFrame } from '@/services/openMeteoWindGrid';
import { sampleForecastPrecipitation } from './forecastPrecipitationLayer';
import { sampleForecastWindVector } from './liveWindField';

export interface ModelPointForecastSummary {
  precipitation15m: number;
  rainfallIntensity: number;
  rainfall1h: number;
  windSpeed: number;
  windDirection: string;
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export const vectorToMeteorologicalDirection = (u: number, v: number) => (
  (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360
);

export const formatWindDirection = (direction: number) => {
  const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  const normalized = ((direction % 360) + 360) % 360;
  return directions[Math.round(normalized / 45) % directions.length];
};

export const createModelPointForecastSummary = ({
  frames,
  frameIndex,
  longitude,
  latitude,
}: {
  frames: WindGridFrame[];
  frameIndex: number;
  longitude: number;
  latitude: number;
}): ModelPointForecastSummary | null => {
  const frame = frames[frameIndex];
  if (!frame) return null;

  const precipitation15m = sampleForecastPrecipitation(frame, longitude, latitude);
  const firstAccumulationIndex = Math.max(0, frameIndex - 3);
  const rainfall1h = frames
    .slice(firstAccumulationIndex, frameIndex + 1)
    .reduce((sum, accumulationFrame) => (
      sum + sampleForecastPrecipitation(accumulationFrame, longitude, latitude)
    ), 0);
  const wind = sampleForecastWindVector(frame, longitude, latitude);
  const direction = vectorToMeteorologicalDirection(wind.u, wind.v);

  return {
    precipitation15m: round(precipitation15m, 2),
    rainfallIntensity: round(precipitation15m * 4, 1),
    rainfall1h: round(rainfall1h, 1),
    windSpeed: round(wind.speed, 1),
    windDirection: formatWindDirection(direction),
  };
};
