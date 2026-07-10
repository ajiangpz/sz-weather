<template>
  <section class="dashboard-panel layer-panel">
    <div class="panel-title">
      <h2>图层控制</h2>
      <span aria-hidden="true">›</span>
    </div>

    <ul class="layer-panel__list">
      <li v-for="layer in layers" :key="layer.name">
        <label class="layer-panel__toggle">
          <input type="checkbox" :checked="layer.enabled" :disabled="layer.disabled" />
          <span>{{ layer.name }}</span>
        </label>
        <div class="layer-panel__opacity">
          <span>透明度</span>
          <input type="range" min="0" max="100" :value="layer.opacity" :disabled="layer.disabled" />
          <strong>{{ layer.opacity }}%</strong>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const layers = [
  { name: '降雨雷达', enabled: true, opacity: 70 },
  { name: '预警区域', enabled: true, opacity: 60 },
  { name: '监测站点', enabled: true, opacity: 100 },
  { name: '风场流线', enabled: false, opacity: 50, disabled: true },
  { name: '温度热力', enabled: false, opacity: 60, disabled: true },
  { name: '湿度热力', enabled: false, opacity: 60, disabled: true },
];
</script>
