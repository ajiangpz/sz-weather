<template>
  <main class="weather-page">
    <AppHeader
      title="城市实时降雨雷达"
      subtitle="深圳市分钟级雷达回波、降雨趋势与站点监测总览"
    />

    <section class="weather-page__layout">
      <RainRadarMap class="weather-page__map" />

      <aside class="weather-page__panel" aria-label="降雨监测信息">
        <div class="status-card">
          <span class="status-card__label">当前城市</span>
          <strong>{{ store.cityName }}</strong>
          <span class="status-card__time">更新于 {{ updatedAtText }}</span>
        </div>

        <RainfallChart :series="store.rainfallTrend" />

        <div class="station-list">
          <h2>重点站点</h2>
          <ul>
            <li v-for="station in store.stations" :key="station.id">
              <span>{{ station.name }}</span>
              <strong>{{ station.rainfall1h }} mm/h</strong>
            </li>
          </ul>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import AppHeader from '@/components/common/AppHeader.vue';
import RainfallChart from '@/components/weather/RainfallChart.vue';
import RainRadarMap from '@/components/weather/RainRadarMap.vue';
import { useWeatherStore } from '@/stores/weather';

const store = useWeatherStore();

const updatedAtText = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(store.updatedAt),
);
</script>
