<template>
  <BaseChart :option="option" accessible-label="温湿度趋势图" />
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
  legend: { top: 3, right: 8, textStyle: { color: '#a9bfd4', fontSize: 10 }, itemWidth: 12, itemHeight: 7 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: store.dashboardTrends.times, axisLine: dashboardAxisLine, axisTick: { show: false }, axisLabel: dashboardAxisLabel },
  yAxis: [
    { type: 'value', min: 24, max: 34, name: '°C', nameTextStyle: dashboardAxisLabel, axisLine: { show: false }, splitLine: dashboardSplitLine, axisLabel: dashboardAxisLabel },
    { type: 'value', min: 45, max: 95, name: '%', nameTextStyle: dashboardAxisLabel, axisLine: { show: false }, splitLine: { show: false }, axisLabel: dashboardAxisLabel },
  ],
  series: [
    {
      id: 'temperature',
      name: '温度(°C)',
      type: 'line',
      data: store.dashboardTrends.temperature,
      smooth: true,
      symbol: 'circle',
      symbolSize: 3,
      markLine: createCurrentTimeMarkLine(timelineStore.currentFrameTime, currentTimeAxis.value),
      lineStyle: { width: 2, color: '#f59e42' },
      itemStyle: { color: '#f59e42' },
    },
    {
      name: '湿度(%)',
      type: 'line',
      yAxisIndex: 1,
      data: store.dashboardTrends.humidity,
      smooth: true,
      symbol: 'circle',
      symbolSize: 3,
      lineStyle: { width: 2, color: '#60a5fa' },
      itemStyle: { color: '#60a5fa' },
    },
  ],
}));
</script>
