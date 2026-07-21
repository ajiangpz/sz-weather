<template>
  <BaseChart :option="option" accessible-label="降雨趋势图" />
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
  legend: { top: 3, right: 8, textStyle: { color: '#a9bfd4', fontSize: 10 }, itemWidth: 10, itemHeight: 7 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: store.dashboardTrends.times, axisLine: dashboardAxisLine, axisTick: { show: false }, axisLabel: dashboardAxisLabel },
  yAxis: [
    { type: 'value', name: '降雨量(mm)', nameTextStyle: dashboardAxisLabel, axisLine: { show: false }, splitLine: dashboardSplitLine, axisLabel: dashboardAxisLabel },
    { type: 'value', name: '%', nameTextStyle: dashboardAxisLabel, axisLine: { show: false }, splitLine: { show: false }, axisLabel: dashboardAxisLabel },
  ],
  series: [
    {
      id: 'rainfall',
      name: '降雨量(mm)',
      type: 'bar',
      data: store.dashboardTrends.rainfall,
      barWidth: '48%',
      markLine: createCurrentTimeMarkLine(timelineStore.currentFrameTime, currentTimeAxis.value),
      itemStyle: { color: '#4ba3ff' },
    },
    {
      name: '累计降雨(mm)',
      type: 'line',
      yAxisIndex: 1,
      data: store.dashboardTrends.accumulatedRainfall,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, type: 'dashed', color: '#79caff' },
    },
  ],
}));
</script>
