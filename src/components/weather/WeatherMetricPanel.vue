<template>
  <section class="dashboard-panel metric-panel">
    <div class="panel-title">
      <h2>实时指标</h2>
      <span aria-hidden="true">›</span>
    </div>

    <div class="metric-panel__grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <div>
          <strong :class="`metric-card__value metric-card__value--${metric.type}`">{{ metric.value }}</strong>
          <small>{{ metric.unit }}</small>
          <i><WeatherIcon :name="metric.icon" /></i>
        </div>
      </article>
    </div>

    <button class="metric-panel__link" type="button">查看详情 ›</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import WeatherIcon from './WeatherIcon.vue';

const store = useWeatherStore();
const metrics = computed(() => [
  { label: '1小时降雨', value: store.currentWeather.rainfall1h.toFixed(1), unit: 'mm', type: 'rainfall', icon: 'rain' },
  { label: '24小时降雨', value: store.currentWeather.rainfall24h.toFixed(1), unit: 'mm', type: 'rainfall', icon: 'rain' },
  { label: '最大雨强', value: store.currentWeather.maxRainIntensity.toFixed(1), unit: 'mm/h', type: 'intensity', icon: 'cloud' },
  { label: '当前温度', value: store.currentWeather.temperature.toFixed(1), unit: '°C', type: 'temperature', icon: 'temperature' },
  { label: '相对湿度', value: String(store.currentWeather.humidity), unit: '%', type: 'humidity', icon: 'humidity' },
  { label: '风速', value: store.currentWeather.windSpeed.toFixed(1), unit: 'm/s', type: 'wind', icon: 'wind' },
] as const);
</script>
