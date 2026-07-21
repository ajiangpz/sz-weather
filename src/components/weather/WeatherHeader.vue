<template>
  <header class="weather-header">
    <div class="weather-header__brand">
      <div class="weather-header__logo"><WeatherIcon name="brand" /></div>
      <div>
        <h1>RainScope</h1>
        <p>深圳天气可视化大屏</p>
      </div>
    </div>

    <button class="weather-header__city" type="button">
      <span class="weather-header__pin" aria-hidden="true"></span>
      <span>深圳市</span>
      <span class="weather-header__chevron" aria-hidden="true"></span>
    </button>

    <div class="weather-header__condition">
      <span class="weather-header__weather-icon"><WeatherIcon name="rain" /></span>
      <strong>{{ store.currentWeather.condition }}</strong>
      <span>{{ store.currentWeather.temperature.toFixed(1) }}°C</span>
    </div>

    <div class="weather-header__chips" aria-label="当前天气指标">
      <span>湿度 <strong>{{ store.currentWeather.humidity }}%</strong></span>
      <span>风速 <strong>{{ store.currentWeather.windSpeed.toFixed(1) }}m/s</strong></span>
      <span>气压 <strong>{{ store.currentWeather.pressure }}hPa</strong></span>
    </div>

    <div class="weather-header__time">
      <strong>2026-07-09 {{ timelineStore.currentFrameTime }}:00</strong>
      <span>数据每5分钟更新</span>
    </div>

    <div class="weather-header__actions">
      <button type="button" @click="store.refreshData()"><UiIcon name="refresh" /><span>刷新</span></button>
      <button type="button"><UiIcon name="moon" /><span>深色模式</span></button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useWeatherStore } from '@/stores/weather';
import { useTimelineStore } from '@/stores/timelineStore';
import WeatherIcon from './WeatherIcon.vue';
import UiIcon from './UiIcon.vue';

const store = useWeatherStore();
const timelineStore = useTimelineStore();
</script>
