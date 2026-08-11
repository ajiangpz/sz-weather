<template>
  <main class="weather-dashboard">
    <WeatherHeader />

    <section class="weather-dashboard__body" aria-label="RainScope 深圳天气可视化大屏">
      <aside class="weather-dashboard__left" aria-label="图层与站点">
        <WeatherLayerPanel />
        <WeatherLegend />
        <WeatherStationRank />
      </aside>

      <WeatherMapPanel class="weather-dashboard__map" />

      <aside class="weather-dashboard__right" aria-label="实时指标与预警">
        <WeatherMetricPanel />
        <WeatherAlertPanel />
        <RainDistributionChart />
      </aside>

      <WeatherTrendPanel class="weather-dashboard__trend" />
      <WeatherTimeline class="weather-dashboard__timeline" />
    </section>
  </main>
</template>

<script setup lang="ts">
import RainDistributionChart from '@/components/weather/RainDistributionChart.vue';
import WeatherAlertPanel from '@/components/weather/WeatherAlertPanel.vue';
import WeatherHeader from '@/components/weather/WeatherHeader.vue';
import WeatherLayerPanel from '@/components/weather/WeatherLayerPanel.vue';
import WeatherLegend from '@/components/weather/WeatherLegend.vue';
import WeatherMapPanel from '@/components/weather/WeatherMapPanel.vue';
import WeatherMetricPanel from '@/components/weather/WeatherMetricPanel.vue';
import WeatherStationRank from '@/components/weather/WeatherStationRank.vue';
import WeatherTimeline from '@/components/weather/WeatherTimeline.vue';
import WeatherTrendPanel from '@/components/weather/WeatherTrendPanel.vue';
</script>

<style scoped>
@media (min-width: 1201px) {
  .weather-dashboard__left,
  .weather-dashboard__right {
    grid-template-rows: auto auto auto;
    align-content: start;
  }
}
</style>
