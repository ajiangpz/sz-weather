import { defineStore } from 'pinia';

import {
  mockRadarBandsGeoJson,
  mockRadarFragmentsGeoJson,
  mockRadarGeoJson,
  mockRadarRibbonsGeoJson,
  mockRadarSpecklesGeoJson,
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
    stations: mockStations,
  }),
});
