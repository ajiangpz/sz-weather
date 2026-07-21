<template>
  <section class="dashboard-panel alert-panel">
    <div class="panel-title">
      <h2>天气预警（{{ weatherStore.alerts.length }}）</h2>
      <button type="button">更多 ›</button>
    </div>

    <article v-for="alert in weatherStore.alerts" :key="alert.id" :class="[`alert-card alert-card--${alert.level}`, { active: mapStore.activeAlertId === alert.id }]" role="button" tabindex="0" @click="mapStore.selectAlert(alert.id)" @keydown.enter="mapStore.selectAlert(alert.id)" @keydown.space.prevent="mapStore.selectAlert(alert.id)">
      <div class="alert-card__icon"><WeatherIcon :name="alert.icon" /></div>
      <div class="alert-card__body">
        <div class="alert-card__head">
          <h3>{{ alert.title }}</h3>
          <span>{{ alert.status === 'active' ? '生效中' : '已解除' }}</span>
        </div>
        <p>发布时间：{{ alert.issuedAt }}</p>
        <p>影响区域：{{ alert.district }}</p>
        <p>预计时间：{{ alert.forecastPeriod }}</p>
        <span class="alert-card__detail">查看详情</span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useMapStore } from '@/stores/mapStore';
import { useWeatherStore } from '@/stores/weather';
import WeatherIcon from './WeatherIcon.vue';

const mapStore = useMapStore();
const weatherStore = useWeatherStore();
</script>
