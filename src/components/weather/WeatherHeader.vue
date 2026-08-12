<template>
  <header class="weather-header weather-header--v2">
    <div class="weather-header__left">
      <div class="weather-header__brand">
        <div class="weather-header__logo"><WeatherIcon name="brand" /></div>
        <h1>RainScope</h1>
        <span class="weather-header__demo">DEMO</span>
      </div>

      <span class="weather-header__divider" aria-hidden="true"></span>

      <button class="weather-header__city" type="button">
        <span>深圳市</span>
        <span class="weather-header__chevron" aria-hidden="true"></span>
      </button>

      <span class="weather-header__divider" aria-hidden="true"></span>

      <div class="weather-header__condition">
        <span class="weather-header__weather-icon"><WeatherIcon name="rain" /></span>
        <strong>{{ store.currentWeather.condition }}</strong>
        <span>{{ Math.round(store.currentWeather.temperature) }}°C</span>
      </div>

      <span class="weather-header__divider" aria-hidden="true"></span>
      <span class="weather-header__metric">湿度 <strong>{{ store.currentWeather.humidity }}%</strong></span>
      <span class="weather-header__divider" aria-hidden="true"></span>
      <span class="weather-header__metric">风速 <strong>{{ store.currentWeather.windSpeed.toFixed(1) }} m/s</strong></span>
    </div>

    <div class="weather-header__right">
      <span class="weather-header__status"><i></i>数据正常</span>
      <span class="weather-header__divider" aria-hidden="true"></span>
      <strong class="weather-header__update">{{ timelineStore.currentFrameTime }} 更新</strong>
      <button class="weather-header__icon-button" type="button" aria-label="刷新数据" @click="store.refreshData()"><UiIcon name="refresh" /></button>
      <button class="weather-header__icon-button" type="button" aria-label="打开菜单"><UiIcon name="menu" /></button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useTimelineStore } from '@/stores/timelineStore';
import { useWeatherStore } from '@/stores/weather';
import UiIcon from './UiIcon.vue';
import WeatherIcon from './WeatherIcon.vue';

const store = useWeatherStore();
const timelineStore = useTimelineStore();
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
