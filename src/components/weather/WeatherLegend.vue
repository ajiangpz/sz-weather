<template>
  <section class="weather-legend weather-legend--map" aria-label="雷达强度图例">
    <template v-if="weatherStore.currentRainViewerFrame">
      <span class="weather-legend__unit weather-legend__unit--live">雷达 LIVE</span>
      <span class="weather-legend__live-meta">观测 · 10 min</span>
      <a
        class="weather-legend__source"
        href="https://www.rainviewer.com/"
        target="_blank"
        rel="noopener noreferrer"
      >RainViewer</a>
    </template>
    <template v-else>
      <span class="weather-legend__unit">DEMO dBZ</span>
      <div class="weather-legend__scale">
        <div class="weather-legend__labels">
          <span v-for="item in labels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient"></div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useWeatherStore } from '@/stores/weather';

const weatherStore = useWeatherStore();
const labels = ['<5', '10', '20', '30', '40', '50', '60', '70+'];
</script>

<style scoped>
.weather-legend__unit--live {
  color: #cfeeff;
}

.weather-legend__live-meta {
  color: #7f9cad;
  font-size: 9px;
  white-space: nowrap;
}

.weather-legend__source {
  color: #72bdea;
  font-size: 9px;
  text-decoration: none;
  white-space: nowrap;
}

.weather-legend__source:hover,
.weather-legend__source:focus-visible {
  color: #b8e3ff;
  text-decoration: underline;
}
</style>
