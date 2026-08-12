<template>
  <section class="weather-legend weather-legend--map" aria-label="地图数据图例">
    <template v-if="layerStore.temperatureEnabled && weatherStore.currentWindGridFrame">
      <span class="weather-legend__unit weather-legend__unit--temperature">温度预报场</span>
      <span class="weather-legend__live-meta">°C</span>
      <div class="weather-legend__scale weather-legend__scale--model">
        <div class="weather-legend__labels">
          <span v-for="item in temperatureLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--temperature"></div>
      </div>
    </template>
    <template v-else-if="layerStore.humidityEnabled && weatherStore.currentWindGridFrame">
      <span class="weather-legend__unit weather-legend__unit--humidity">湿度预报场</span>
      <span class="weather-legend__live-meta">%</span>
      <div class="weather-legend__scale weather-legend__scale--model">
        <div class="weather-legend__labels">
          <span v-for="item in humidityLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--humidity"></div>
      </div>
    </template>
    <template v-else-if="weatherStore.currentRainViewerFrame">
      <span class="weather-legend__unit weather-legend__unit--live">雷达 LIVE</span>
      <span class="weather-legend__live-meta">观测 · 10 min</span>
      <a
        class="weather-legend__source"
        href="https://www.rainviewer.com/"
        target="_blank"
        rel="noopener noreferrer"
      >RainViewer</a>
    </template>
    <template v-else-if="weatherStore.currentWindGridFrame">
      <span class="weather-legend__unit weather-legend__unit--model">模式降水 LIVE</span>
      <span class="weather-legend__live-meta">mm / 15 min</span>
      <div class="weather-legend__scale weather-legend__scale--model">
        <div class="weather-legend__labels">
          <span v-for="item in modelLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--model"></div>
      </div>
    </template>
    <template v-else>
      <span class="weather-legend__unit">DEMO dBZ</span>
      <div class="weather-legend__scale">
        <div class="weather-legend__labels">
          <span v-for="item in demoLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient"></div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useLayerStore } from '@/stores/layerStore';
import { useWeatherStore } from '@/stores/weather';

const weatherStore = useWeatherStore();
const layerStore = useLayerStore();
const demoLabels = ['<5', '10', '20', '30', '40', '50', '60', '70+'];
const modelLabels = ['.02', '.1', '.35', '.75', '1.5', '3', '6', '10+'];
const temperatureLabels = ['18', '22', '26', '29', '32', '36', '40'];
const humidityLabels = ['30', '45', '60', '75', '88', '100'];
</script>

<style scoped>
.weather-legend__unit--live {
  color: #cfeeff;
}

.weather-legend__unit--model {
  color: #bcebd9;
  white-space: nowrap;
}

.weather-legend__unit--temperature {
  color: #ffd19a;
  white-space: nowrap;
}

.weather-legend__unit--humidity {
  color: #9fe8dc;
  white-space: nowrap;
}

.weather-legend__live-meta {
  color: #7f9cad;
  font-size: 9px;
  white-space: nowrap;
}

.weather-legend__source {
  color: #72bdea;
  font-size: 9px;
  text-decoration: none;
  white-space: nowrap;
}

.weather-legend__source:hover,
.weather-legend__source:focus-visible {
  color: #b8e3ff;
  text-decoration: underline;
}

.weather-legend__scale--model {
  min-width: 230px;
}

.weather-legend__gradient--model {
  background: linear-gradient(
    90deg,
    rgba(38, 117, 223, 0.72),
    rgba(51, 170, 255, 0.78),
    rgba(54, 211, 199, 0.82),
    rgba(81, 211, 120, 0.86),
    rgba(240, 214, 66, 0.9),
    rgba(245, 145, 53, 0.92),
    rgba(226, 68, 109, 0.94),
    rgba(194, 62, 194, 0.95)
  );
}

.weather-legend__gradient--temperature {
  background: linear-gradient(
    90deg,
    rgb(62 100 214),
    rgb(48 156 232),
    rgb(55 202 184),
    rgb(224 209 77),
    rgb(244 143 64),
    rgb(222 74 80),
    rgb(173 58 127)
  );
}

.weather-legend__gradient--humidity {
  background: linear-gradient(
    90deg,
    rgb(111 86 182),
    rgb(80 104 205),
    rgb(55 142 222),
    rgb(43 184 206),
    rgb(48 205 166),
    rgb(93 220 139)
  );
}
</style>
