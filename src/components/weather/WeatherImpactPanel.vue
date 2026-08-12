<template>
  <section class="dashboard-panel impact-panel">
    <div class="impact-panel__header">
      <h2>重点影响区域</h2>
      <span>风险等级</span>
    </div>

    <ul>
      <li v-for="item in impactAreas" :key="`${item.area}-${item.alertId}`">
        <button type="button" @click="mapStore.selectAlert(item.alertId)">
          <span class="impact-panel__area"><i :class="`impact-panel__dot impact-panel__dot--${item.level}`"></i>{{ item.area }}</span>
          <strong :class="`impact-panel__risk impact-panel__risk--${item.level}`">{{ item.risk }}</strong>
        </button>
      </li>
    </ul>

    <div v-if="impactAreas.length === 0" class="impact-panel__empty">当前无重点影响区域</div>
    <button v-else class="impact-panel__more" type="button" @click="focusFirstArea">查看全部区域 ›</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { useWeatherStore } from '@/stores/weather';

const weatherStore = useWeatherStore();
const mapStore = useMapStore();

const riskLabel = (level: string) => {
  if (level === 'red') return '强风险';
  if (level === 'orange') return '高风险';
  if (level === 'yellow') return '中高风险';
  return '关注';
};

const impactAreas = computed(() => {
  const seen = new Set<string>();
  return weatherStore.alerts
    .filter((alert) => alert.status === 'active')
    .flatMap((alert) => alert.affectedAreas.map((area) => ({
      area,
      alertId: alert.id,
      level: alert.level,
      risk: riskLabel(alert.level),
    })))
    .filter((item) => {
      if (seen.has(item.area)) return false;
      seen.add(item.area);
      return true;
    })
    .slice(0, 4);
});

function focusFirstArea() {
  const first = impactAreas.value[0];
  if (first) mapStore.selectAlert(first.alertId);
}
</script>
