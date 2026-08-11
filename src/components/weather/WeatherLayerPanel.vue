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
        <div class="layer-panel__opacity" :class="{ 'is-disabled': !layerStore.radarEnabled }">
          <span>透明度</span>
          <input v-model.number="layerStore.radarOpacity" type="range" min="0" max="100" :disabled="!layerStore.radarEnabled" />
          <strong>{{ layerStore.radarOpacity }}%</strong>
        </div>
      </li>
      <li>
        <label class="layer-panel__toggle">
          <input v-model="layerStore.alertEnabled" type="checkbox" />
          <span>预警区域</span>
        </label>
        <div class="layer-panel__opacity" :class="{ 'is-disabled': !layerStore.alertEnabled }">
          <span>透明度</span>
          <input v-model.number="layerStore.alertOpacity" type="range" min="0" max="100" :disabled="!layerStore.alertEnabled" />
          <strong>{{ layerStore.alertOpacity }}%</strong>
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
        <div class="layer-panel__opacity" :class="{ 'is-disabled': !layerStore[layer.enabledKey] }">
          <span>透明度</span>
          <input
            v-model.number="layerStore[layer.opacityKey]"
            type="range"
            min="0"
            max="100"
            :disabled="!layerStore[layer.enabledKey]"
          />
          <strong>{{ layerStore[layer.opacityKey] }}%</strong>
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

<style scoped>
.layer-panel__opacity {
  transition: opacity 160ms ease;
}

.layer-panel__opacity.is-disabled {
  opacity: 0.42;
}

.layer-panel__opacity.is-disabled strong,
.layer-panel__opacity.is-disabled span {
  color: var(--color-text-muted);
}

.layer-panel__opacity input:disabled {
  cursor: not-allowed;
}
</style>
