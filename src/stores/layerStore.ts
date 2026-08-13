import { defineStore } from 'pinia';

export type PrimaryWeatherField = 'precipitation' | 'temperature' | 'humidity' | 'none';

export const useLayerStore = defineStore('layers', {
  state: () => ({
    radarEnabled: true,
    radarOpacity: 70,
    alertEnabled: true,
    alertOpacity: 60,
    stationEnabled: true,
    windEnabled: true,
    windOpacity: 38,
    temperatureEnabled: false,
    temperatureOpacity: 60,
    humidityEnabled: false,
    humidityOpacity: 60,
    pressureEnabled: false,
    pressureOpacity: 72,
  }),
  getters: {
    primaryWeatherField(state): PrimaryWeatherField {
      if (state.temperatureEnabled) return 'temperature';
      if (state.humidityEnabled) return 'humidity';
      if (state.radarEnabled) return 'precipitation';
      return 'none';
    },
  },
  actions: {
    setPrimaryWeatherField(field: PrimaryWeatherField) {
      this.radarEnabled = field === 'precipitation';
      this.temperatureEnabled = field === 'temperature';
      this.humidityEnabled = field === 'humidity';
    },
  },
});
