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
  top: 12px;
  left: 12px;
}

.weather-layer-popover__trigger {
  display: inline-flex;
  height: 36px;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid rgba(143, 197, 234, 0.18);
  border-radius: 8px;
  background: rgba(3, 17, 29, 0.82);
  box-shadow: 0 8px 22px rgba(0, 4, 10, 0.19);
  color: #d8e8f2;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.weather-layer-popover__trigger:hover {
  border-color: rgba(89, 177, 240, 0.36);
  background: rgba(10, 40, 63, 0.92);
  color: #fff;
}

.weather-layer-popover__trigger[aria-expanded="true"] {
  border-color: rgba(67, 172, 247, 0.52);
  background: rgba(18, 72, 108, 0.92);
  color: #fff;
}

.weather-layer-popover__trigger .ui-icon {
  width: 17px;
  height: 17px;
}

.weather-layer-popover__trigger span {
  font-size: 12px;
  font-weight: 550;
  letter-spacing: 0.01em;
}

.weather-layer-popover__panel {
  position: absolute;
  top: 44px;
  left: 0;
  width: 258px;
  max-height: 410px;
  overflow: auto;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
}

:deep(.weather-layer-popover__panel .panel-title) {
  padding-block: 9px 7px;
}

:deep(.weather-layer-popover__panel .layer-panel__section--primary) {
  padding: 7px 12px 2px;
}

:deep(.weather-layer-popover__panel .layer-panel__section--overlays) {
  margin-inline: 12px;
}

:deep(.weather-layer-popover__panel .layer-panel__list) {
  gap: 4px;
  padding: 5px 0 8px;
}

:deep(.weather-layer-popover__panel .layer-panel__toggle) {
  font-size: 11px;
}

:deep(.weather-layer-popover__panel .layer-panel__opacity) {
  grid-template-columns: 42px minmax(0, 1fr) 34px;
  padding-left: 22px;
  font-size: 9px;
}

:deep(.weather-layer-popover__panel .layer-panel__opacity--primary) {
  padding-left: 0;
}

:global(.weather-dashboard--v2 .weather-map-panel__controls button[aria-label="图层"]) {
  display: none;
}

@media (min-width: 1321px) and (max-width: 1600px) {
  .weather-layer-popover {
    top: 10px;
    left: 10px;
  }

  .weather-layer-popover__trigger {
    height: 34px;
    padding-inline: 10px;
  }

  .weather-layer-popover__panel {
    top: 42px;
    width: 244px;
    max-height: 392px;
  }
}
</style>
