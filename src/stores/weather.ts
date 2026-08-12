import { defineStore } from 'pinia';
import { useMapStore } from './mapStore';
import { useTimelineStore } from './timelineStore';
import { mockAlerts } from '@/mock/alerts';
import { fetchShenzhenForecast, type ForecastFrame } from '@/services/openMeteo';

import {
  mockRadarBandsGeoJson,
  mockRadarFragmentsGeoJson,
  mockRadarGeoJson,
  mockRadarRibbonsGeoJson,
  mockRadarSpecklesGeoJson,
  mockDashboardTrends,
  mockRainDistribution,
  mockRainfallTrend,
  mockStations,
} from '@/mock/weather';

type WeatherDataStatus = 'mock' | 'loading' | 'live' | 'fallback';

const createMockCurrentWeather = (frameIndex: number) => {
  const offset = frameIndex - 12;
  const rainWave = Math.sin(offset * 0.34);
  const temperatureWave = Math.sin(offset * 0.22);
  const rainfall1h = Math.max(0.6, 12.4 + rainWave * 5.2);
  const maxRainIntensity = Math.max(4, 28.6 + rainWave * 9.4);
  return {
    rainfall1h: Number(rainfall1h.toFixed(1)),
    rainfall24h: Number((36.8 + rainWave * 3.6).toFixed(1)),
    maxRainIntensity: Number(maxRainIntensity.toFixed(1)),
    temperature: Number((29 + temperatureWave * 1.4).toFixed(1)),
    humidity: Math.round(82 + rainWave * 5),
    windSpeed: Number((5.2 + Math.sin(offset * 0.31) * 1.2).toFixed(1)),
    pressure: Math.round(1005 - rainWave * 3),
    condition: maxRainIntensity >= 32 ? '大雨' : maxRainIntensity >= 16 ? '中雨' : '小雨',
  };
};

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    cityName: '深圳',
    center: [114.0579, 22.5431] as [number, number],
    updatedAt: new Date(),
    dataStatus: 'mock' as WeatherDataStatus,
    dataSource: '演示数据',
    lastError: null as string | null,
    forecastFrames: [] as ForecastFrame[],
    radarGeoJson: mockRadarGeoJson,
    radarBandsGeoJson: mockRadarBandsGeoJson,
    radarFragmentsGeoJson: mockRadarFragmentsGeoJson,
    radarRibbonsGeoJson: mockRadarRibbonsGeoJson,
    radarSpecklesGeoJson: mockRadarSpecklesGeoJson,
    rainfallTrend: mockRainfallTrend,
    dashboardTrends: mockDashboardTrends,
    rainDistribution: mockRainDistribution,
    stations: mockStations,
    alerts: mockAlerts,
  }),
  getters: {
    dataStatusLabel(state) {
      if (state.dataStatus === 'live') return '预报 LIVE';
      if (state.dataStatus === 'loading') return '预报更新';
      if (state.dataStatus === 'fallback') return state.forecastFrames.length > 0 ? '预报缓存' : '演示数据';
      return '演示数据';
    },
    currentWeather(state) {
      const frameIndex = useTimelineStore().currentFrameIndex;
      const frame = state.forecastFrames[frameIndex];
      if (!frame) return createMockCurrentWeather(frameIndex);

      return {
        rainfall1h: frame.rainfall1h,
        rainfall24h: frame.rainfall24h,
        maxRainIntensity: frame.rainfallIntensity,
        temperature: frame.temperature,
        humidity: frame.humidity,
        windSpeed: frame.windSpeed,
        pressure: frame.pressure,
        condition: frame.condition,
      };
    },
  },
  actions: {
    syncMapPopupToFrame() {
      useMapStore().syncPopup({
        rainfallIntensity: this.currentWeather.maxRainIntensity,
        rainfall1h: this.currentWeather.rainfall1h,
        temperature: this.currentWeather.temperature,
        humidity: this.currentWeather.humidity,
        windSpeed: this.currentWeather.windSpeed,
      });
    },
    async loadLiveForecast() {
      if (this.dataStatus === 'loading') return;
      this.dataStatus = 'loading';
      this.lastError = null;

      try {
        const snapshot = await fetchShenzhenForecast();
        this.forecastFrames = snapshot.frames;
        this.dashboardTrends = snapshot.dashboardTrends;
        this.updatedAt = snapshot.fetchedAt;
        this.dataStatus = 'live';
        this.dataSource = snapshot.source;
        useTimelineStore().setFrameTimes(snapshot.frames.map((frame) => frame.time), snapshot.currentIndex);
      } catch (error) {
        this.dataStatus = 'fallback';
        this.lastError = error instanceof Error ? error.message : 'Unknown live forecast error';
        this.dataSource = this.forecastFrames.length > 0 ? '缓存预报' : '演示数据';
      }

      this.syncMapPopupToFrame();
    },
    async refreshData() {
      await this.loadLiveForecast();
    },
  },
});
