<template>
  <section class="dashboard-panel alert-panel alert-panel--v2">
    <div class="alert-panel__header">
      <h2>天气预警</h2>
      <span>DEMO · {{ activeAlerts.length }} 条生效</span>
    </div>

    <div class="alert-panel__list">
      <article
        v-for="alert in weatherStore.alerts"
        :key="alert.id"
        :class="[`alert-card alert-card--${alert.level}`, { active: mapStore.activeAlertId === alert.id }]"
        @click="mapStore.selectAlert(alert.id)"
      >
        <div class="alert-card__icon"><WeatherIcon :name="alert.icon" /></div>
        <div class="alert-card__body">
          <div class="alert-card__head">
            <h3>{{ alert.title }}</h3>
            <span>{{ alert.status === 'active' ? '生效中' : '已解除' }}</span>
          </div>
          <p class="alert-card__district">{{ alert.district }}</p>
          <p class="alert-card__time">{{ alert.issuedAt }}</p>
        </div>
        <button class="alert-card__detail" type="button" aria-label="查看预警详情" @click.stop="openAlert(alert)">›</button>
      </article>
    </div>

    <Teleport to="body">
      <div v-if="detailAlert" class="alert-dialog" role="presentation" @click.self="closeAlert">
        <section class="alert-dialog__panel" role="dialog" aria-modal="true" :aria-labelledby="`alert-title-${detailAlert.id}`">
          <header class="alert-dialog__header">
            <div :class="[`alert-dialog__icon alert-dialog__icon--${detailAlert.level}`]">
              <WeatherIcon :name="detailAlert.icon" />
            </div>
            <div>
              <span class="alert-dialog__eyebrow">深圳市气象预警 · DEMO</span>
              <h2 :id="`alert-title-${detailAlert.id}`">{{ detailAlert.title }}</h2>
            </div>
            <button ref="closeButton" class="alert-dialog__close" type="button" aria-label="关闭预警详情" @click="closeAlert">×</button>
          </header>

          <div class="alert-dialog__meta">
            <span>{{ detailAlert.status === 'active' ? '生效中' : '已解除' }}</span>
            <dl>
              <div><dt>发布时间</dt><dd>{{ detailAlert.issuedAt }}</dd></div>
              <div><dt>预计时段</dt><dd>{{ detailAlert.forecastPeriod }}</dd></div>
            </dl>
          </div>

          <div class="alert-dialog__content">
            <h3>预警说明</h3>
            <p>{{ detailAlert.description }}</p>
            <h3>影响区域</h3>
            <ul>
              <li v-for="area in detailAlert.affectedAreas" :key="area">{{ area }}</li>
            </ul>
          </div>

          <footer class="alert-dialog__footer">
            <button type="button" @click="locateAlert">在地图中查看</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { useWeatherStore } from '@/stores/weather';
import type { WeatherAlert } from '@/types/weather';
import WeatherIcon from './WeatherIcon.vue';

const mapStore = useMapStore();
const weatherStore = useWeatherStore();
const activeAlerts = computed(() => weatherStore.alerts.filter((alert) => alert.status === 'active'));
const detailAlert = ref<WeatherAlert | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);

function openAlert(alert: WeatherAlert | undefined) {
  if (!alert) return;
  detailAlert.value = alert;
  mapStore.selectAlert(alert.id);
  void nextTick(() => closeButton.value?.focus());
}

function closeAlert() {
  detailAlert.value = null;
}

function locateAlert() {
  if (detailAlert.value) mapStore.selectAlert(detailAlert.value.id);
  closeAlert();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && detailAlert.value) closeAlert();
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown));
</script>

<style scoped>
.alert-panel--v2 {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.alert-panel__list {
  display: grid;
  flex: 1;
  align-content: start;
  grid-auto-rows: auto;
}

.alert-panel--v2 .alert-card {
  min-height: 82px;
  padding-block: 10px;
}
</style>
