<template>
  <section class="dashboard-panel layer-panel">
    <div class="panel-title">
      <h2>图层控制</h2>
      <span aria-hidden="true">›</span>
    </div>

    <ul class="layer-panel__list">
      <li>
        <label class="layer-panel__toggle">
          <input v-model="layerStore.radarEnabled" type="checkbox" />
          <span>降雨雷达</span>
        </label>
        <div class="layer-panel__opacity">
          <span>透明度</span>
          <input v-model.number="layerStore.radarOpacity" type="range" min="0" max="100" />
          <strong>{{ layerStore.radarOpacity }}%</strong>
        </div>
      </li>
      <li>
        <label class="layer-panel__toggle">
          <input v-model="layerStore.alertEnabled" type="checkbox" />
          <span>预警区域</span>
        </label>
        <div class="layer-panel__opacity">
          <span>透明度</span><input v-model.number="layerStore.alertOpacity" type="range" min="0" max="100" /><strong>{{ layerStore.alertOpacity }}%</strong>
        </div>
      </li>
      <li>
        <label class="layer-panel__toggle">
          <input v-model="layerStore.stationEnabled" type="checkbox" />
          <span>监测站点</span>
        </label>
      </li>
      <li v-for="layer in optionalLayers" :key="layer.name">
        <label class="layer-panel__toggle">
          <input v-model="layerStore[layer.enabledKey]" type="checkbox" />
          <span>{{ layer.name }}</span>
        </label>
        <div class="layer-panel__opacity">
          <span>透明度</span><input v-model.number="layerStore[layer.opacityKey]" type="range" min="0" max="100" /><strong>{{ layerStore[layer.opacityKey] }}%</strong>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useLayerStore } from '@/stores/layerStore';
const layerStore = useLayerStore();
const optionalLayers = [
  { name: '风场流线', enabledKey: 'windEnabled', opacityKey: 'windOpacity' },
  { name: '温度热力', enabledKey: 'temperatureEnabled', opacityKey: 'temperatureOpacity' },
  { name: '湿度热力', enabledKey: 'humidityEnabled', opacityKey: 'humidityOpacity' },
] as const;
</script>
