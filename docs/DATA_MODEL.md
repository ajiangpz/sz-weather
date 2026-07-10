# Data Model

## 1. TypeScript Rule

All core weather data should have TypeScript interfaces in `src/types/weather.ts`.

Components should consume typed data from stores instead of defining local ad hoc shapes.

## 2. Current Weather

```ts
export interface CurrentWeather {
  cityName: string;
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  updatedAt: string;
}
```

## 3. Metrics

```ts
export interface WeatherMetric {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  type: 'rainfall' | 'intensity' | 'temperature' | 'humidity' | 'wind';
  icon?: string;
}
```

## 4. Stations

```ts
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
```

## 5. Alerts

```ts
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
}
```

## 6. Rain Frames

```ts
export type RainfallLevel =
  | 'none'
  | 'light'
  | 'moderate'
  | 'heavy'
  | 'storm'
  | 'severeStorm'
  | 'extremeStorm';

export interface RainBlob {
  id: string;
  level: RainfallLevel;
  intensity: number;
  coordinates: Array<[number, number]>;
}

export interface RainFrame {
  id: string;
  time: string;
  label: string;
  phase: 'past' | 'current' | 'forecast';
  blobs: RainBlob[];
}
```

## 7. Trends

```ts
export interface TimeValuePoint {
  time: string;
  value: number;
}

export interface TemperatureHumidityPoint {
  time: string;
  temperature: number;
  humidity: number;
}

export interface WindPoint {
  time: string;
  speed: number;
}
```

## 8. Map Popup

```ts
export interface MapPointPopup {
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
```

## 9. Layer State

```ts
export interface WeatherLayerState {
  rainfallRadar: boolean;
  alertAreas: boolean;
  stations: boolean;
  windStream: boolean;
  temperatureHeatmap: boolean;
  humidityHeatmap: boolean;
  rainfallOpacity: number;
  alertOpacity: number;
  windOpacity: number;
  temperatureOpacity: number;
  humidityOpacity: number;
}
```

## 10. Timeline State

```ts
export interface TimelineState {
  currentFrameIndex: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  frameIntervalMinutes: 10;
}
```

## 11. Mock Data Rule

Mock data should be realistic enough for dashboard presentation and should be split by domain:

- `currentWeather.ts`
- `rainFrames.ts`
- `alerts.ts`
- `stations.ts`
- `trends.ts`
