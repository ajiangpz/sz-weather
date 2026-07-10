<template>
  <section class="dashboard-panel metric-panel">
    <div class="panel-title">
      <h2>实时指标</h2>
      <span aria-hidden="true">›</span>
    </div>

    <div class="metric-panel__grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <div>
          <strong :class="`metric-card__value metric-card__value--${metric.type}`">{{ metric.value }}</strong>
          <small>{{ metric.unit }}</small>
          <i aria-hidden="true">{{ metric.icon }}</i>
        </div>
      </article>
    </div>

    <button class="metric-panel__link" type="button">查看详情 ›</button>
  </section>
</template>

<script setup lang="ts">
const metrics = [
  { label: '1小时降雨', value: '12.4', unit: 'mm', type: 'rainfall', icon: '☔' },
  { label: '24小时降雨', value: '36.8', unit: 'mm', type: 'rainfall', icon: '☔' },
  { label: '最大雨强', value: '28.6', unit: 'mm/h', type: 'intensity', icon: '☁' },
  { label: '当前温度', value: '29', unit: '°C', type: 'temperature', icon: '♨' },
  { label: '相对湿度', value: '82', unit: '%', type: 'humidity', icon: '💧' },
  { label: '风速', value: '5.2', unit: 'm/s', type: 'wind', icon: '◎' },
];
</script>
