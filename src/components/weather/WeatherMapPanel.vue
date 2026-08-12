<template>
  <section class="dashboard-panel weather-map-panel" :class="{ 'weather-map-panel--fallback': mapFailed }" aria-label="深圳降雨雷达地图">
    <div ref="mapContainer" class="weather-map-panel__canvas"></div>
    <div class="weather-map-panel__shade"></div>

    <div class="weather-map-panel__time">当前时间：{{ mapFrameDate }} {{ timelineStore.currentFrameTime }}</div>

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
      <button type="button" aria-label="图层" :class="{ active: layerMenuOpen }" @click="layerMenuOpen = !layerMenuOpen"><UiIcon name="layers" /></button>
      <button type="button" aria-label="定位" @click="resetMapView"><UiIcon name="locate" /></button>
    </div>

    <div v-if="layerMenuOpen" class="weather-map-panel__layer-menu">
      <label><input v-model="layerStore.radarEnabled" type="checkbox" />降雨雷达</label>
      <label><input v-model="layerStore.alertEnabled" type="checkbox" />预警区域</label>
      <label><input v-model="layerStore.stationEnabled" type="checkbox" />监测站点</label>
      <label><input v-model="layerStore.windEnabled" type="checkbox" />风场流线</label>
    </div>

    <div class="weather-map-panel__scale">5 km</div>
  </section>
</template>

<script setup lang="ts">
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { FeatureCollection, Point, Polygon } from 'geojson';
import maplibregl, { type Map, type MapMouseEvent, type RasterTileSource, type StyleSpecification } from 'maplibre-gl';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useWeatherStore } from '@/stores/weather';
import { createMockWindStreams } from '@/mock/windField';
import { useLayerStore } from '@/stores/layerStore';
import { useMapStore } from '@/stores/mapStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { createForecastWindStreams } from '@/utils/liveWindField';
import { createRadarBitmap, createRainRadarBitmapLayer, sampleRadarIntensity, type RadarBitmapBounds } from '@/utils/radarDeckLayers';
import { createWindFieldLayers } from '@/utils/windDeckLayers';
import UiIcon from './UiIcon.vue';

const shenzhenGeoJsonUrl = new URL('../../../shenzhen.json', import.meta.url).href;
const shenzhenBounds: [[number, number], [number, number]] = [
  [113.75, 22.43],
  [114.65, 22.86],
];
const radarBitmapBounds: RadarBitmapBounds = [113.68, 22.34, 114.68, 22.88];
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
let districtMarkers: maplibregl.Marker[] = [];
let stationMarkers: maplibregl.Marker[] = [];
let radarBitmap: HTMLCanvasElement | null = null;
let mapResizeObserver: ResizeObserver | null = null;
let windAnimationFrame: number | null = null;
let windParticlePhase = 0;
let windLastFrameTime = 0;
let windLastRenderTime = 0;

const createCurrentWindStreams = () => {
  const liveFrame = store.currentWindGridFrame;
  return liveFrame
    ? createForecastWindStreams(liveFrame)
    : createMockWindStreams(timelineStore.currentFrameIndex);
};

let currentWindStreams = createCurrentWindStreams();

const mapFrameDate = computed(() => (
  store.forecastFrames[timelineStore.currentFrameIndex]?.timestamp.slice(0, 10) ?? '2026-07-09'
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
      properties: { id: 'rain-yellow' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [113.88, 22.49], [114.2, 22.49], [114.26, 22.57],
          [114.13, 22.64], [113.92, 22.59], [113.88, 22.49],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'wind-blue' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [114.18, 22.43], [114.61, 22.48], [114.64, 22.7],
          [114.48, 22.78], [114.25, 22.65], [114.18, 22.43],
        ]],
      },
    },
  ],
};

const alertViewpoints: Record<string, { center: [number, number]; zoom: number }> = {
  'rain-yellow': { center: [114.06, 22.55], zoom: 10.5 },
  'wind-blue': { center: [114.4, 22.61], zoom: 10.15 },
};

const resetMapView = () => map?.fitBounds(shenzhenBounds, { padding: 24, duration: 350 });
const zoomMap = (direction: 1 | -1) => map?.easeTo({ zoom: map.getZoom() + direction, duration: 250 });

const showStationPopup = (stationId: string) => {
  const station = store.stations.find((item) => item.id === stationId);
  if (station) {
    mapStore.selectStation(station);
    map?.easeTo({ center: [station.longitude, station.latitude], duration: 350 });
  }
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
  const rainfallIntensity = sampleRadarIntensity({
    points: createRadarFrame(),
    bounds: radarBitmapBounds,
    longitude: lng,
    latitude: lat,
  });
  const rainFactor = Math.min(1, rainfallIntensity / 50);
  mapStore.showPopup({
    label: store.currentRainViewerFrame ? '点击位置 · DEMO估算' : '点击位置',
    longitude: lng,
    latitude: lat,
    rainfallIntensity,
    rainfall1h: Number((rainfallIntensity * 0.72).toFixed(1)),
    temperature: Number((29.7 - rainFactor * 2.3).toFixed(1)),
    humidity: Math.round(76 + rainFactor * 13),
    windSpeed: Number((3.6 + rainFactor * 2.8).toFixed(1)),
    windDirection: rainFactor > 0.5 ? '东南风' : '偏东风',
    alertTitle: layerStore.alertEnabled && rainfallIntensity >= 16 ? '黄色暴雨预警' : undefined,
  });
  map?.easeTo({ center: [lng, lat], duration: 350 });
};

const createRadarFrame = (): FeatureCollection<Point, { intensity?: number }> => {
  const frameOffset = timelineStore.currentFrameIndex - 12;
  const longitudeShift = frameOffset * 0.0024;
  const latitudeShift = Math.sin(frameOffset * 0.42) * 0.005;
  const intensityScale = 0.92 + Math.cos(frameOffset * 0.36) * 0.08;
  const structuralSeeds = [
    ...store.radarBandsGeoJson.features.flatMap((feature) => feature.geometry.coordinates[0].filter((_, index) => index % 2 === 0).map((coordinates) => ({
      type: 'Feature' as const,
      properties: { intensity: feature.properties.intensity * 0.34 },
      geometry: { type: 'Point' as const, coordinates },
    }))),
    ...store.radarRibbonsGeoJson.features.flatMap((feature) => feature.geometry.coordinates.map((coordinates) => ({
      type: 'Feature' as const,
      properties: { intensity: feature.properties.intensity * 0.46 },
      geometry: { type: 'Point' as const, coordinates },
    }))),
    ...store.radarFragmentsGeoJson.features.map((feature) => {
      const ring = feature.geometry.coordinates[0];
      const coordinates: [number, number] = [
        ring.reduce((sum, point) => sum + point[0], 0) / ring.length,
        ring.reduce((sum, point) => sum + point[1], 0) / ring.length,
      ];
      return {
        type: 'Feature' as const,
        properties: { intensity: feature.properties.intensity * 0.62 },
        geometry: { type: 'Point' as const, coordinates },
      };
    }),
  ];

  return {
    type: 'FeatureCollection',
    features: [...structuralSeeds, ...store.radarGeoJson.features, ...store.radarSpecklesGeoJson.features].map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        intensity: Math.max(1, (feature.properties.intensity ?? 1) * intensityScale),
      },
      geometry: {
        ...feature.geometry,
        coordinates: [
          feature.geometry.coordinates[0] + longitudeShift,
          feature.geometry.coordinates[1] + latitudeShift,
        ],
      },
    })),
  };
};

const updateWeatherLayers = (rebuildBitmap = false) => {
  if (rebuildBitmap || !radarBitmap) {
    radarBitmap = createRadarBitmap({ points: createRadarFrame(), bounds: radarBitmapBounds });
  }
  if (!deckOverlay || !radarBitmap) return;
  deckOverlay.setProps({
    layers: [
      createRainRadarBitmapLayer({
        image: radarBitmap,
        bounds: radarBitmapBounds,
        opacity: layerStore.radarOpacity / 100,
        visible: layerStore.radarEnabled && !store.currentRainViewerTileTemplate,
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
    if (map.getLayer(rainViewerLayerId)) {
      map.setLayoutProperty(rainViewerLayerId, 'visibility', 'none');
    }
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
      layout: {
        visibility: layerStore.radarEnabled ? 'visible' : 'none',
      },
      paint: {
        'raster-opacity': layerStore.radarOpacity / 100,
        'raster-fade-duration': 0,
      },
    }, 'district-glow');
  } else {
    existingSource.setTiles([tileTemplate]);
    if (map.getLayer(rainViewerLayerId)) {
      map.setLayoutProperty(rainViewerLayerId, 'visibility', layerStore.radarEnabled ? 'visible' : 'none');
      map.setPaintProperty(rainViewerLayerId, 'raster-opacity', layerStore.radarOpacity / 100);
    }
  }

  updateWeatherLayers();
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

type LineFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, string>;
    geometry: {
      type: 'LineString';
      coordinates: Array<[number, number]>;
    };
  }>;
};

const createLineFeature = (kind: string, coordinates: Array<[number, number]>): LineFeatureCollection['features'][number] => ({
  type: 'Feature',
  properties: { kind },
  geometry: {
    type: 'LineString',
    coordinates,
  },
});

const createUrbanTextureLines = (): LineFeatureCollection['features'] => [
  ...Array.from({ length: 12 }, (_, index) => {
    const lat = 22.46 + index * 0.026;
    const start = 113.8 + (index % 3) * 0.018;

    return createLineFeature(
      `urban-east-west-${index}`,
      Array.from({ length: 7 }, (__, pointIndex) => [
        Number((start + pointIndex * 0.115).toFixed(4)),
        Number((lat + Math.sin(index * 0.8 + pointIndex) * 0.009).toFixed(4)),
      ]),
    );
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const lng = 113.84 + index * 0.07;
    const start = 22.43 + (index % 2) * 0.018;

    return createLineFeature(
      `urban-north-south-${index}`,
      Array.from({ length: 6 }, (__, pointIndex) => [
        Number((lng + Math.cos(index * 0.9 + pointIndex) * 0.008).toFixed(4)),
        Number((start + pointIndex * 0.07).toFixed(4)),
      ]),
    );
  }),
];

const darkBaseTiles = [
  'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
];

const roadNetworkGeoJson: LineFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'expressway' },
      geometry: { type: 'LineString', coordinates: [[113.77, 22.75], [113.84, 22.69], [113.91, 22.62], [113.99, 22.56], [114.06, 22.54]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'urban-axis' },
      geometry: { type: 'LineString', coordinates: [[113.88, 22.52], [113.97, 22.53], [114.06, 22.54], [114.15, 22.56], [114.23, 22.58]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'ring-road' },
      geometry: { type: 'LineString', coordinates: [[113.86, 22.61], [113.96, 22.64], [114.07, 22.63], [114.18, 22.64], [114.29, 22.68]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'east-corridor' },
      geometry: { type: 'LineString', coordinates: [[114.1, 22.57], [114.21, 22.62], [114.33, 22.68], [114.47, 22.74]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'coastal-road' },
      geometry: { type: 'LineString', coordinates: [[114.2, 22.55], [114.3, 22.55], [114.42, 22.59], [114.55, 22.62]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'north-south' },
      geometry: { type: 'LineString', coordinates: [[114.02, 22.52], [114.04, 22.61], [114.06, 22.71], [114.11, 22.8]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'south-corridor' },
      geometry: { type: 'LineString', coordinates: [[113.92, 22.43], [114.02, 22.47], [114.11, 22.52], [114.2, 22.56]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'pingshan-link' },
      geometry: { type: 'LineString', coordinates: [[114.25, 22.61], [114.34, 22.64], [114.44, 22.67], [114.52, 22.71]] },
    },
  ],
};

const waterTextureGeoJson: LineFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'shenzhen-bay' },
      geometry: { type: 'LineString', coordinates: [[113.78, 22.47], [113.86, 22.44], [113.96, 22.43], [114.05, 22.47], [114.12, 22.5]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'pearl-river-estuary' },
      geometry: { type: 'LineString', coordinates: [[113.75, 22.64], [113.79, 22.58], [113.83, 22.52], [113.87, 22.46]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'dapeng-bay' },
      geometry: { type: 'LineString', coordinates: [[114.22, 22.51], [114.32, 22.48], [114.43, 22.47], [114.55, 22.53], [114.61, 22.62]] },
    },
  ],
};

const terrainTextureGeoJson: LineFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'yangtai-mountain' },
      geometry: { type: 'LineString', coordinates: [[113.88, 22.66], [113.93, 22.7], [114.0, 22.69], [114.03, 22.65], [113.98, 22.62], [113.91, 22.63], [113.88, 22.66]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'wutong-mountain' },
      geometry: { type: 'LineString', coordinates: [[114.12, 22.56], [114.17, 22.6], [114.24, 22.59], [114.28, 22.55], [114.23, 22.52], [114.16, 22.52], [114.12, 22.56]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'maluan-mountain' },
      geometry: { type: 'LineString', coordinates: [[114.29, 22.61], [114.36, 22.66], [114.45, 22.65], [114.48, 22.59], [114.4, 22.56], [114.32, 22.57], [114.29, 22.61]] },
    },
    {
      type: 'Feature',
      properties: { kind: 'dapeng-ridge' },
      geometry: { type: 'LineString', coordinates: [[114.39, 22.72], [114.48, 22.76], [114.57, 22.71], [114.58, 22.64], [114.49, 22.61], [114.42, 22.65], [114.39, 22.72]] },
    },
  ],
};

const urbanTextureGeoJson: LineFeatureCollection = {
  type: 'FeatureCollection',
  features: createUrbanTextureLines(),
};

const districtLabels = [
  { name: '罗湖区', coordinates: [114.123885, 22.555341] },
  { name: '福田区', coordinates: [114.05096, 22.541009] },
  { name: '南山区', coordinates: [113.92943, 22.531221] },
  { name: '宝安区', coordinates: [113.828671, 22.754741] },
  { name: '龙岗区', coordinates: [114.251372, 22.721511] },
  { name: '盐田区', coordinates: [114.235366, 22.555069] },
  { name: '龙华区', coordinates: [114.044346, 22.691963] },
  { name: '坪山区', coordinates: [114.338441, 22.69423] },
  { name: '光明区', coordinates: [113.935895, 22.748816] },
  { name: '大鹏新区', coordinates: [114.5032, 22.6154] },
] satisfies Array<{ name: string; coordinates: [number, number] }>;

onMounted(() => {
  if (!mapContainer.value) {
    return;
  }

  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      center: store.center,
      zoom: 10.2,
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
          districts: {
            type: 'geojson',
            data: shenzhenGeoJsonUrl,
          },
          roadNetwork: {
            type: 'geojson',
            data: roadNetworkGeoJson,
          },
          waterTexture: {
            type: 'geojson',
            data: waterTextureGeoJson,
          },
          terrainTexture: {
            type: 'geojson',
            data: terrainTextureGeoJson,
          },
          urbanTexture: {
            type: 'geojson',
            data: urbanTextureGeoJson,
          },
          alertArea: {
            type: 'geojson',
            data: alertAreaGeoJson,
          },
        },
        layers: [
          {
            id: 'map-background',
            type: 'background',
            paint: {
              'background-color': '#031120',
            },
          },
          {
            id: 'dark-osm-base',
            type: 'raster',
            source: 'darkBase',
            paint: {
              'raster-opacity': 0.98,
              'raster-saturation': -0.18,
              'raster-brightness-min': 0.1,
              'raster-brightness-max': 0.94,
              'raster-contrast': 0.04,
            },
          },
          {
            id: 'urban-road-grain-shadow',
            type: 'line',
            source: 'urbanTexture',
            paint: {
              'line-color': 'rgba(2, 8, 16, 0.6)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.4, 12, 3.2],
              'line-blur': 1.1,
              'line-opacity': 0.44,
            },
          },
          {
            id: 'urban-road-grain',
            type: 'line',
            source: 'urbanTexture',
            paint: {
              'line-color': 'rgba(123, 161, 184, 0.22)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.35, 12, 1.1],
              'line-opacity': 0.7,
            },
          },
          {
            id: 'water-texture',
            type: 'line',
            source: 'waterTexture',
            paint: {
              'line-color': 'rgba(78, 177, 225, 0.34)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.1, 12, 2.8],
              'line-blur': 1.4,
              'line-opacity': 0.78,
            },
          },
          {
            id: 'terrain-contours',
            type: 'line',
            source: 'terrainTexture',
            paint: {
              'line-color': 'rgba(113, 174, 155, 0.2)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.8, 12, 2.1],
              'line-dasharray': [1.4, 2.4],
              'line-blur': 0.6,
              'line-opacity': 0.84,
            },
          },
          {
            id: 'road-network-shadow',
            type: 'line',
            source: 'roadNetwork',
            paint: {
              'line-color': 'rgba(10, 21, 34, 0.72)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 12, 5.4],
              'line-blur': 1.2,
              'line-opacity': 0.72,
            },
          },
          {
            id: 'road-network-thread',
            type: 'line',
            source: 'roadNetwork',
            paint: {
              'line-color': 'rgba(168, 207, 226, 0.38)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.9, 12, 2.6],
              'line-opacity': 0.82,
            },
          },
          {
            id: 'district-fill',
            type: 'fill',
            source: 'districts',
            paint: {
              'fill-color': [
                'match',
                ['get', 'name'],
                '宝安区',
                '#0b3150',
                '南山区',
                '#0a4059',
                '福田区',
                '#0b3a5e',
                '罗湖区',
                '#10365c',
                '盐田区',
                '#0f465a',
                '龙华区',
                '#0b3558',
                '龙岗区',
                '#123055',
                '坪山区',
                '#0c3d54',
                '光明区',
                '#0a3859',
                '大鹏新区',
                '#123a4f',
                '#0b304f',
              ],
              'fill-opacity': 0.18,
            },
          },
          {
            id: 'district-glow',
            type: 'line',
            source: 'districts',
            paint: {
              'line-color': 'rgba(77, 178, 255, 0.32)',
              'line-width': 4,
              'line-blur': 4,
              'line-opacity': 0.48,
            },
          },
          {
            id: 'district-outline',
            type: 'line',
            source: 'districts',
            paint: {
              'line-color': 'rgba(186, 228, 255, 0.76)',
              'line-width': 1,
              'line-opacity': 0.82,
            },
          },
          {
            id: 'alert-area-fill',
            type: 'fill',
            source: 'alertArea',
            filter: ['==', ['get', 'id'], mapStore.activeAlertId],
            layout: {
              visibility: layerStore.alertEnabled ? 'visible' : 'none',
            },
            paint: {
              'fill-color': mapStore.activeAlertId === 'wind-blue' ? '#3b82f6' : '#facc15',
              'fill-opacity': layerStore.alertOpacity / 100 * 0.14,
            },
          },
          {
            id: 'alert-area-outline',
            type: 'line',
            source: 'alertArea',
            filter: ['==', ['get', 'id'], mapStore.activeAlertId],
            layout: {
              visibility: layerStore.alertEnabled ? 'visible' : 'none',
            },
            paint: {
              'line-color': mapStore.activeAlertId === 'wind-blue' ? '#60a5fa' : '#facc15',
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
      map.fitBounds(shenzhenBounds, { padding: 24, duration: 0 });
    });
    mapResizeObserver.observe(mapContainer.value);

    map.once('style.load', () => {
      if (!map) {
        return;
      }

      mapStyleReady = true;
      map.fitBounds(shenzhenBounds, { padding: 24, duration: 0 });
      radarBitmap = createRadarBitmap({ points: createRadarFrame(), bounds: radarBitmapBounds });

      currentWindStreams = createCurrentWindStreams();
      deckOverlay = new MapboxOverlay({
        interleaved: false,
        layers: [
          createRainRadarBitmapLayer({
            image: radarBitmap,
            bounds: radarBitmapBounds,
            opacity: layerStore.radarOpacity / 100,
            visible: layerStore.radarEnabled && !store.currentRainViewerTileTemplate,
          }),
          ...createWindFieldLayers({
            streams: currentWindStreams,
            opacity: layerStore.windOpacity / 100,
            visible: layerStore.windEnabled,
            particlePhase: windParticlePhase,
          }),
        ],
      });
      map.addControl(deckOverlay);
      syncRainViewerLayer();

      districtMarkers = districtLabels.map((district) => {
        const element = document.createElement('span');
        element.className = 'weather-map-panel__district-label';
        element.textContent = district.name;

        return new maplibregl.Marker({
          element,
          anchor: 'center',
        }).setLngLat(district.coordinates).addTo(map as Map);
      });

      stationMarkers = store.stations.map((station) => {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = 'weather-map-panel__station-marker';
        element.dataset.stationId = station.id;
        element.title = `${station.name}监测站`;
        element.setAttribute('aria-label', `${station.name}监测站，24小时降雨${station.rainfall24h}毫米`);
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
  updateWeatherLayers();
});

watch(() => store.currentRainViewerTileTemplate, () => {
  syncRainViewerLayer();
});

watch(() => [layerStore.stationEnabled, mapStore.activeStationId], updateStationMarkers);

watch(() => layerStore.alertEnabled, (enabled) => {
  if (!map?.getLayer('alert-area-fill')) return;
  const visibility = enabled ? 'visible' : 'none';
  map.setLayoutProperty('alert-area-fill', 'visibility', visibility);
  map.setLayoutProperty('alert-area-outline', 'visibility', visibility);
});

watch(() => layerStore.alertOpacity, (opacity) => {
  if (!map?.getLayer('alert-area-fill')) return;
  map.setPaintProperty('alert-area-fill', 'fill-opacity', opacity / 100 * 0.14);
  map.setPaintProperty('alert-area-outline', 'line-opacity', opacity / 100);
});

watch(() => mapStore.activeAlertId, (alertId) => {
  if (!map?.getLayer('alert-area-fill')) return;
  const isBlue = alertId === 'wind-blue';
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
  districtMarkers.forEach((marker) => marker.remove());
  districtMarkers = [];
  stationMarkers.forEach((marker) => marker.remove());
  stationMarkers = [];
  deckOverlay?.finalize();
  deckOverlay = null;
  map?.off('click', handleMapClick);
  map?.remove();
  map = null;
});
</script>