export type RadarLevel = 'light' | 'moderate' | 'heavy' | 'storm' | 'severeStorm';

export interface RainfallPoint {
  time: string;
  value: number;
}

export interface DashboardTrendData {
  times: string[];
  rainfall: number[];
  accumulatedRainfall: number[];
  temperature: number[];
  humidity: number[];
  windSpeed: number[];
}

export interface RainDistributionItem {
  label: string;
  value: number;
  color: string;
}

export interface WeatherStation {
  id: string;
  name: string;
  district: string;
  longitude: number;
  latitude: number;
  rainfall1h: number;
  rainfall24h: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface WindStream {
  id: string;
  speed: number;
  bearing: number;
  path: Array<[number, number]>;
}

export type AlertLevel = 'blue' | 'yellow' | 'orange' | 'red';

export interface WeatherAlert {
  id: string;
  title: string;
  level: AlertLevel;
  type: string;
  district: string;
  description: string;
  issuedAt: string;
  status: 'active' | 'expired';
  affectedAreas: string[];
  forecastPeriod: string;
  icon: 'rain' | 'lightning';
}

export interface MapPointPopup {
  label?: string;
  longitude: number;
  latitude: number;
  rainfallIntensity: number;
  rainfall1h: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  alertTitle?: string;
}
