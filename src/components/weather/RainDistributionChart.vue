<template>
  <section class="dashboard-panel distribution-panel">
    <h2>降雨强度分布</h2>

    <div class="distribution-panel__content">
      <BaseChart class="distribution-panel__donut" :option="option" accessible-label="降雨强度占比分布图" />

      <ul>
        <li v-for="item in store.rainDistribution" :key="item.label">
          <i :style="{ background: item.color }"></i>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}%</strong>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';
import BaseChart from '@/components/charts/BaseChart.vue';
import { useWeatherStore } from '@/stores/weather';

const store = useWeatherStore();
const option = computed<EChartsOption>(() => ({
  animation: false,
  title: {
    text: '占比(%)',
    left: 'center',
    top: '43%',
    textStyle: { color: '#d6e7f8', fontSize: 11, fontWeight: 500 },
  },
  tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
  series: [{
    type: 'pie',
    radius: ['56%', '78%'],
    center: ['50%', '50%'],
    label: { show: false },
    emphasis: { scaleSize: 4 },
    data: store.rainDistribution.map((item) => ({
      name: item.label,
      value: item.value,
      itemStyle: { color: item.color },
    })),
  }],
}));
</script>
