<template>
  <div ref="chartEl" role="img" :aria-label="accessibleLabel"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  option: EChartsOption;
  accessibleLabel: string;
}>();

const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  if (!chartEl.value) return;

  chart = echarts.init(chartEl.value);
  chart.setOption(props.option, true);
  resizeObserver = new ResizeObserver(() => chart?.resize());
  resizeObserver.observe(chartEl.value);
});

watch(
  () => props.option,
  (option) => chart?.setOption(option, true),
  { deep: true },
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart?.dispose();
  chart = null;
});
</script>
