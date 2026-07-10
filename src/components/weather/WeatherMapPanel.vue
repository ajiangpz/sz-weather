<template>
  <section class="dashboard-panel weather-map-panel" :class="{ 'weather-map-panel--fallback': mapFailed }" aria-label="深圳降雨雷达地图">
    <div ref="mapContainer" class="weather-map-panel__canvas"></div>
    <div class="weather-map-panel__shade"></div>

    <div class="weather-map-panel__time">当前时间：2026-07-09 14:30</div>

    <div class="weather-map-panel__stations" aria-hidden="true">
      <i v-for="station in stations" :key="station.name" :class="{ active: station.active }" :style="{ left: station.left, top: station.top }"></i>
    </div>

    <article class="weather-map-panel__popup">
      <button type="button" aria-label="关闭">×</button>
      <h3>点击位置</h3>
      <p><span>经度：</span>114.0571°E</p>
      <p><span>纬度：</span>22.5431°N</p>
      <p><span>降雨强度：</span>18.4 mm/h</p>
      <p><span>1小时降雨：</span>14.2 mm</p>
      <p><span>温度：</span>28.6°C</p>
      <p><span>湿度：</span>81%</p>
      <p><span>风速：</span>4.8 m/s</p>
      <p><span>预警：</span><strong>黄色暴雨预警</strong></p>
    </article>

    <div class="weather-map-panel__controls" aria-label="地图控制">
      <button type="button">＋</button>
      <button type="button">－</button>
      <button type="button">◈</button>
      <button type="button">⌖</button>
    </div>

    <div class="weather-map-panel__scale">5 km</div>
  </section>
</template>

<script setup lang="ts">
import maplibregl, { type Map, type StyleSpecification } from 'maplibre-gl';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { useWeatherStore } from '@/stores/weather';

const shenzhenGeoJsonUrl = new URL('../../../shenzhen.json', import.meta.url).href;
const shenzhenBounds: [[number, number], [number, number]] = [
  [113.75, 22.43],
  [114.65, 22.86],
];

const store = useWeatherStore();
const mapContainer = ref<HTMLDivElement | null>(null);
const mapFailed = ref(false);
let map: Map | null = null;
let districtMarkers: maplibregl.Marker[] = [];

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
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
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

const stations = [
  { name: '宝安', left: '18%', top: '55%' },
  { name: '南山', left: '27%', top: '72%' },
  { name: '福田', left: '33%', top: '56%' },
  { name: '罗湖', left: '47%', top: '57%', active: true },
  { name: '盐田', left: '63%', top: '64%' },
  { name: '坪山', left: '74%', top: '38%' },
];

onMounted(() => {
  if (!mapContainer.value) {
    return;
  }

  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      center: store.center,
      zoom: 10.2,
      interactive: false,
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
          radarBands: {
            type: 'geojson',
            data: store.radarBandsGeoJson,
          },
          radarFragments: {
            type: 'geojson',
            data: store.radarFragmentsGeoJson,
          },
          radarRibbons: {
            type: 'geojson',
            data: store.radarRibbonsGeoJson,
          },
          radar: {
            type: 'geojson',
            data: store.radarGeoJson,
          },
          radarSpeckles: {
            type: 'geojson',
            data: store.radarSpecklesGeoJson,
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
              'raster-saturation': -0.08,
              'raster-brightness-min': 0,
              'raster-brightness-max': 0.86,
              'raster-contrast': 0.1,
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
            id: 'radar-blue-wash',
            type: 'fill',
            source: 'radarBands',
            filter: ['==', ['get', 'tier'], 'base'],
            paint: {
              'fill-color': 'rgba(44, 140, 248, 0.76)',
              'fill-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.1, 4, 0.2, 8, 0.32],
            },
          },
          {
            id: 'radar-band-surface',
            type: 'fill',
            source: 'radarBands',
            filter: ['!=', ['get', 'tier'], 'base'],
            paint: {
              'fill-color': [
                'match',
                ['get', 'level'],
                'light',
                'rgba(75, 163, 255, 0.86)',
                'moderate',
                'rgba(55, 214, 122, 0.86)',
                'heavy',
                'rgba(244, 208, 63, 0.9)',
                'storm',
                'rgba(245, 158, 66, 0.9)',
                'severeStorm',
                'rgba(232, 76, 136, 0.92)',
                'rgba(75, 163, 255, 0.82)',
              ],
              'fill-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.05, 8, 0.12, 16, 0.2, 32, 0.28, 48, 0.32],
            },
          },
          {
            id: 'radar-band-feather',
            type: 'line',
            source: 'radarBands',
            filter: ['!=', ['get', 'tier'], 'base'],
            paint: {
              'line-color': [
                'match',
                ['get', 'level'],
                'light',
                'rgba(118, 198, 255, 0.5)',
                'moderate',
                'rgba(106, 235, 157, 0.52)',
                'heavy',
                'rgba(255, 226, 92, 0.6)',
                'storm',
                'rgba(255, 177, 92, 0.62)',
                'severeStorm',
                'rgba(255, 105, 160, 0.66)',
                'rgba(118, 198, 255, 0.48)',
              ],
              'line-width': ['interpolate', ['linear'], ['get', 'intensity'], 0, 2, 16, 4, 40, 7],
              'line-blur': 5,
              'line-opacity': 0.1,
            },
          },
          {
            id: 'radar-ribbon-outer',
            type: 'line',
            source: 'radarRibbons',
            filter: ['==', ['get', 'tier'], 'outer'],
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': [
                'match',
                ['get', 'level'],
                'light',
                'rgba(75, 163, 255, 0.88)',
                'moderate',
                'rgba(55, 214, 122, 0.84)',
                'heavy',
                'rgba(244, 208, 63, 0.86)',
                'storm',
                'rgba(245, 158, 66, 0.88)',
                'severeStorm',
                'rgba(232, 76, 136, 0.9)',
                'rgba(75, 163, 255, 0.86)',
              ],
              'line-width': ['interpolate', ['linear'], ['get', 'intensity'], 0, 38, 8, 58, 16, 78, 32, 96],
              'line-blur': ['interpolate', ['linear'], ['get', 'intensity'], 0, 18, 16, 22, 40, 28],
              'line-opacity': 0.28,
            },
          },
          {
            id: 'radar-ribbon-core',
            type: 'line',
            source: 'radarRibbons',
            filter: ['==', ['get', 'tier'], 'core'],
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': [
                'match',
                ['get', 'level'],
                'light',
                'rgba(96, 196, 255, 0.9)',
                'moderate',
                'rgba(64, 225, 129, 0.88)',
                'heavy',
                'rgba(255, 220, 70, 0.9)',
                'storm',
                'rgba(255, 155, 54, 0.92)',
                'severeStorm',
                'rgba(234, 65, 131, 0.86)',
                'rgba(96, 196, 255, 0.9)',
              ],
              'line-width': ['interpolate', ['linear'], ['get', 'intensity'], 0, 10, 8, 16, 16, 24, 32, 34, 48, 40],
              'line-blur': ['interpolate', ['linear'], ['get', 'intensity'], 0, 7, 16, 10, 40, 13],
              'line-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.24, 16, 0.2, 30, 0.1, 44, 0.05],
            },
          },
          {
            id: 'radar-rainfall',
            type: 'heatmap',
            source: 'radar',
            maxzoom: 13,
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 8, 0.28, 16, 0.56, 32, 0.88, 45, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 0.98, 12, 1.92],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 26, 10, 52, 12, 88],
              'heatmap-opacity': 0.42,
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(0, 83, 170, 0)',
                0.04,
                'rgba(16, 110, 234, 0.24)',
                0.14,
                'rgba(26, 181, 222, 0.38)',
                0.3,
                'rgba(54, 214, 123, 0.54)',
                0.5,
                'rgba(242, 213, 64, 0.66)',
                0.68,
                'rgba(255, 142, 52, 0.72)',
                0.86,
                'rgba(225, 72, 138, 0.78)',
                1,
                'rgba(156, 91, 226, 0.84)',
              ],
            },
          },
          {
            id: 'radar-fragment-cells',
            type: 'fill',
            source: 'radarFragments',
            paint: {
              'fill-antialias': false,
              'fill-color': [
                'match',
                ['get', 'level'],
                'light',
                'rgba(44, 141, 245, 0.86)',
                'moderate',
                'rgba(57, 197, 112, 0.88)',
                'heavy',
                'rgba(245, 209, 63, 0.9)',
                'storm',
                'rgba(242, 143, 56, 0.92)',
                'severeStorm',
                'rgba(224, 61, 126, 0.94)',
                'rgba(44, 141, 245, 0.84)',
              ],
              'fill-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.16, 6, 0.26, 12, 0.4, 20, 0.54, 36, 0.66, 48, 0.7],
            },
          },
          {
            id: 'radar-fragment-soft-edge',
            type: 'line',
            source: 'radarFragments',
            paint: {
              'line-color': [
                'match',
                ['get', 'level'],
                'light',
                'rgba(89, 183, 255, 0.78)',
                'moderate',
                'rgba(97, 234, 147, 0.78)',
                'heavy',
                'rgba(255, 225, 84, 0.82)',
                'storm',
                'rgba(255, 171, 80, 0.84)',
                'severeStorm',
                'rgba(255, 103, 157, 0.86)',
                'rgba(89, 183, 255, 0.76)',
              ],
              'line-width': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.3, 16, 0.55, 40, 0.85],
              'line-blur': 0.9,
              'line-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.08, 16, 0.13, 40, 0.18],
            },
          },
          {
            id: 'radar-speckle-noise',
            type: 'circle',
            source: 'radarSpeckles',
            paint: {
              'circle-color': [
                'match',
                ['get', 'level'],
                'light',
                '#72c7ff',
                'moderate',
                '#6aeb9d',
                'heavy',
                '#ffe25c',
                'storm',
                '#ffad4d',
                'severeStorm',
                '#ff6ca6',
                '#72c7ff',
              ],
              'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.7, 8, 1.25, 16, 1.9, 36, 2.8],
              'circle-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.18, 8, 0.42, 18, 0.56, 40, 0.68],
              'circle-blur': 0.18,
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
        ],
      } as StyleSpecification,
    });

    map.once('load', () => {
      map?.fitBounds(shenzhenBounds, { padding: 24, duration: 0 });

      if (!map) {
        return;
      }

      districtMarkers = districtLabels.map((district) => {
        const element = document.createElement('span');
        element.className = 'weather-map-panel__district-label';
        element.textContent = district.name;

        return new maplibregl.Marker({
          element,
          anchor: 'center',
        }).setLngLat(district.coordinates).addTo(map as Map);
      });
    });
  } catch {
    mapFailed.value = true;
  }
});

onBeforeUnmount(() => {
  districtMarkers.forEach((marker) => marker.remove());
  districtMarkers = [];
  map?.remove();
  map = null;
});
</script>
