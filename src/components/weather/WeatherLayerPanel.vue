<template>
  <section class="dashboard-panel layer-panel">
    <div class="panel-title">
      <div class="panel-title__copy">
        <h2>图层控制</h2>
        <small>主场 + 叠加</small>
      </div>
      <span>{{ activeLayerCount }} 开启</span>
    </div>

    <div class="layer-panel__section layer-panel__section--primary">
      <div class="layer-panel__section-title">
        <span>主气象场</span>
        <small>单选</small>
      </div>

      <div class="layer-panel__primary-grid" role="radiogroup" aria-label="主气象场">
        <label
          v-for="field in primaryFields"
          :key="field.value"
          class="layer-panel__primary-option"
          :class="{
            'is-active': primaryField === field.value,
            'is-unavailable': field.requiresForecastGrid && !hasLiveForecastGrid,
          }"
        >
          <input
            v-model="primaryField"
            type="radio"
            name="primary-weather-field"
            :value="field.value"
            :aria-label="field.name"
            :disabled="field.requiresForecastGrid && !hasLiveForecastGrid"
          />
          <i class="layer-panel__swatch" :class="`layer-panel__swatch--${field.tone}`" aria-hidden="true"></i>
          <span>{{ field.name }}</span>
          <small>{{ primaryFieldSource(field.value) }}</small>
        </label>
      </div>

      <div
        v-if="primaryField !== 'none'"
        class="layer-panel__opacity layer-panel__opacity--primary"
      >
        <span>主场透明度</span>
        <input v-model.number="primaryOpacity" type="range" min="0" max="100" aria-label="主气象场透明度" />
        <strong>{{ primaryOpacity }}%</strong>
      </div>
    </div>

    <div class="layer-panel__section layer-panel__section--overlays">
      <div class="layer-panel__section-title">
        <span>叠加层</span>
        <small>可组合</small>
      </div>

      <ul class="layer-panel__list">
        <li
          v-for="layer in overlayLayers"
          :key="layer.name"
          :class="{
            'is-active': layerStore[layer.enabledKey],
            'is-unavailable': layer.requiresForecastGrid && !hasLiveForecastGrid,
          }"
        >
          <label class="layer-panel__toggle">
            <input
              v-model="layerStore[layer.enabledKey]"
              type="checkbox"
              :aria-label="layer.name"
              :disabled="layer.requiresForecastGrid && !hasLiveForecastGrid"
            />
            <i class="layer-panel__swatch" :class="`layer-panel__swatch--${layer.tone}`" aria-hidden="true"></i>
            <span>{{ layer.name }}</span>
            <small v-if="layer.enabledKey === 'windEnabled'" class="layer-panel__source" aria-hidden="true">{{ weatherStore.windDataStatusLabel }}</small>
            <small v-else-if="layer.requiresForecastGrid" class="layer-panel__source" aria-hidden="true">
              {{ hasLiveForecastGrid ? '预报场' : '不可用' }}
            </small>
          </label>
          <div
            v-if="layer.opacityKey"
            class="layer-panel__opacity"
            :class="{
              'is-disabled': !layerStore[layer.enabledKey] || (layer.requiresForecastGrid && !hasLiveForecastGrid),
            }"
          >
            <span>透明度</span>
            <input
              v-model.number="layerStore[layer.opacityKey]"
              type="range"
              min="0"
              max="100"
              :aria-label="`${layer.name}透明度`"
              :disabled="!layerStore[layer.enabledKey] || (layer.requiresForecastGrid && !hasLiveForecastGrid)"
            />
            <strong>{{ layerStore[layer.opacityKey] }}%</strong>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { type PrimaryWeatherField, useLayerStore } from '@/stores/layerStore';
import { useWeatherStore } from '@/stores/weather';

const layerStore = useLayerStore();
const weatherStore = useWeatherStore();

const primaryFields = [
  { name: '降水', value: 'precipitation', tone: 'radar', requiresForecastGrid: false },
  { name: '温度', value: 'temperature', tone: 'temperature', requiresForecastGrid: true },
  { name: '湿度', value: 'humidity', tone: 'humidity', requiresForecastGrid: true },
  { name: '无底色', value: 'none', tone: 'none', requiresForecastGrid: false },
] as const;

const overlayLayers = [
  { name: '风场流线', enabledKey: 'windEnabled', opacityKey: 'windOpacity', tone: 'wind', requiresForecastGrid: false },
  { name: '气压等值线', enabledKey: 'pressureEnabled', opacityKey: 'pressureOpacity', tone: 'pressure', requiresForecastGrid: true },
  { name: '预警区域', enabledKey: 'alertEnabled', opacityKey: 'alertOpacity', tone: 'alert', requiresForecastGrid: false },
  { name: '监测站点', enabledKey: 'stationEnabled', opacityKey: null, tone: 'station', requiresForecastGrid: false },
] as const;

const hasLiveForecastGrid = computed(() => weatherStore.windDataStatus === 'live');

const primaryField = computed<PrimaryWeatherField>({
  get: () => layerStore.primaryWeatherField,
  set: (field) => layerStore.setPrimaryWeatherField(field),
});

const primaryOpacity = computed({
  get: () => {
    if (primaryField.value === 'temperature') return layerStore.temperatureOpacity;
    if (primaryField.value === 'humidity') return layerStore.humidityOpacity;
    return layerStore.radarOpacity;
  },
  set: (opacity: number) => {
    if (primaryField.value === 'temperature') layerStore.temperatureOpacity = opacity;
    else if (primaryField.value === 'humidity') layerStore.humidityOpacity = opacity;
    else layerStore.radarOpacity = opacity;
  },
});

const primaryFieldSource = (field: PrimaryWeatherField) => {
  if (field === 'precipitation') return weatherStore.radarDataStatusLabel;
  if (field === 'temperature' || field === 'humidity') return hasLiveForecastGrid.value ? '预报场' : '不可用';
  return '底图';
};

watch(hasLiveForecastGrid, (available) => {
  if (available) return;
  if (primaryField.value === 'temperature' || primaryField.value === 'humidity') {
    layerStore.setPrimaryWeatherField('precipitation');
  }
  layerStore.pressureEnabled = false;
});

const activeLayerCount = computed(() => [
  primaryField.value !== 'none',
  layerStore.alertEnabled,
  layerStore.stationEnabled,
  layerStore.windEnabled,
  layerStore.pressureEnabled,
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

.layer-panel__section + .layer-panel__section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(126, 169, 201, 0.09);
}

.layer-panel__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #91a9b9;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.layer-panel__section-title small {
  color: #5f788a;
  font-size: 8px;
  font-weight: 500;
}

.layer-panel__primary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.layer-panel__primary-option {
  display: grid;
  min-width: 0;
  grid-template-columns: 8px 1fr;
  grid-template-rows: auto auto;
  column-gap: 6px;
  padding: 6px 7px;
  border: 1px solid rgba(124, 169, 198, 0.1);
  border-radius: 6px;
  background: rgba(11, 31, 47, 0.22);
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, opacity 140ms ease;
}

.layer-panel__primary-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.layer-panel__primary-option .layer-panel__swatch {
  grid-row: 1 / span 2;
  align-self: center;
}

.layer-panel__primary-option > span {
  min-width: 0;
  overflow: hidden;
  color: #c9dbe6;
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-panel__primary-option > small {
  overflow: hidden;
  color: #627f92;
  font-size: 7px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-panel__primary-option.is-active {
  border-color: rgba(67, 169, 236, 0.42);
  background: rgba(37, 120, 178, 0.14);
  box-shadow: inset 0 0 0 1px rgba(67, 169, 236, 0.05);
}

.layer-panel__primary-option.is-active > span {
  color: #edf7fc;
}

.layer-panel__primary-option.is-unavailable {
  opacity: 0.4;
  cursor: not-allowed;
}

.layer-panel__list {
  list-style: none;
}

.layer-panel__list li {
  position: relative;
  border-bottom: 1px solid rgba(126, 169, 201, 0.08);
  border-radius: 7px;
  transition: background-color 140ms ease, opacity 140ms ease;
}

.layer-panel__list li:last-child {
  border-bottom-color: transparent;
}

.layer-panel__list li.is-active {
  background: rgba(45, 130, 188, 0.055);
}

.layer-panel__list li.is-unavailable {
  opacity: 0.52;
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

.layer-panel__toggle input:disabled {
  cursor: not-allowed;
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
.layer-panel__swatch--none {
  border: 1px solid #577081;
  background: transparent;
  box-shadow: none;
}
.layer-panel__swatch--pressure {
  width: 9px;
  height: 2px;
  flex-basis: 9px;
  border-radius: 999px;
  background: #d3e7f4;
}

.layer-panel__opacity {
  align-items: center;
  margin-top: 5px;
  transition: opacity 160ms ease;
}

.layer-panel__opacity--primary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 26px;
  gap: 7px;
  padding: 0 2px;
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
