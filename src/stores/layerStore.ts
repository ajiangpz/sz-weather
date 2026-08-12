import { defineStore } from 'pinia';

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
  }),
});
