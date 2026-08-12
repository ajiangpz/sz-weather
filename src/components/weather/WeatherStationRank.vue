<template>
  <section class="dashboard-panel station-rank">
    <div class="station-rank__header">
      <h2>站点雨量 TOP3</h2>
      <span>单位：mm</span>
    </div>

    <ol>
      <li v-for="station in topStations" :key="station.id" :class="{ active: mapStore.activeStationId === station.id }">
        <button type="button" @click="mapStore.selectStation(station)">
          <span class="station-rank__row">
            <span>{{ station.name }}</span>
            <strong>{{ station.rainfall24h.toFixed(1) }}</strong>
          </span>
          <span class="station-rank__track" aria-hidden="true">
            <i :style="{ width: `${progressWidth(station.rainfall24h)}%` }"></i>
          </span>
        </button>
      </li>
    </ol>

    <button class="station-rank__more" type="button">查看更多站点 ›</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { useWeatherStore } from '@/stores/weather';

const weatherStore = useWeatherStore();
const mapStore = useMapStore();
const topStations = computed(() => [...weatherStore.stations].sort((a, b) => b.rainfall24h - a.rainfall24h).slice(0, 3));
const maxRainfall = computed(() => topStations.value[0]?.rainfall24h || 1);
const progressWidth = (value: number) => Math.max(8, Math.min(100, (value / maxRainfall.value) * 100));
</script>
