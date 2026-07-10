<template>
  <section class="radar-map" aria-label="实时降雨雷达地图">
    <div ref="mapContainer" class="radar-map__canvas"></div>

    <div class="radar-map__legend">
      <span v-for="item in legendItems" :key="item.label">
        <i :style="{ backgroundColor: item.color }"></i>
        {{ item.label }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import maplibregl, { type Map } from 'maplibre-gl';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { useWeatherStore } from '@/stores/weather';
import { radarLayerColors } from '@/utils/radar';

const shenzhenGeoJsonUrl = new URL('../../../shenzhen.json', import.meta.url).href;
const shenzhenBounds: [[number, number], [number, number]] = [
  [113.75, 22.43],
  [114.65, 22.86],
];

const store = useWeatherStore();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: Map | null = null;

const legendItems = [
  { label: '小雨', color: radarLayerColors.light },
  { label: '中雨', color: radarLayerColors.moderate },
  { label: '强降雨', color: radarLayerColors.heavy },
];

onMounted(() => {
  if (!mapContainer.value) {
    return;
  }

  map = new maplibregl.Map({
    container: mapContainer.value,
    center: store.center,
    zoom: 10.2,
    style: {
      version: 8,
      sources: {
        districts: {
          type: 'geojson',
          data: shenzhenGeoJsonUrl,
        },
        radar: {
          type: 'geojson',
          data: store.radarGeoJson,
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
              '#0b304f',
            ],
            'fill-opacity': 0.64,
          },
        },
        {
          id: 'district-glow',
          type: 'line',
          source: 'districts',
          paint: {
            'line-color': 'rgba(77, 178, 255, 0.45)',
            'line-width': 5,
            'line-blur': 4,
            'line-opacity': 0.65,
          },
        },
        {
          id: 'district-outline',
          type: 'line',
          source: 'districts',
          paint: {
            'line-color': 'rgba(186, 228, 255, 0.88)',
            'line-width': 1.2,
            'line-opacity': 0.9,
          },
        },
        {
          id: 'radar-rainfall',
          type: 'heatmap',
          source: 'radar',
          maxzoom: 13,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 30, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1.65, 12, 2.8],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 42, 10, 90, 12, 136],
            'heatmap-opacity': 0.78,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0, 83, 170, 0)',
              0.04,
              'rgba(16, 110, 234, 0.36)',
              0.14,
              'rgba(26, 181, 222, 0.58)',
              0.3,
              'rgba(54, 214, 123, 0.72)',
              0.5,
              'rgba(242, 213, 64, 0.82)',
              0.68,
              'rgba(255, 142, 52, 0.88)',
              0.86,
              'rgba(225, 72, 138, 0.92)',
              1,
              'rgba(156, 91, 226, 0.96)',
            ],
          },
        },
      ],
    },
  });

  map.once('load', () => {
    map?.fitBounds(shenzhenBounds, { padding: 24, duration: 0 });
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});
</script>
