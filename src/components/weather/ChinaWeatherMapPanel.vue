<template>
  <section class="dashboard-panel weather-map-panel" :class="{ 'weather-map-panel--fallback': mapFailed }" aria-label="中国天气地图">
    <div ref="mapContainer" class="weather-map-panel__canvas"></div>
    <div class="weather-map-panel__shade"></div>

    <div class="weather-map-panel__time">当前时间：{{ mapFrameDate }} {{ timelineStore.currentFrameTime }}</div>
    <div class="weather-map-panel__data-status" :title="store.dataSource">
      <i aria-hidden="true"></i>
      {{ store.dataStatusLabel }}
    </div>

    <article v-if="mapStore.popup" class="weather-map-panel__popup" @click.stop>
      <button type="button" aria-label="关闭" @click="mapStore.closePopup()">×</button>
      <h3>{{ mapStore.popup.label ?? '点击位置' }}</h3>
      <p><span>时间：</span>{{ timelineStore.currentFrameTime }}</p>
      <p><span>经度：</span>{{ mapStore.popup.longitude.toFixed(4) }}°E</p>
      <p><span>纬度：</span>{{ mapStore.popup.latitude.toFixed(4) }}°N</p>
      <p><span>降雨等级：</span>{{ rainfallLevel }}</p>
      <p><span>降雨强度：</span>{{ mapStore.popup.rainfallIntensity.toFixed(1) }} mm/h</p>
      <p><span>1小时降雨：</span>{{ mapStore.popup.rainfall1h.toFixed(1) }} mm</p>
      <p><span>温度：</span>{{ mapStore.popup.temperature.toFixed(1) }}°C</p>
      <p><span>湿度：</span>{{ mapStore.popup.humidity }}%</p>
      <p><span>风速：</span>{{ mapStore.popup.windSpeed.toFixed(1) }} m/s</p>
      <p><span>风向：</span>{{ mapStore.popup.windDirection }}</p>
      <p v-if="mapStore.popup.alertTitle"><span>预警：</span><strong>{{ mapStore.popup.alertTitle }}</strong></p>
    </article>

    <div class="weather-map-panel__controls" aria-label="地图控制">
      <button type="button" aria-label="放大" @click="zoomMap(1)"><span>+</span></button>
      <button type="button" aria-label="缩小" @click="zoomMap(-1)"><span>−</span></button>
      <button type="button" aria-label="上一帧" @click="timelineStore.stepFrame(-1)"><UiIcon name="chevron-left" /></button>
      <button type="button" aria-label="下一帧" @click="timelineStore.stepFrame(1)"><UiIcon name="chevron-right" /></button>
      <button type="button" aria-label="图层" :class="{ active: layerMenuOpen }" @click="layerMenuOpen = !layerMenuOpen"><UiIcon name="layers" /></button>
      <button type="button" aria-label="定位" @click="resetMapView"><UiIcon name="locate" /></button>
    </div>

    <div v-if="layerMenuOpen" class="weather-map-panel__layer-menu">
      <label><input v-model="layerStore.radarEnabled" type="checkbox" />降水图层</label>
      <label><input v-model="layerStore.alertEnabled" type="checkbox" />风险区域</label>
      <label><input v-model="layerStore.stationEnabled" type="checkbox" />重点城市</label>
      <label><input v-model="layerStore.windEnabled" type="checkbox" />风场流线</label>
      <label><input v-model="layerStore.temperatureEnabled" type="checkbox" :disabled="store.windDataStatus !== 'live'" />温度热力</label>
      <label><input v-model="layerStore.humidityEnabled" type="checkbox" :disabled="store.windDataStatus !== 'live'" />湿度热力</label>
      <label><input v-model="layerStore.pressureEnabled" type="checkbox" :disabled="store.windDataStatus !== 'live'" />气压等值线</label>
    </div>

    <div class="weather-map-panel__scale">500 km</div>
  </section>
</template>

<script setup lang="ts">
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { FeatureCollection, Polygon } from 'geojson';
import maplibregl, { type Map, type MapMouseEvent, type RasterTileSource, type StyleSpecification } from 'maplibre-gl';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { CHINA_BOUNDS, CHINA_MAJOR_CITIES, CHINA_NAVIGATION_BOUNDS } from '@/config/chinaWeather';
import { createMockWindStreams } from '@/mock/windField';
import { useLayerStore } from '@/stores/layerStore';
import { useMapStore } from '@/stores/mapStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useWeatherStore } from '@/stores/weather';
import {
  createForecastPrecipitationBitmap,
  createForecastPrecipitationLayer,
} from '@/utils/forecastPrecipitationLayer';
import {
  createForecastPressureContours,
  createForecastPressureLayer,
  type PressureContourSegment,
} from '@/utils/forecastPressureContours';
import {
  createForecastScalarBitmap,
  createForecastScalarLayer,
} from '@/utils/forecastScalarLayer';
import { createForecastWindStreams } from '@/utils/liveWindField';
import { createNationalDemoRadarPoints } from '@/utils/nationalDemoRadar';
import { createRadarBitmap, createRainRadarBitmapLayer, type RadarBitmapBounds } from '@/utils/radarDeckLayers';
import { createWindFieldLayers } from '@/utils/windDeckLayers';
import UiIcon from './UiIcon.vue';

const chinaBitmapBounds: RadarBitmapBounds = [
  CHINA_BOUNDS[0][0],
  CHINA_BOUNDS[0][1],
  CHINA_BOUNDS[1][0],
  CHINA_BOUNDS[1][1],
];
const rainViewerSourceId = 'rainviewer-radar';
const rainViewerLayerId = 'rainviewer-radar-layer';

const store = useWeatherStore();
const layerStore = useLayerStore();
const mapStore = useMapStore();
const timelineStore = useTimelineStore();
const mapContainer = ref<HTMLDivElement | null>(null);
const mapFailed = ref(false);
const layerMenuOpen = ref(false);
let map: Map | null = null;
let mapStyleReady = false;
let deckOverlay: MapboxOverlay | null = null;
let cityMarkers: maplibregl.Marker[] = [];
let stationMarkers: maplibregl.Marker[] = [];
let demoPrecipitationBitmap: HTMLCanvasElement | null = null;
let forecastPrecipitationBitmap: HTMLCanvasElement | null = null;
let forecastTemperatureBitmap: HTMLCanvasElement | null = null;
let forecastHumidityBitmap: HTMLCanvasElement | null = null;
let forecastPressureContours: PressureContourSegment[] = [];
let mapResizeObserver: ResizeObserver | null = null;
let windAnimationFrame: number | null = null;
let windParticlePhase = 0;
let windLastFrameTime = 0;
let windLastRenderTime = 0;

const demoAlertsVisible = computed(() => (
  layerStore.alertEnabled && (store.dataStatus === 'mock' || store.dataStatus === 'fallback')
));

const createCurrentWindStreams = () => {
  const liveFrame = store.currentWindGridFrame;
  return liveFrame
    ? createForecastWindStreams(liveFrame)
    : createMockWindStreams(timelineStore.currentFrameIndex);
};

let currentWindStreams = createCurrentWindStreams();

const mapFrameDate = computed(() => (
  store.forecastFrames[timelineStore.currentFrameIndex]?.timestamp.slice(0, 10) ?? '2026-08-13'
));

const rainfallLevel = computed(() => {
  const intensity = mapStore.popup?.rainfallIntensity ?? 0;
  if (intensity >= 32) return '大暴雨';
  if (intensity >= 16) return '暴雨';
  if (intensity >= 8) return '大雨';
  if (intensity >= 2.5) return '中雨';
  if (intensity > 0) return '小雨';
  return '无雨';
});

const alertAreaGeoJson: FeatureCollection<Polygon, { id: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'south-china-rain-yellow' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[105.5, 18.0], [117.8, 18.0], [117.8, 26.5], [105.5, 26.5], [105.5, 18.0]]],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'east-china-convective-blue' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[115.0, 23.5], [124.0, 23.5], [124.0, 33.8], [115.0, 33.8], [115.0, 23.5]]],
      },
    },
  ],
};

const alertViewpoints: Record<string, { center: [number, number]; zoom: number }> = {
  'south-china-rain-yellow': { center: [111.8, 22.4], zoom: 4.5 },
  'east-china-convective-blue': { center: [119.8, 28.7], zoom: 4.7 },
};

const darkBaseTiles = [
  'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
];

const resetMapView = () => map?.fitBounds(CHINA_BOUNDS, { padding: 20, duration: 350 });
const zoomMap = (direction: 1 | -1) => map?.easeTo({ zoom: map.getZoom() + direction, duration: 250 });

const createNationalDemoPrecipitationBitmap = () => {
  return createRadarBitmap({
    points: createNationalDemoRadarPoints(),
    bounds: chinaBitmapBounds,
    width: 960,
    height: 600,
  });
};

const rebuildModelBitmaps = () => {
  const modelFrame = store.currentWindGridFrame;
  if (!modelFrame) {
    forecastPrecipitationBitmap = null;
    forecastTemperatureBitmap = null;
    forecastHumidityBitmap = null;
    forecastPressureContours = [];
    return;
  }
  forecastPrecipitationBitmap = createForecastPrecipitationBitmap(modelFrame);
  forecastTemperatureBitmap = createForecastScalarBitmap(modelFrame, 'temperature');
  forecastHumidityBitmap = createForecastScalarBitmap(modelFrame, 'humidity');
  forecastPressureContours = createForecastPressureContours(modelFrame);
};

const updateWeatherLayers = (rebuildBitmap = false) => {
  if (!demoPrecipitationBitmap) demoPrecipitationBitmap = createNationalDemoPrecipitationBitmap();
  if (rebuildBitmap || (!forecastPrecipitationBitmap && store.currentWindGridFrame)) rebuildModelBitmaps();
  if (!deckOverlay || !demoPrecipitationBitmap) return;

  const observedRadarActive = Boolean(store.currentRainViewerTileTemplate);
  const modelPrecipitationActive = Boolean(forecastPrecipitationBitmap);
  deckOverlay.setProps({
    layers: [
      ...(forecastTemperatureBitmap ? [
        createForecastScalarLayer({
          field: 'temperature',
          image: forecastTemperatureBitmap,
          opacity: layerStore.temperatureOpacity / 100,
          visible: layerStore.temperatureEnabled,
        }),
      ] : []),
      ...(forecastHumidityBitmap ? [
        createForecastScalarLayer({
          field: 'humidity',
          image: forecastHumidityBitmap,
          opacity: layerStore.humidityOpacity / 100,
          visible: layerStore.humidityEnabled,
        }),
      ] : []),
      createRainRadarBitmapLayer({
        image: demoPrecipitationBitmap,
        bounds: chinaBitmapBounds,
        opacity: layerStore.radarOpacity / 100,
        visible: layerStore.radarEnabled && !observedRadarActive && !modelPrecipitationActive,
      }),
      ...(forecastPrecipitationBitmap ? [
        createForecastPrecipitationLayer({
          image: forecastPrecipitationBitmap,
          opacity: layerStore.radarOpacity / 100,
          visible: layerStore.radarEnabled && !observedRadarActive,
        }),
      ] : []),
      createForecastPressureLayer({
        segments: forecastPressureContours,
        opacity: layerStore.pressureOpacity / 100,
        visible: layerStore.pressureEnabled && forecastPressureContours.length > 0,
      }),
      ...createWindFieldLayers({
        streams: currentWindStreams,
        opacity: layerStore.windOpacity / 100,
        visible: layerStore.windEnabled,
        particlePhase: windParticlePhase,
      }),
    ],
  });
};

const syncRainViewerLayer = () => {
  if (!map || !mapStyleReady) return;
  const tileTemplate = store.currentRainViewerTileTemplate;
  const existingSource = map.getSource(rainViewerSourceId) as RasterTileSource | undefined;

  if (!tileTemplate) {
    if (map.getLayer(rainViewerLayerId)) map.setLayoutProperty(rainViewerLayerId, 'visibility', 'none');
    updateWeatherLayers();
    return;
  }

  if (!existingSource) {
    map.addSource(rainViewerSourceId, {
      type: 'raster',
      tiles: [tileTemplate],
      tileSize: 256,
      maxzoom: 7,
      attribution: 'Weather radar by RainViewer',
    });
    map.addLayer({
      id: rainViewerLayerId,
      type: 'raster',
      source: rainViewerSourceId,
      layout: { visibility: layerStore.radarEnabled ? 'visible' : 'none' },
      paint: {
        'raster-opacity': layerStore.radarOpacity / 100,
        'raster-fade-duration': 0,
        'raster-resampling': 'linear',
        'raster-saturation': 0.12,
        'raster-contrast': 0.16,
        'raster-brightness-min': 0.06,
        'raster-brightness-max': 0.96,
      },
    }, 'alert-area-fill');
  } else {
    existingSource.setTiles([tileTemplate]);
    if (map.getLayer(rainViewerLayerId)) {
      map.setLayoutProperty(rainViewerLayerId, 'visibility', layerStore.radarEnabled ? 'visible' : 'none');
      map.setPaintProperty(rainViewerLayerId, 'raster-opacity', layerStore.radarOpacity / 100);
    }
  }
  updateWeatherLayers();
};

const showStationPopup = (stationId: string) => {
  const station = store.stations.find((item) => item.id === stationId);
  if (!station) return;
  mapStore.selectStation(station);
  map?.easeTo({ center: [station.longitude, station.latitude], zoom: Math.max(4.4, map.getZoom()), duration: 350 });
};

const updateStationMarkers = () => {
  stationMarkers.forEach((marker) => {
    const element = marker.getElement();
    element.style.display = layerStore.stationEnabled ? '' : 'none';
    element.classList.toggle('active', element.dataset.stationId === mapStore.activeStationId);
  });
};

const handleMapClick = (event: MapMouseEvent) => {
  const { lng, lat } = event.lngLat;
  mapStore.showPopup({
    label: store.currentWindGridFrame ? '模式预报 · 点击位置' : '点击位置 · 全国概览 DEMO',
    longitude: lng,
    latitude: lat,
    rainfallIntensity: store.currentWeather.maxRainIntensity,
    rainfall1h: store.currentWeather.rainfall1h,
    temperature: store.currentWeather.temperature,
    humidity: store.currentWeather.humidity,
    windSpeed: store.currentWeather.windSpeed,
    windDirection: '模式风场',
    alertTitle: undefined,
  });
  map?.easeTo({ center: [lng, lat], duration: 350 });
};

const stopWindAnimation = () => {
  if (windAnimationFrame !== null) window.cancelAnimationFrame(windAnimationFrame);
  windAnimationFrame = null;
  windLastFrameTime = 0;
  windLastRenderTime = 0;
};

const animateWindParticles = (timestamp: number) => {
  if (!layerStore.windEnabled || document.hidden) {
    stopWindAnimation();
    return;
  }
  if (windLastFrameTime === 0) windLastFrameTime = timestamp;
  const deltaSeconds = Math.min(0.1, (timestamp - windLastFrameTime) / 1000);
  windLastFrameTime = timestamp;
  if (timestamp - windLastRenderTime >= 66) {
    windParticlePhase += deltaSeconds;
    windLastRenderTime = timestamp;
    updateWeatherLayers();
  }
  windAnimationFrame = window.requestAnimationFrame(animateWindParticles);
};

const startWindAnimation = () => {
  if (windAnimationFrame !== null || !layerStore.windEnabled || document.hidden) return;
  windAnimationFrame = window.requestAnimationFrame(animateWindParticles);
};

const handleVisibilityChange = () => {
  if (document.hidden) stopWindAnimation();
  else startWindAnimation();
};

onMounted(() => {
  if (!mapContainer.value) return;
  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      center: store.center,
      zoom: 3.2,
      minZoom: 2.3,
      maxZoom: 8.5,
      maxBounds: CHINA_NAVIGATION_BOUNDS,
      renderWorldCopies: false,
      interactive: true,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          darkBase: {
            type: 'raster',
            tiles: darkBaseTiles,
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO',
          },
          alertArea: { type: 'geojson', data: alertAreaGeoJson },
        },
        layers: [
          { id: 'map-background', type: 'background', paint: { 'background-color': '#031120' } },
          {
            id: 'dark-osm-base',
            type: 'raster',
            source: 'darkBase',
            paint: {
              'raster-opacity': 0.92,
              'raster-saturation': -0.46,
              'raster-brightness-min': 0.06,
              'raster-brightness-max': 0.8,
              'raster-contrast': 0.1,
            },
          },
          {
            id: 'alert-area-fill',
            type: 'fill',
            source: 'alertArea',
            filter: ['==', ['get', 'id'], mapStore.activeAlertId],
            layout: { visibility: demoAlertsVisible.value ? 'visible' : 'none' },
            paint: {
              'fill-color': mapStore.activeAlertId === 'east-china-convective-blue' ? '#3b82f6' : '#facc15',
              'fill-opacity': layerStore.alertOpacity / 100 * 0.12,
            },
          },
          {
            id: 'alert-area-outline',
            type: 'line',
            source: 'alertArea',
            filter: ['==', ['get', 'id'], mapStore.activeAlertId],
            layout: { visibility: demoAlertsVisible.value ? 'visible' : 'none' },
            paint: {
              'line-color': mapStore.activeAlertId === 'east-china-convective-blue' ? '#60a5fa' : '#facc15',
              'line-width': 2,
              'line-dasharray': [2, 1.5],
              'line-opacity': layerStore.alertOpacity / 100,
            },
          },
        ],
      } as StyleSpecification,
    });

    map.on('click', handleMapClick);
    mapResizeObserver = new ResizeObserver(() => {
      if (!map) return;
      map.resize();
    });
    mapResizeObserver.observe(mapContainer.value);

    map.once('style.load', () => {
      if (!map) return;
      mapStyleReady = true;
      map.fitBounds(CHINA_BOUNDS, { padding: 20, duration: 0 });
      demoPrecipitationBitmap = createNationalDemoPrecipitationBitmap();
      rebuildModelBitmaps();
      currentWindStreams = createCurrentWindStreams();
      deckOverlay = new MapboxOverlay({ interleaved: false, layers: [] });
      map.addControl(deckOverlay);
      updateWeatherLayers();
      syncRainViewerLayer();

      cityMarkers = CHINA_MAJOR_CITIES.map((city) => {
        const element = document.createElement('span');
        element.className = 'weather-map-panel__district-label';
        element.textContent = city.name;
        return new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([city.longitude, city.latitude])
          .addTo(map as Map);
      });

      stationMarkers = store.stations.map((station) => {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = 'weather-map-panel__station-marker';
        element.dataset.stationId = station.id;
        element.title = `${station.name}城市参考点`;
        element.setAttribute('aria-label', `${station.name}城市参考点，24小时降雨${station.rainfall24h}毫米`);
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          showStationPopup(station.id);
        });
        return new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([station.longitude, station.latitude])
          .addTo(map as Map);
      });
      updateStationMarkers();
      startWindAnimation();
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
  } catch {
    mapFailed.value = true;
  }
});

watch(
  () => [layerStore.radarEnabled, layerStore.radarOpacity],
  () => {
    updateWeatherLayers();
    syncRainViewerLayer();
  },
);

watch(
  () => [layerStore.windEnabled, layerStore.windOpacity],
  ([enabled]) => {
    updateWeatherLayers();
    if (enabled) startWindAnimation();
    else stopWindAnimation();
  },
);

watch(
  () => [
    layerStore.temperatureEnabled,
    layerStore.temperatureOpacity,
    layerStore.humidityEnabled,
    layerStore.humidityOpacity,
    layerStore.pressureEnabled,
    layerStore.pressureOpacity,
  ],
  () => updateWeatherLayers(),
);

watch(() => layerStore.temperatureEnabled, (enabled) => {
  if (enabled) layerStore.humidityEnabled = false;
});
watch(() => layerStore.humidityEnabled, (enabled) => {
  if (enabled) layerStore.temperatureEnabled = false;
});

watch(() => timelineStore.currentFrameIndex, () => {
  currentWindStreams = createCurrentWindStreams();
  syncRainViewerLayer();
  updateWeatherLayers(true);
  mapStore.syncPopup({
    rainfallIntensity: store.currentWeather.maxRainIntensity,
    rainfall1h: store.currentWeather.rainfall1h,
    temperature: store.currentWeather.temperature,
    humidity: store.currentWeather.humidity,
    windSpeed: store.currentWeather.windSpeed,
  });
});

watch(() => store.windForecastFrames, () => {
  currentWindStreams = createCurrentWindStreams();
  updateWeatherLayers(true);
});
watch(() => store.currentRainViewerTileTemplate, () => syncRainViewerLayer());
watch(() => [layerStore.stationEnabled, mapStore.activeStationId], updateStationMarkers);

watch(demoAlertsVisible, (enabled) => {
  if (!map?.getLayer('alert-area-fill')) return;
  const visibility = enabled ? 'visible' : 'none';
  map.setLayoutProperty('alert-area-fill', 'visibility', visibility);
  map.setLayoutProperty('alert-area-outline', 'visibility', visibility);
});

watch(() => layerStore.alertOpacity, (opacity) => {
  if (!map?.getLayer('alert-area-fill')) return;
  map.setPaintProperty('alert-area-fill', 'fill-opacity', opacity / 100 * 0.12);
  map.setPaintProperty('alert-area-outline', 'line-opacity', opacity / 100);
});

watch(() => mapStore.activeAlertId, (alertId) => {
  if (!map?.getLayer('alert-area-fill')) return;
  const isBlue = alertId === 'east-china-convective-blue';
  const filter = ['==', ['get', 'id'], alertId] as maplibregl.FilterSpecification;
  map.setFilter('alert-area-fill', filter);
  map.setFilter('alert-area-outline', filter);
  map.setPaintProperty('alert-area-fill', 'fill-color', isBlue ? '#3b82f6' : '#facc15');
  map.setPaintProperty('alert-area-outline', 'line-color', isBlue ? '#60a5fa' : '#facc15');
  const viewpoint = alertViewpoints[alertId ?? ''];
  if (viewpoint) map.easeTo({ center: viewpoint.center, zoom: viewpoint.zoom, duration: 450 });
});

onBeforeUnmount(() => {
  stopWindAnimation();
  mapStyleReady = false;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  mapResizeObserver?.disconnect();
  mapResizeObserver = null;
  cityMarkers.forEach((marker) => marker.remove());
  cityMarkers = [];
  stationMarkers.forEach((marker) => marker.remove());
  stationMarkers = [];
  deckOverlay?.finalize();
  deckOverlay = null;
  map?.off('click', handleMapClick);
  map?.remove();
  map = null;
});
</script>
