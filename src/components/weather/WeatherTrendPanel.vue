<template>
  <section class="dashboard-panel trend-panel">
    <div class="trend-panel__header">
      <h2>趋势分析（未来24小时）</h2>
      <div class="trend-panel__tabs" aria-label="趋势类型">
        <button v-for="tab in tabs" :key="tab" :class="{ active: tab === '降雨量' }" type="button">
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="trend-panel__charts">
      <article class="mini-chart mini-chart--rain">
        <div class="mini-chart__legend">
          <span>降雨量(mm)</span>
          <strong>累计降雨(mm)</strong>
        </div>
        <div class="mini-chart__bars">
          <i v-for="(value, index) in rainfallBars" :key="index" :style="{ height: `${value}%` }"></i>
        </div>
      </article>

      <article class="mini-chart mini-chart--lines">
        <div class="mini-chart__legend">
          <span>温度(°C)</span>
          <strong>湿度(%)</strong>
        </div>
        <div class="mini-chart__line mini-chart__line--temperature"></div>
        <div class="mini-chart__line mini-chart__line--humidity"></div>
      </article>

      <article class="mini-chart mini-chart--wind">
        <div class="mini-chart__legend">
          <span>风速(m/s)</span>
        </div>
        <div class="mini-chart__line mini-chart__line--wind"></div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const tabs = ['降雨量', '温度', '湿度', '风速'];
const rainfallBars = [8, 18, 28, 42, 66, 52, 74, 88, 58, 48, 34, 22, 30, 36, 42, 26, 18, 24, 14, 10, 8, 6];
</script>
