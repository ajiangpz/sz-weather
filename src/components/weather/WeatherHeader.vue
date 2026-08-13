<template>
  <header class="weather-header weather-header--v2">
    <div class="weather-header__left">
      <div class="weather-header__brand">
        <div class="weather-header__logo"><WeatherIcon name="brand" /></div>
        <h1>RainScope</h1>
        <span class="weather-header__demo">CHINA</span>
      </div>

      <span class="weather-header__divider" aria-hidden="true"></span>

      <button class="weather-header__city" type="button">
        <span>中国</span>
        <span class="weather-header__chevron" aria-hidden="true"></span>
      </button>

      <span class="weather-header__divider" aria-hidden="true"></span>

      <div class="weather-header__condition" :title="`${store.referenceLocationName}参考点`">
        <span class="weather-header__weather-icon"><WeatherIcon name="rain" /></span>
        <strong>{{ store.referenceLocationName }} · {{ store.currentWeather.condition }}</strong>
        <span>{{ Math.round(store.currentWeather.temperature) }}°C</span>
      </div>

      <span class="weather-header__divider" aria-hidden="true"></span>
      <span class="weather-header__metric">雨强峰值 <strong>{{ store.nationalOverview.maxRainIntensity.toFixed(1) }} mm/h</strong></span>
      <span class="weather-header__divider" aria-hidden="true"></span>
      <span class="weather-header__metric">风速峰值 <strong>{{ store.nationalOverview.maxWindSpeed.toFixed(1) }} m/s</strong></span>
    </div>

    <div class="weather-header__right">
      <span class="weather-header__status" :title="store.dataSource"><i></i>{{ store.dataStatusLabel }}</span>
      <span class="weather-header__divider" aria-hidden="true"></span>
      <strong class="weather-header__update">{{ updatedTime }} 更新</strong>
      <button class="weather-header__icon-button" type="button" aria-label="刷新数据" @click="store.refreshData()"><UiIcon name="refresh" /></button>
      <button class="weather-header__icon-button" type="button" aria-label="打开菜单"><UiIcon name="menu" /></button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import UiIcon from './UiIcon.vue';
import WeatherIcon from './WeatherIcon.vue';

const store = useWeatherStore();
const updatedTime = computed(() => store.updatedAt.toLocaleTimeString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}));
</script>

<style scoped>
.weather-header,
.weather-header__left,
.weather-header__right,
.weather-header__brand,
.weather-header__condition,
.weather-header__city,
.weather-header__metric,
.weather-header__status,
.weather-header__update {
  white-space: nowrap;
}
</style>
