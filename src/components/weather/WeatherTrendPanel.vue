<template>
  <section class="dashboard-panel trend-panel">
    <div class="trend-panel__header">
      <h2>趋势分析（未来24小时）</h2>
      <div class="trend-panel__selector">
        <span>高亮指标</span>
        <div class="trend-panel__tabs" aria-label="高亮趋势指标">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="{ active: tab === activeTab }"
            type="button"
            :aria-pressed="tab === activeTab"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>

    <div class="trend-panel__charts">
      <RainTrendChart class="trend-chart trend-chart--rain" :class="{ focused: activeTab === '降雨量' }" />
      <TemperatureHumidityChart class="trend-chart trend-chart--thermo" :class="{ focused: activeTab === '温度' || activeTab === '湿度' }" />
      <WindSpeedChart class="trend-chart trend-chart--wind" :class="{ focused: activeTab === '风速' }" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RainTrendChart from '@/components/charts/RainTrendChart.vue';
import TemperatureHumidityChart from '@/components/charts/TemperatureHumidityChart.vue';
import WindSpeedChart from '@/components/charts/WindSpeedChart.vue';

const tabs = ['降雨量', '温度', '湿度', '风速'];
const activeTab = ref<(typeof tabs)[number]>('降雨量');
</script>

<style scoped>
.trend-panel__selector {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.trend-panel__selector > span {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.trend-panel__tabs button {
  min-width: 0;
}

@media (min-width: 1201px) and (max-width: 1600px) {
  .trend-panel__header {
    gap: 10px;
    margin-bottom: 6px;
  }

  .trend-panel__selector {
    gap: 6px;
  }

  .trend-panel__tabs {
    gap: 3px;
  }

  .trend-panel__tabs button {
    padding: 5px 9px;
    font-size: 12px;
  }

  .trend-panel__charts {
    grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(0, 0.9fr);
    gap: 8px;
  }
}

@media (min-width: 1201px) and (max-width: 1460px) {
  .trend-panel__selector > span {
    display: none;
  }

  .trend-panel__tabs button {
    padding-inline: 8px;
    font-size: 11px;
  }

  .trend-panel__charts {
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr) minmax(0, 0.85fr);
    gap: 6px;
  }
}
</style>
