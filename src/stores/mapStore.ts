import { defineStore } from 'pinia';
import type { MapPointPopup, WeatherStation } from '@/types/weather';

export const useMapStore = defineStore('map', {
  state: () => ({
    activeStationId: 'lh' as string | null,
    activeAlertId: 'rain-yellow' as string | null,
    popup: null as MapPointPopup | null,
  }),
  actions: {
    selectStation(station: WeatherStation) {
      this.activeStationId = station.id;
      this.popup = {
        label: `${station.name}监测站`,
        longitude: station.longitude,
        latitude: station.latitude,
        rainfallIntensity: station.rainfall1h,
        rainfall1h: station.rainfall1h,
        temperature: station.temperature,
        humidity: station.humidity,
        windSpeed: station.windSpeed,
        windDirection: '东南风',
        alertTitle: station.district === '罗湖区' ? '黄色暴雨预警' : undefined,
      };
    },
    selectAlert(id: string) {
      this.activeAlertId = id;
    },
    showPopup(popup: MapPointPopup) {
      this.popup = popup;
    },
    closePopup() {
      this.popup = null;
    },
    syncPopup(weather: Pick<MapPointPopup, 'rainfallIntensity' | 'rainfall1h' | 'temperature' | 'humidity' | 'windSpeed'>) {
      if (!this.popup) return;
      this.popup = { ...this.popup, ...weather };
    },
  },
});
