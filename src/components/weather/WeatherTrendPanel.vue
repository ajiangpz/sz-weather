<template>
  <section class="dashboard-panel trend-panel">
    <div class="trend-panel__header">
      <h2>趋势分析（未来24小时）</h2>
      <div class="trend-panel__tabs" aria-label="趋势类型">
        <button v-for="tab in tabs" :key="tab" :class="{ active: tab === activeTab }" type="button" @click="activeTab = tab">
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="trend-panel__charts">
      <RainTrendChart class="trend-chart" :class="{ focused: activeTab === '降雨量' }" />
      <TemperatureHumidityChart class="trend-chart" :class="{ focused: activeTab === '温度' || activeTab === '湿度' }" />
      <WindSpeedChart class="trend-chart" :class="{ focused: activeTab === '风速' }" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RainTrendChart from '@/components/charts/RainTrendChart.vue';
import TemperatureHumidityChart from '@/components/charts/TemperatureHumidityChart.vue';
import WindSpeedChart from '@/components/charts/WindSpeedChart.vue';

const tabs = ['降雨量', '温度', '湿度', '风速'];
const activeTab = ref<(typeof tabs)[number]>('降雨量');
</script>
