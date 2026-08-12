<template>
  <section class="dashboard-panel metric-panel metric-panel--rain" aria-label="降雨概览">
    <article v-for="metric in metrics" :key="metric.label" class="metric-card">
      <span>{{ metric.label }}</span>
      <strong>{{ metric.value }}</strong>
      <small>{{ metric.unit }}</small>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';

const store = useWeatherStore();
const metrics = computed(() => [
  { label: '1h 降雨', value: store.currentWeather.rainfall1h.toFixed(1), unit: 'mm' },
  { label: '24h 降雨', value: store.currentWeather.rainfall24h.toFixed(1), unit: 'mm' },
  { label: '最大雨强', value: store.currentWeather.maxRainIntensity.toFixed(1), unit: 'mm/h' },
]);
</script>
