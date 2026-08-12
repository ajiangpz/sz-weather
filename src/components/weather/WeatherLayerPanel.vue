<template>
  <section class="dashboard-panel layer-panel">
    <div class="panel-title">
      <div class="panel-title__copy">
        <h2>图层控制</h2>
        <small>叠加显示</small>
      </div>
      <span>{{ activeLayerCount }} 开启</span>
    </div>

    <ul class="layer-panel__list">
      <li :class="{ 'is-active': layerStore.radarEnabled }">
        <label class="layer-panel__toggle">
          <input v-model="layerStore.radarEnabled" type="checkbox" aria-label="降水图层" />
          <i class="layer-panel__swatch layer-panel__swatch--radar" aria-hidden="true"></i>
          <span>降水图层</span>
          <small class="layer-panel__source" aria-hidden="true">{{ weatherStore.radarDataStatusLabel }}</small>
        </label>
        <div class="layer-panel__opacity" :class="{ 'is-disabled': !layerStore.radarEnabled }">
          <span>透明度</span>
          <input v-model.number="layerStore.radarOpacity" type="range" min="0" max="100" :disabled="!layerStore.radarEnabled" />
          <strong>{{ layerStore.radarOpacity }}%</strong>
        </div>
      </li>
      <li :class="{ 'is-active': layerStore.alertEnabled }">
        <label class="layer-panel__toggle">
          <input v-model="layerStore.alertEnabled" type="checkbox" />
          <i class="layer-panel__swatch layer-panel__swatch--alert" aria-hidden="true"></i>
          <span>预警区域</span>
        </label>
        <div class="layer-panel__opacity" :class="{ 'is-disabled': !layerStore.alertEnabled }">
          <span>透明度</span>
          <input v-model.number="layerStore.alertOpacity" type="range" min="0" max="100" :disabled="!layerStore.alertEnabled" />
          <strong>{{ layerStore.alertOpacity }}%</strong>
        </div>
      </li>
      <li :class="{ 'is-active': layerStore.stationEnabled }">
        <label class="layer-panel__toggle">
          <input v-model="layerStore.stationEnabled" type="checkbox" />
          <i class="layer-panel__swatch layer-panel__swatch--station" aria-hidden="true"></i>
          <span>监测站点</span>
        </label>
      </li>
      <li
        v-for="layer in optionalLayers"
        :key="layer.name"
        :class="{ 'is-active': layerStore[layer.enabledKey] }"
      >
        <label class="layer-panel__toggle">
          <input v-model="layerStore[layer.enabledKey]" type="checkbox" :aria-label="layer.name" />
          <i class="layer-panel__swatch" :class="`layer-panel__swatch--${layer.tone}`" aria-hidden="true"></i>
          <span>{{ layer.name }}</span>
          <small v-if="layer.enabledKey === 'windEnabled'" class="layer-panel__source" aria-hidden="true">{{ weatherStore.windDataStatusLabel }}</small>
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
import { computed } from 'vue';
import { useLayerStore } from '@/stores/layerStore';
import { useWeatherStore } from '@/stores/weather';

const layerStore = useLayerStore();
const weatherStore = useWeatherStore();
const optionalLayers = [
  { name: '风场流线', enabledKey: 'windEnabled', opacityKey: 'windOpacity', tone: 'wind' },
  { name: '温度热力', enabledKey: 'temperatureEnabled', opacityKey: 'temperatureOpacity', tone: 'temperature' },
  { name: '湿度热力', enabledKey: 'humidityEnabled', opacityKey: 'humidityOpacity', tone: 'humidity' },
] as const;

const activeLayerCount = computed(() => [
  layerStore.radarEnabled,
  layerStore.alertEnabled,
  layerStore.stationEnabled,
  layerStore.windEnabled,
  layerStore.temperatureEnabled,
  layerStore.humidityEnabled,
].filter(Boolean).length);
</script>

<style scoped>
.layer-panel {
  overflow: hidden;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(126, 169, 201, 0.12);
}

.panel-title__copy {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.panel-title__copy h2 {
  margin: 0;
}

.panel-title__copy small {
  color: #6f8798;
  font-size: 9px;
  font-weight: 500;
}

.panel-title > span {
  padding: 3px 6px;
  border: 1px solid rgba(91, 177, 236, 0.14);
  border-radius: 999px;
  background: rgba(43, 126, 183, 0.08);
  color: #87bddf;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.layer-panel__list {
  list-style: none;
}

.layer-panel__list li {
  position: relative;
  border-bottom: 1px solid rgba(126, 169, 201, 0.09);
  border-radius: 7px;
  transition: background-color 140ms ease;
}

.layer-panel__list li:last-child {
  border-bottom-color: transparent;
}

.layer-panel__list li.is-active {
  background: rgba(45, 130, 188, 0.055);
}

.layer-panel__toggle {
  display: flex;
  min-height: 22px;
  align-items: center;
  gap: 8px;
  color: #d7e5ee;
  cursor: pointer;
}

.layer-panel__toggle input[type='checkbox'] {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  margin: 0;
  accent-color: #35a7ff;
  cursor: pointer;
}

.layer-panel__toggle > span {
  flex: 1;
  min-width: 0;
}

.layer-panel__source {
  flex: 0 0 auto;
  padding: 2px 5px;
  border: 1px solid rgba(86, 180, 239, 0.12);
  border-radius: 999px;
  color: #7fa9c2;
  font-size: 8px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.layer-panel__swatch {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: #5c7890;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.025);
}

.layer-panel__swatch--radar { background: #35a7ff; }
.layer-panel__swatch--alert { background: #efc928; }
.layer-panel__swatch--station { background: #dcecf6; }
.layer-panel__swatch--wind { background: #59c8ff; }
.layer-panel__swatch--temperature { background: #ff9f43; }
.layer-panel__swatch--humidity { background: #3ed6c5; }

.layer-panel__opacity {
  align-items: center;
  margin-top: 5px;
  transition: opacity 160ms ease;
}

.layer-panel__opacity > span {
  color: #6f8798;
}

.layer-panel__opacity strong {
  color: #9eb4c3;
  font-weight: 520;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.layer-panel__opacity input[type='range'] {
  min-width: 0;
  height: 2px;
  accent-color: #35a7ff;
  cursor: pointer;
}

.layer-panel__opacity.is-disabled {
  opacity: 0.34;
}

.layer-panel__opacity.is-disabled strong,
.layer-panel__opacity.is-disabled span {
  color: var(--color-text-muted);
}

.layer-panel__opacity input:disabled {
  cursor: not-allowed;
}
</style>
