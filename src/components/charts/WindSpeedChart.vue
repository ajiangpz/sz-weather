<template>
  <BaseChart :option="option" accessible-label="风速趋势图" />
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { useTimelineStore } from '@/stores/timelineStore';
import BaseChart from './BaseChart.vue';
import {
  createCurrentTimeMarkLine,
  dashboardAxisLabel,
  dashboardAxisLine,
  dashboardChartGrid,
  dashboardSplitLine,
} from './chartTheme';

const store = useWeatherStore();
const timelineStore = useTimelineStore();
const currentTimeAxis = computed(() =>
  store.dashboardTrends.times[Math.round((timelineStore.currentFrameIndex / 24) * (store.dashboardTrends.times.length - 1))],
);

const option = computed<EChartsOption>(() => ({
  animation: false,
  grid: dashboardChartGrid,
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: store.dashboardTrends.times, axisLine: dashboardAxisLine, axisTick: { show: false }, axisLabel: dashboardAxisLabel },
  yAxis: { type: 'value', min: 2, max: 12, name: '风速(m/s)', nameTextStyle: dashboardAxisLabel, axisLine: { show: false }, splitLine: dashboardSplitLine, axisLabel: dashboardAxisLabel },
  series: [{
    id: 'wind',
    type: 'line',
    data: store.dashboardTrends.windSpeed,
    smooth: true,
    symbol: 'circle',
    symbolSize: 4,
    markLine: createCurrentTimeMarkLine(timelineStore.currentFrameTime, currentTimeAxis.value),
    lineStyle: { width: 2, color: '#37d67a' },
    itemStyle: { color: '#37d67a' },
    areaStyle: { color: 'rgba(55,214,122,.06)' },
  }],
}));
</script>
