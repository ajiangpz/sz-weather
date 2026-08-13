<template>
  <section class="dashboard-panel layer-panel">
    <div class="panel-title">
      <div class="panel-title__copy">
        <h2>图层控制</h2>
        <small>主场 + 叠加</small>
      </div>
      <span>{{ activeLayerCount }} 开启</span>
    </div>

    <div class="layer-panel__model" aria-label="预报模式">
      <div class="layer-panel__model-row">
        <span>预报模式</span>
        <select
          :value="weatherStore.forecastModel"
          aria-label="预报模式"
          :disabled="weatherStore.modelSwitching"
          @change="handleForecastModelChange"
        >
          <option v-for="profile in forecastModelProfiles" :key="profile.id" :value="profile.id">
            {{ profile.label }}
          </option>
        </select>
      </div>
      <small>{{ weatherStore.modelSwitching ? '模式切换中…' : weatherStore.forecastModelNote }}</small>
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
import {
  FORECAST_MODEL_PROFILES,
  type ForecastModel,
} from '@/services/forecastModel';
import { type PrimaryWeatherField, useLayerStore } from '@/stores/layerStore';
import { useWeatherStore } from '@/stores/weather';

const layerStore = useLayerStore();
const weatherStore = useWeatherStore();
const forecastModelProfiles = Object.values(FORECAST_MODEL_PROFILES);

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
  { name: '重点城市', enabledKey: 'stationEnabled', opacityKey: null, tone: 'station', requiresForecastGrid: false },
] as const;

const hasLiveForecastGrid = computed(() => weatherStore.windDataStatus === 'live');

const handleForecastModelChange = (event: Event) => {
  const select = event.currentTarget as HTMLSelectElement;
  void weatherStore.setForecastModel(select.value as ForecastModel);
};

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
  if (layerStore.primaryWeatherField === 'temperature' || layerStore.primaryWeatherField === 'humidity') {
    layerStore.setPrimaryWeatherField('precipitation');
  }
  layerStore.pressureEnabled = false;
});

const activeLayerCount = computed(() => [
  primaryField.value !== 'none',
  layerStore.windEnabled,
  layerStore.pressureEnabled && hasLiveForecastGrid.value,
  layerStore.alertEnabled,
  layerStore.stationEnabled,
].filter(Boolean).length);
</script>
