import { defineStore } from 'pinia';
import type { MapPointPopup, WeatherStation } from '@/types/weather';

export const useMapStore = defineStore('map', {
  state: () => ({
    activeStationId: null as string | null,
    activeAlertId: 'south-china-rain-yellow' as string | null,
    popup: null as MapPointPopup | null,
  }),
  actions: {
    selectStation(station: WeatherStation) {
      this.activeStationId = station.id;
      this.popup = {
        label: `${station.name}城市参考点`,
        longitude: station.longitude,
        latitude: station.latitude,
        rainfallIntensity: station.rainfall1h,
        rainfall1h: station.rainfall1h,
        temperature: station.temperature,
        humidity: station.humidity,
        windSpeed: station.windSpeed,
        windDirection: '参考风向',
        alertTitle: undefined,
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
    syncPopup(popup: Partial<MapPointPopup>) {
      if (!this.popup) return;
      this.popup = { ...this.popup, ...popup };
    },
  },
});
