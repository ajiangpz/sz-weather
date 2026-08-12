<template>
  <div ref="root" class="weather-layer-popover">
    <button
      class="weather-layer-popover__trigger"
      type="button"
      aria-label="图层"
      aria-controls="weather-layer-popover-panel"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UiIcon name="layers" />
      <span>图层</span>
    </button>

    <WeatherLayerPanel
      v-if="open"
      id="weather-layer-popover-panel"
      class="weather-layer-popover__panel"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import UiIcon from './UiIcon.vue';
import WeatherLayerPanel from './WeatherLayerPanel.vue';

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function handlePointerDown(event: PointerEvent) {
  if (!open.value || !root.value) return;
  if (event.target instanceof Node && !root.value.contains(event.target)) open.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false;
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.weather-layer-popover {
  position: absolute;
  z-index: 8;
  top: 290px;
  right: 14px;
}

.weather-layer-popover__trigger {
  display: grid;
  width: 42px;
  height: 52px;
  place-items: center;
  align-content: center;
  gap: 3px;
  padding: 0;
  border: 1px solid rgba(87, 164, 230, 0.26);
  border-radius: 6px;
  background: rgba(5, 18, 34, 0.88);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.26);
  color: #d8ecff;
  cursor: pointer;
}

.weather-layer-popover__trigger[aria-expanded="true"] {
  border-color: rgba(75, 163, 255, 0.72);
  background: rgba(24, 83, 132, 0.94);
  color: #ffffff;
}

.weather-layer-popover__trigger .ui-icon {
  width: 20px;
  height: 20px;
}

.weather-layer-popover__trigger span {
  font-size: 9px;
}

.weather-layer-popover__panel {
  position: absolute;
  top: -116px;
  right: 52px;
  width: 258px;
  max-height: 360px;
  overflow: auto;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
}

:deep(.weather-layer-popover__panel .panel-title) {
  padding-block: 10px 8px;
}

:deep(.weather-layer-popover__panel .layer-panel__list) {
  gap: 5px;
  padding: 8px 14px 12px;
}

:deep(.weather-layer-popover__panel .layer-panel__toggle) {
  font-size: 12px;
}

:deep(.weather-layer-popover__panel .layer-panel__opacity) {
  grid-template-columns: 42px minmax(0, 1fr) 34px;
  padding-left: 24px;
  font-size: 10px;
}

:global(.weather-dashboard--v2 .weather-map-panel__controls button[aria-label="图层"]) {
  display: none;
}

:global(.weather-dashboard--v2 .weather-map-panel__controls button[aria-label="定位"]) {
  transform: translateY(48px);
}

@media (min-width: 1321px) and (max-width: 1600px) {
  .weather-layer-popover {
    top: 284px;
    right: 14px;
  }

  .weather-layer-popover__panel {
    top: -108px;
    width: 244px;
    max-height: 335px;
  }
}
</style>
