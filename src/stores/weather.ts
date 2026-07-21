import { defineStore } from 'pinia';
import { useMapStore } from './mapStore';
import { useTimelineStore } from './timelineStore';
import { mockAlerts } from '@/mock/alerts';

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

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    cityName: '深圳',
    center: [114.0579, 22.5431] as [number, number],
    updatedAt: new Date(),
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
    currentWeather() {
      const offset = useTimelineStore().currentFrameIndex - 12;
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
    refreshData() {
      this.updatedAt = new Date();
      this.syncMapPopupToFrame();
    },
  },
});
