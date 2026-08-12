<template>
  <section class="dashboard-panel risk-banner" aria-label="强降雨风险概览">
    <div class="risk-banner__main">
      <span class="risk-banner__icon" aria-hidden="true">!</span>
      <strong>DEMO · {{ title }}</strong>
      <span>{{ affectedCount }} 个区域受影响 · {{ activeAlerts.length }} 条预警生效</span>
    </div>
    <button type="button" :disabled="activeAlerts.length === 0" @click="focusPrimaryAlert">
      查看详情 <span aria-hidden="true">›</span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { useWeatherStore } from '@/stores/weather';

const weatherStore = useWeatherStore();
const mapStore = useMapStore();

const activeAlerts = computed(() => weatherStore.alerts.filter((alert) => alert.status === 'active'));
const affectedAreas = computed(() => new Set(activeAlerts.value.flatMap((alert) => alert.affectedAreas)));
const affectedCount = computed(() => affectedAreas.value.size);
const title = computed(() => activeAlerts.value.length > 0 ? '强降雨风险升高' : '当前无生效气象预警');

function focusPrimaryAlert() {
  const alert = activeAlerts.value[0];
  if (alert) mapStore.selectAlert(alert.id);
}
</script>
