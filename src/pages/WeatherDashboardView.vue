<template>
  <main class="weather-dashboard weather-dashboard--v2">
    <WeatherHeader />

    <section class="weather-dashboard__body" aria-label="RainScope 深圳天气可视化大屏">
      <aside class="weather-dashboard__left" aria-label="降雨与站点概览">
        <WeatherMetricPanel />
        <WeatherStationRank />
      </aside>

      <section class="weather-dashboard__center" aria-label="雷达主视图">
        <WeatherRiskBanner />
        <div class="weather-dashboard__map-shell">
          <WeatherMapPanel class="weather-dashboard__map" />
          <WeatherLegend class="weather-dashboard__radar-legend" />
          <WeatherLayerPopover />
        </div>
      </section>

      <aside class="weather-dashboard__right" aria-label="预警与重点影响区域">
        <WeatherAlertPanel />
        <WeatherImpactPanel />
      </aside>

      <WeatherTrendPanel class="weather-dashboard__trend" />
      <WeatherTimeline class="weather-dashboard__timeline" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import WeatherAlertPanel from '@/components/weather/WeatherAlertPanel.vue';
import WeatherHeader from '@/components/weather/WeatherHeader.vue';
import WeatherImpactPanel from '@/components/weather/WeatherImpactPanel.vue';
import WeatherLayerPopover from '@/components/weather/WeatherLayerPopover.vue';
import WeatherLegend from '@/components/weather/WeatherLegend.vue';
import WeatherMapPanel from '@/components/weather/WeatherMapPanel.vue';
import WeatherMetricPanel from '@/components/weather/WeatherMetricPanel.vue';
import WeatherRiskBanner from '@/components/weather/WeatherRiskBanner.vue';
import WeatherStationRank from '@/components/weather/WeatherStationRank.vue';
import WeatherTimeline from '@/components/weather/WeatherTimeline.vue';
import WeatherTrendPanel from '@/components/weather/WeatherTrendPanel.vue';
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

  if (weatherStore.currentRainViewerFrame) {
    if (popup.label?.startsWith('模式预报')) {
      mapStore.syncPopup({ label: '点击位置 · DEMO估算' });
    }
    return;
  }

  const summary = createModelPointForecastSummary({
    frames: weatherStore.windForecastFrames,
    frameIndex: timelineStore.currentFrameIndex,
    longitude: popup.longitude,
    latitude: popup.latitude,
  });

  if (!summary) {
    if (popup.label?.startsWith('模式预报')) {
      mapStore.syncPopup({ label: '点击位置' });
    }
    return;
  }

  mapStore.syncPopup({
    label: `模式预报 · ${summary.precipitation15m.toFixed(2)} mm/15min`,
    rainfallIntensity: summary.rainfallIntensity,
    rainfall1h: summary.rainfall1h,
    temperature: weatherStore.currentWeather.temperature,
    humidity: weatherStore.currentWeather.humidity,
    windSpeed: summary.windSpeed,
    windDirection: summary.windDirection,
    alertTitle: undefined,
  });
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
