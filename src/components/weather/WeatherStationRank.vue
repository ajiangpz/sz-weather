<template>
  <section class="dashboard-panel station-rank">
    <h2>监测站点 (24h降雨)</h2>

    <ol>
      <li v-for="station in weatherStore.stations" :key="station.id" :class="{ active: mapStore.activeStationId === station.id }">
        <button type="button" @click="mapStore.selectStation(station)">
          <i aria-hidden="true">◇</i>
          <span>{{ station.name }}</span>
          <strong>{{ station.rainfall24h.toFixed(1) }} mm</strong>
        </button>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { useWeatherStore } from '@/stores/weather';
import { useMapStore } from '@/stores/mapStore';

const weatherStore = useWeatherStore();
const mapStore = useMapStore();
</script>
