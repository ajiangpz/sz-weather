<template>
  <section class="rainfall-chart" aria-label="过去一小时降雨趋势">
    <h2>过去一小时降雨趋势</h2>
    <div ref="chartEl" class="rainfall-chart__canvas"></div>
  </section>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core';
import { GridComponent, TooltipComponent, type GridComponentOption, type TooltipComponentOption } from 'echarts/components';
import { LineChart, type LineSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { RainfallPoint } from '@/types/weather';

type ChartOption = echarts.ComposeOption<
  GridComponentOption | TooltipComponentOption | LineSeriesOption
>;

const props = defineProps<{
  series: RainfallPoint[];
}>();

echarts.use([CanvasRenderer, GridComponent, TooltipComponent, LineChart]);

const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
const handleResize = () => {
  chart?.resize();
};

const option = computed<ChartOption>(() => ({
  color: ['#2563eb'],
  tooltip: { trigger: 'axis' },
  grid: { top: 24, right: 12, bottom: 28, left: 34 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.series.map((item) => item.time),
  },
  yAxis: {
    type: 'value',
    min: 0,
    axisLabel: { formatter: '{value}' },
    splitLine: { lineStyle: { color: '#e5edf8' } },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbolSize: 6,
      areaStyle: { color: 'rgba(37, 99, 235, 0.16)' },
      data: props.series.map((item) => item.value),
    },
  ],
}));

const renderChart = () => {
  chart?.setOption(option.value);
};

onMounted(() => {
  if (!chartEl.value) {
    return;
  }

  chart = echarts.init(chartEl.value);
  renderChart();
  window.addEventListener('resize', handleResize);
});

watch(option, renderChart);

onBeforeUnmount(() => {
  if (chart) {
    window.removeEventListener('resize', handleResize);
    chart.dispose();
    chart = null;
  }
});
</script>
