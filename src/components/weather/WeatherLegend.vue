<template>
  <section class="weather-legend weather-legend--map" aria-label="地图数据图例">
    <span v-if="layerStore.windEnabled" class="weather-legend__wind">
      <span>风速</span>
      <i aria-hidden="true"></i>
      <small>0 · 3 · 6 · 10+ m/s</small>
    </span>
    <span
      v-if="layerStore.pressureEnabled && weatherStore.currentWindGridFrame"
      class="weather-legend__pressure"
    >
      <i aria-hidden="true"></i>
      模式等压线 · 0.5 hPa
    </span>
    <template v-if="layerStore.temperatureEnabled && weatherStore.currentWindGridFrame">
      <span class="weather-legend__unit weather-legend__unit--temperature">温度预报场</span>
      <span class="weather-legend__live-meta">°C · {{ gridResolutionLabel }} · 插值</span>
      <div class="weather-legend__scale weather-legend__scale--model">
        <div class="weather-legend__labels">
          <span v-for="item in temperatureLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--temperature"></div>
      </div>
    </template>
    <template v-else-if="layerStore.humidityEnabled && weatherStore.currentWindGridFrame">
      <span class="weather-legend__unit weather-legend__unit--humidity">湿度预报场</span>
      <span class="weather-legend__live-meta">% · {{ gridResolutionLabel }} · 插值</span>
      <div class="weather-legend__scale weather-legend__scale--model">
        <div class="weather-legend__labels">
          <span v-for="item in humidityLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--humidity"></div>
      </div>
    </template>
    <template v-else-if="layerStore.radarEnabled && weatherStore.currentRainViewerFrame">
      <span class="weather-legend__unit weather-legend__unit--live">雷达 LIVE</span>
      <span class="weather-legend__live-meta">dBZ · 10 min</span>
      <div class="weather-legend__scale weather-legend__scale--live">
        <div class="weather-legend__labels">
          <span v-for="item in liveLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--live"></div>
      </div>
      <a class="weather-legend__source" href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>
    </template>
    <template v-else-if="layerStore.radarEnabled && weatherStore.currentWindGridFrame">
      <span class="weather-legend__unit weather-legend__unit--model">模式降水 LIVE</span>
      <span class="weather-legend__live-meta">mm / 15 min · {{ gridResolutionLabel }} · 插值</span>
      <div class="weather-legend__scale weather-legend__scale--model">
        <div class="weather-legend__labels">
          <span v-for="item in modelLabels" :key="item">{{ item }}</span>
        </div>
        <div class="weather-legend__gradient weather-legend__gradient--model"></div>
      </div>
    </template>
    <template v-else-if="layerStore.radarEnabled">
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
import { WIND_GRID_COLUMNS, WIND_GRID_ROWS } from '@/services/openMeteoWindGrid';
import { useWeatherStore } from '@/stores/weather';

const weatherStore = useWeatherStore();
const layerStore = useLayerStore();
const gridResolutionLabel = `${WIND_GRID_COLUMNS}×${WIND_GRID_ROWS}`;
const demoLabels = ['<5', '10', '20', '30', '40', '50', '60', '70+'];
const liveLabels = ['<10', '15', '20', '30', '35', '45', '55', '65+'];
const modelLabels = ['.02', '.1', '.35', '.75', '1.5', '3', '6', '10+'];
const temperatureLabels = ['-30', '-10', '10', '30', '50'];
const humidityLabels = ['0', '20', '40', '60', '80', '100'];
</script>

<style scoped>
.weather-legend__wind {
  display: inline-grid;
  flex: 0 1 132px;
  grid-template-columns: auto minmax(34px, 54px);
  align-items: center;
  gap: 2px 6px;
  color: #b9d4e3;
  font-size: 9px;
  white-space: nowrap;
}

.weather-legend__wind i {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(117 185 218 / 65%), rgb(137 220 244 / 82%), rgb(225 252 255 / 96%));
}

.weather-legend__wind small {
  grid-column: 1 / -1;
  color: #7895a6;
  font-size: 8px;
  letter-spacing: 0.01em;
}

.weather-legend__pressure {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #cfe1ec;
  font-size: 9px;
  white-space: nowrap;
}

.weather-legend__pressure i {
  width: 16px;
  height: 1px;
  background: rgba(211, 231, 244, 0.86);
  box-shadow: 0 0 3px rgba(160, 210, 240, 0.24);
}

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
  pointer-events: auto;
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

.weather-legend__scale--live {
  min-width: 250px;
}

.weather-legend__gradient--live {
  background: linear-gradient(
    90deg,
    rgba(206, 192, 135, 0.58),
    #88ddee,
    #00a3e0,
    #005588,
    #ffee00,
    #ff4400,
    #c10000,
    #ff77ff
  );
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
    rgb(87 48 168),
    rgb(68 65 190),
    rgb(53 92 202),
    rgb(38 162 218),
    rgb(67 193 166),
    rgb(230 210 75),
    rgb(244 153 61),
    rgb(221 77 74),
    rgb(164 38 84)
  );
}

.weather-legend__gradient--humidity {
  background: linear-gradient(
    90deg,
    rgb(151 91 45),
    rgb(216 143 55),
    rgb(224 203 91),
    rgb(115 190 154),
    rgb(52 157 211),
    rgb(54 67 166)
  );
}
</style>
