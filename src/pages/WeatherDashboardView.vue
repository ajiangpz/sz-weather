<template>
  <main class="weather-dashboard weather-dashboard--v2">
    <WeatherHeader />

    <section class="weather-dashboard__body" aria-label="RainScope 深圳天气可视化大屏">
      <aside class="weather-dashboard__left" aria-label="降雨与站点概览">
        <WeatherMetricPanel />
        <WeatherStationRank />
      </aside>

      <section class="weather-dashboard__center" aria-label="雷达主视图">
        <WeatherRiskBanner />
        <div class="weather-dashboard__map-shell">
          <WeatherMapPanel class="weather-dashboard__map" />
          <WeatherLegend class="weather-dashboard__radar-legend" />
          <WeatherLayerPopover />
        </div>
      </section>

      <aside class="weather-dashboard__right" aria-label="预警与重点影响区域">
        <WeatherAlertPanel />
        <WeatherImpactPanel />
      </aside>

      <WeatherTrendPanel class="weather-dashboard__trend" />
      <WeatherTimeline class="weather-dashboard__timeline" />
    </section>
  </main>
</template>

<script setup lang="ts">
import WeatherAlertPanel from '@/components/weather/WeatherAlertPanel.vue';
import WeatherHeader from '@/components/weather/WeatherHeader.vue';
import WeatherImpactPanel from '@/components/weather/WeatherImpactPanel.vue';
import WeatherLayerPopover from '@/components/weather/WeatherLayerPopover.vue';
import WeatherLegend from '@/components/weather/WeatherLegend.vue';
import WeatherMapPanel from '@/components/weather/WeatherMapPanel.vue';
import WeatherMetricPanel from '@/components/weather/WeatherMetricPanel.vue';
import WeatherRiskBanner from '@/components/weather/WeatherRiskBanner.vue';
import WeatherStationRank from '@/components/weather/WeatherStationRank.vue';
import WeatherTimeline from '@/components/weather/WeatherTimeline.vue';
import WeatherTrendPanel from '@/components/weather/WeatherTrendPanel.vue';
</script>
