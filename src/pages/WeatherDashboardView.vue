<template>
  <main class="weather-dashboard weather-dashboard--v2 weather-dashboard--map-focus">
    <section class="weather-dashboard__body weather-dashboard__body--map-focus" aria-label="RainScope 中国天气地图">
      <div class="weather-dashboard__map-shell">
        <ChinaWeatherMapPanel class="weather-dashboard__map" />
        <WeatherLegend class="weather-dashboard__radar-legend" />
        <WeatherLayerPopover />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import ChinaWeatherMapPanel from '@/components/weather/ChinaWeatherMapPanel.vue';
import WeatherLayerPopover from '@/components/weather/WeatherLayerPopover.vue';
import WeatherLegend from '@/components/weather/WeatherLegend.vue';
import { useMapStore } from '@/stores/mapStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useWeatherStore } from '@/stores/weather';
import { createModelPointForecastSummary } from '@/utils/modelPointForecast';

const weatherStore = useWeatherStore();
const mapStore = useMapStore();
const timelineStore = useTimelineStore();

const syncModelPointPopup = () => {
  const popup = mapStore.popup;
  const isMapPointPopup = popup?.label?.startsWith('点击位置') || popup?.label?.startsWith('模式预报');
  if (!popup || !isMapPointPopup) return;

  const summary = createModelPointForecastSummary({
    frames: weatherStore.windForecastFrames,
    frameIndex: timelineStore.currentFrameIndex,
    longitude: popup.longitude,
    latitude: popup.latitude,
  });

  if (summary) {
    const radarSuffix = weatherStore.currentRainViewerFrame ? ' · 雷达图层 LIVE' : '';
    mapStore.syncPopup({
      label: `模式预报 · ${summary.precipitation15m.toFixed(2)} mm/15min${radarSuffix}`,
      rainfallIntensity: summary.rainfallIntensity,
      rainfall1h: summary.rainfall1h,
      temperature: summary.temperature,
      humidity: summary.humidity,
      windSpeed: summary.windSpeed,
      windDirection: summary.windDirection,
      alertTitle: undefined,
    });
    return;
  }

  if (weatherStore.currentRainViewerFrame) {
    mapStore.syncPopup({
      label: `点击位置 · 雷达图层 LIVE / ${weatherStore.referenceLocationName}参考参数`,
    });
    return;
  }

  if (popup.label?.startsWith('模式预报')) {
    mapStore.syncPopup({ label: '点击位置' });
  }
};

watch(
  [
    () => mapStore.popup?.longitude,
    () => mapStore.popup?.latitude,
    () => timelineStore.currentFrameIndex,
    () => weatherStore.windForecastFrames,
    () => weatherStore.rainViewerFrames,
  ],
  syncModelPointPopup,
  { flush: 'post' },
);

onMounted(() => {
  const mode = new URLSearchParams(window.location.search).get('weather');
  const isLocalQaHost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  if (mode === 'mock' || (isLocalQaHost && mode !== 'live')) return;
  void weatherStore.loadLiveForecast();
});
</script>
