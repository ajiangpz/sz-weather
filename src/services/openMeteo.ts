import type { DashboardTrendData } from '@/types/weather';
import { REFERENCE_FORECAST_LOCATION } from '@/config/chinaWeather';
import {
  DEFAULT_FORECAST_MODEL,
  getForecastModelProfile,
  type ForecastModel,
} from './forecastModel';

export const OPEN_METEO_SOURCE = getForecastModelProfile(DEFAULT_FORECAST_MODEL).sourceLabel;
export const REFERENCE_FORECAST_COORDINATES = {
  latitude: REFERENCE_FORECAST_LOCATION.latitude,
  longitude: REFERENCE_FORECAST_LOCATION.longitude,
} as const;

const FRAME_PAST_COUNT = 12;
const FRAME_FUTURE_COUNT = 12;
const REQUIRED_FRAME_COUNT = FRAME_PAST_COUNT + 1 + FRAME_FUTURE_COUNT;
const RAINFALL_24H_SAMPLES = 96;

export interface ForecastFrame {
  timestamp: string;
  time: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  rainfall1h: number;
  rainfall24h: number;
  rainfallIntensity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  weatherCode: number;
  condition: string;
}

export interface LiveForecastSnapshot {
  source: string;
  fetchedAt: Date;
  currentIndex: number;
  frames: ForecastFrame[];
  dashboardTrends: DashboardTrendData;
}

export interface OpenMeteoForecastResponse {
  timezone?: string;
  current?: {
    time?: string;
  };
  minutely_15?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    surface_pressure?: number[];
  };
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const sumRange = (values: number[], start: number, end: number) => {
  let total = 0;
  for (let index = Math.max(0, start); index <= Math.min(values.length - 1, end); index += 1) {
    total += values[index] ?? 0;
  }
  return total;
};

export const weatherCodeToCondition = (code: number) => {
  if (code === 0) return '晴';
  if (code >= 1 && code <= 3) return '多云';
  if (code === 45 || code === 48) return '雾';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if (code === 61 || code === 80) return '小雨';
  if (code === 63 || code === 81) return '中雨';
  if (code === 65 || code === 82) return '大雨';
  if (code >= 71 && code <= 77) return '降雪';
  if (code >= 95) return '雷雨';
  return '阴';
};

export const buildOpenMeteoForecastUrl = (model: ForecastModel = DEFAULT_FORECAST_MODEL) => {
  const url = new URL(getForecastModelProfile(model).endpoint);
  url.searchParams.set('latitude', String(REFERENCE_FORECAST_COORDINATES.latitude));
  url.searchParams.set('longitude', String(REFERENCE_FORECAST_COORDINATES.longitude));
  url.searchParams.set(
    'minutely_15',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
    ].join(','),
  );
  url.searchParams.set('current', 'temperature_2m');
  url.searchParams.set('past_minutely_15', String(RAINFALL_24H_SAMPLES));
  url.searchParams.set('forecast_minutely_15', String(FRAME_FUTURE_COUNT + 1));
  url.searchParams.set('timezone', 'Asia/Shanghai');
  url.searchParams.set('wind_speed_unit', 'ms');
  return url.toString();
};

const requireSeries = (series: number[] | undefined, name: string, expectedLength: number) => {
  if (!series || series.length !== expectedLength || series.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid Open-Meteo series: ${name}`);
  }
  return series;
};

export const createForecastSnapshot = (
  payload: OpenMeteoForecastResponse,
  fetchedAt = new Date(),
  source = OPEN_METEO_SOURCE,
): LiveForecastSnapshot => {
  const minutely = payload.minutely_15;
  const times = minutely?.time;
  if (!times || times.length < REQUIRED_FRAME_COUNT) {
    throw new Error('Open-Meteo returned insufficient 15-minute forecast frames');
  }

  const temperature = requireSeries(minutely.temperature_2m, 'temperature_2m', times.length);
  const humidity = requireSeries(minutely.relative_humidity_2m, 'relative_humidity_2m', times.length);
  const precipitation = requireSeries(minutely.precipitation, 'precipitation', times.length);
  const weatherCode = requireSeries(minutely.weather_code, 'weather_code', times.length);
  const windSpeed = requireSeries(minutely.wind_speed_10m, 'wind_speed_10m', times.length);
  const windDirection = requireSeries(minutely.wind_direction_10m, 'wind_direction_10m', times.length);
  const pressure = requireSeries(minutely.surface_pressure, 'surface_pressure', times.length);

  const exactCurrentIndex = payload.current?.time ? times.indexOf(payload.current.time) : -1;
  const currentRawIndex = exactCurrentIndex >= 0
    ? exactCurrentIndex
    : Math.max(FRAME_PAST_COUNT, times.length - (FRAME_FUTURE_COUNT + 1));
  const startIndex = currentRawIndex - FRAME_PAST_COUNT;
  const endIndex = currentRawIndex + FRAME_FUTURE_COUNT;

  if (startIndex < 0 || endIndex >= times.length) {
    throw new Error('Open-Meteo response does not cover the required timeline window');
  }

  const frames = Array.from({ length: REQUIRED_FRAME_COUNT }, (_, frameIndex): ForecastFrame => {
    const rawIndex = startIndex + frameIndex;
    const framePrecipitation = precipitation[rawIndex];
    const frameWeatherCode = weatherCode[rawIndex];

    return {
      timestamp: times[rawIndex],
      time: times[rawIndex].slice(11, 16),
      temperature: round(temperature[rawIndex]),
      humidity: Math.round(humidity[rawIndex]),
      precipitation: round(framePrecipitation, 2),
      rainfall1h: round(sumRange(precipitation, rawIndex - 3, rawIndex), 2),
      rainfall24h: round(sumRange(precipitation, rawIndex - (RAINFALL_24H_SAMPLES - 1), rawIndex), 1),
      rainfallIntensity: round(framePrecipitation * 4, 1),
      windSpeed: round(windSpeed[rawIndex]),
      windDirection: round(windDirection[rawIndex], 0),
      pressure: Math.round(pressure[rawIndex]),
      weatherCode: frameWeatherCode,
      condition: weatherCodeToCondition(frameWeatherCode),
    };
  });

  let accumulatedRainfall = 0;
  const dashboardTrends: DashboardTrendData = {
    times: frames.map((frame) => frame.time),
    rainfall: frames.map((frame) => frame.precipitation),
    accumulatedRainfall: frames.map((frame) => {
      accumulatedRainfall += frame.precipitation;
      return round(accumulatedRainfall, 2);
    }),
    temperature: frames.map((frame) => frame.temperature),
    humidity: frames.map((frame) => frame.humidity),
    windSpeed: frames.map((frame) => frame.windSpeed),
  };

  return {
    source,
    fetchedAt,
    currentIndex: FRAME_PAST_COUNT,
    frames,
    dashboardTrends,
  };
};

export const fetchChinaReferenceForecast = async (
  model: ForecastModel = DEFAULT_FORECAST_MODEL,
  timeoutMs = 6000,
): Promise<LiveForecastSnapshot> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const profile = getForecastModelProfile(model);

  try {
    const response = await fetch(buildOpenMeteoForecastUrl(model), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with ${response.status}`);
    }
    return createForecastSnapshot(
      await response.json() as OpenMeteoForecastResponse,
      new Date(),
      profile.sourceLabel,
    );
  } finally {
    window.clearTimeout(timeout);
  }
};

/** @deprecated Use fetchChinaReferenceForecast. */
export const fetchShenzhenForecast = fetchChinaReferenceForecast;
