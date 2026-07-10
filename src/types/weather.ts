export type RadarLevel = 'light' | 'moderate' | 'heavy' | 'storm' | 'severeStorm';

export interface RainfallPoint {
  time: string;
  value: number;
}

export interface WeatherStation {
  id: string;
  name: string;
  rainfall: number;
}
