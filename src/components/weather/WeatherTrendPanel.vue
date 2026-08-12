<template>
  <section class="dashboard-panel trend-panel trend-panel--v2">
    <div class="trend-panel__header">
      <h2>趋势 · 全市</h2>
    </div>

    <div class="trend-panel__charts">
      <div class="trend-panel__chart-section">
        <span class="trend-panel__chart-title">降雨量 <small>(mm)</small></span>
        <RainTrendChart class="trend-chart trend-chart--rain" />
      </div>
      <div class="trend-panel__chart-section">
        <span class="trend-panel__chart-title">温度 / 湿度</span>
        <TemperatureHumidityChart class="trend-chart trend-chart--thermo" />
      </div>
      <div class="trend-panel__chart-section">
        <span class="trend-panel__chart-title">风速 <small>(m/s)</small></span>
        <WindSpeedChart class="trend-chart trend-chart--wind" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import RainTrendChart from '@/components/charts/RainTrendChart.vue';
import TemperatureHumidityChart from '@/components/charts/TemperatureHumidityChart.vue';
import WindSpeedChart from '@/components/charts/WindSpeedChart.vue';
</script>
