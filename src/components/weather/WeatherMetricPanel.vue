<template>
  <section class="dashboard-panel metric-panel metric-panel--rain" aria-label="全国天气概览">
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
  { label: '最高温', value: store.nationalOverview.maxTemperature.toFixed(1), unit: '°C' },
  { label: '最低温', value: store.nationalOverview.minTemperature.toFixed(1), unit: '°C' },
  { label: '最大雨强', value: store.nationalOverview.maxRainIntensity.toFixed(1), unit: 'mm/h' },
]);
</script>
