<template>
  <section class="dashboard-panel distribution-panel">
    <h2>降雨强度分布</h2>

    <div class="distribution-panel__content">
      <div class="distribution-panel__donut" aria-hidden="true">
        <span>占比(%)</span>
      </div>

      <ul>
        <li v-for="item in distribution" :key="item.label">
          <i :style="{ background: item.color }"></i>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}%</strong>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const distribution = [
  { label: '无雨', value: 18.6, color: '#8EA6C1' },
  { label: '小雨', value: 32.4, color: '#4BA3FF' },
  { label: '中雨', value: 23.7, color: '#37D67A' },
  { label: '大雨', value: 15.6, color: '#F4D03F' },
  { label: '暴雨', value: 6.2, color: '#F59E42' },
  { label: '大暴雨', value: 2.8, color: '#E84C88' },
  { label: '特大暴雨', value: 0.7, color: '#9B5DE5' },
];
</script>
