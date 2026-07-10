<template>
  <section class="dashboard-panel weather-legend">
    <h2>降雨强度图例 (mm/h)</h2>

    <ul>
      <li v-for="item in legend" :key="item.label">
        <span class="weather-legend__swatch" :style="{ background: item.color }"></span>
        <span>{{ item.label }}</span>
        <strong>{{ item.range }}</strong>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const legend = [
  { label: '无雨', range: '0', color: 'rgba(120, 160, 200, 0.6)' },
  { label: '小雨', range: '0.1 - 2.5', color: '#4BA3FF' },
  { label: '中雨', range: '2.5 - 8', color: '#37D67A' },
  { label: '大雨', range: '8 - 16', color: '#F4D03F' },
  { label: '暴雨', range: '16 - 32', color: '#F59E42' },
  { label: '大暴雨', range: '32 - 50', color: '#E84C88' },
  { label: '特大暴雨', range: '> 50', color: '#9B5DE5' },
];
</script>
