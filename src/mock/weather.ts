import { createRadarFeature } from '@/utils/radar';
import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import type {
  DashboardTrendData,
  RadarLevel,
  RainDistributionItem,
  RainfallPoint,
  WeatherStation,
} from '@/types/weather';

export const mockRainfallTrend: RainfallPoint[] = [
  { time: '09:00', value: 0.8 },
  { time: '09:10', value: 1.2 },
  { time: '09:20', value: 2.6 },
  { time: '09:30', value: 4.8 },
  { time: '09:40', value: 6.1 },
  { time: '09:50', value: 3.4 },
  { time: '10:00', value: 1.9 },
];

export const mockDashboardTrends: DashboardTrendData = {
  times: ['14:00', '17:00', '20:00', '23:00', '02:00', '05:00', '08:00', '11:00', '14:00'],
  rainfall: [5, 12, 28, 36, 18, 9, 13, 6, 2],
  accumulatedRainfall: [6, 17, 38, 64, 74, 79, 84, 88, 90],
  temperature: [29, 28, 26.5, 25.5, 25.2, 26, 28.5, 30, 29.2],
  humidity: [70, 77, 73, 63, 53, 58, 72, 84, 76],
  windSpeed: [7.2, 6.4, 7.5, 5.3, 8.6, 4.8, 3.9, 5.6, 5.1],
};

export const mockRainDistribution: RainDistributionItem[] = [
  { label: '无雨', value: 18.6, color: '#8EA6C1' },
  { label: '小雨', value: 32.4, color: '#4BA3FF' },
  { label: '中雨', value: 23.7, color: '#37D67A' },
  { label: '大雨', value: 15.6, color: '#F4D03F' },
  { label: '暴雨', value: 6.2, color: '#F59E42' },
  { label: '大暴雨', value: 2.8, color: '#E84C88' },
  { label: '特大暴雨', value: 0.7, color: '#9B5DE5' },
];

export const mockStations: WeatherStation[] = [
  { id: 'wt', name: '大梧桐', district: '罗湖区', longitude: 114.214, latitude: 22.584, rainfall1h: 8.6, rainfall24h: 36.8, temperature: 26.8, humidity: 89, windSpeed: 6.1 },
  { id: 'lh', name: '罗湖', district: '罗湖区', longitude: 114.123, latitude: 22.555, rainfall1h: 14.2, rainfall24h: 28.6, temperature: 28.6, humidity: 81, windSpeed: 4.8 },
  { id: 'ns', name: '南山', district: '南山区', longitude: 113.929, latitude: 22.531, rainfall1h: 9.8, rainfall24h: 24.3, temperature: 28.9, humidity: 83, windSpeed: 5.4 },
  { id: 'ft', name: '福田', district: '福田区', longitude: 114.051, latitude: 22.541, rainfall1h: 11.5, rainfall24h: 20.1, temperature: 29.1, humidity: 82, windSpeed: 5.2 },
  { id: 'ba', name: '宝安', district: '宝安区', longitude: 113.829, latitude: 22.654, rainfall1h: 7.3, rainfall24h: 18.5, temperature: 29.3, humidity: 78, windSpeed: 4.6 },
];

type Coordinate = [number, number];
type RadarCell = [RadarLevel, number, number, number];
type RadarBandTier = 'base' | 'band';
type RadarRibbonTier = 'outer' | 'core';
type RadarFragmentCell = [RadarLevel, number, number, number, number];
type FragmentSeed = [Coordinate, number, number];
type RadarPointProperties = {
  level: RadarLevel;
  color: string;
  intensity: number;
};
type RadarBandProperties = {
  id: string;
  tier: RadarBandTier;
  level: RadarLevel;
  intensity: number;
};
type RadarRibbonProperties = {
  id: string;
  tier: RadarRibbonTier;
  level: RadarLevel;
  intensity: number;
};
type RadarFragmentProperties = {
  id: string;
  level: RadarLevel;
  intensity: number;
};

const baseRadarCells: RadarCell[] = [
  ['light', 113.78, 22.51, 4.6],
  ['light', 113.83, 22.56, 6.2],
  ['moderate', 113.86, 22.49, 10.4],
  ['moderate', 113.89, 22.42, 13.8],
  ['heavy', 113.92, 22.39, 19.2],
  ['moderate', 113.95, 22.44, 12.6],
  ['light', 113.98, 22.51, 7.4],
  ['light', 114.01, 22.57, 6.8],
  ['moderate', 114.04, 22.62, 10.8],
  ['light', 114.08, 22.68, 5.6],
  ['light', 114.12, 22.71, 4.4],
  ['light', 113.86, 22.66, 5.1],
  ['moderate', 113.92, 22.69, 9.6],
  ['moderate', 113.98, 22.72, 11.2],
  ['light', 114.05, 22.74, 6.5],
  ['light', 114.13, 22.76, 5.2],
  ['light', 114.2, 22.78, 4.6],
  ['light', 114.28, 22.79, 4.2],
  ['moderate', 114.33, 22.74, 9.8],
  ['moderate', 114.38, 22.7, 12.4],
  ['storm', 114.42, 22.66, 22.8],
  ['storm', 114.45, 22.61, 29.4],
  ['moderate', 114.41, 22.57, 14.8],
  ['light', 114.36, 22.53, 7.2],
  ['light', 114.29, 22.49, 5.8],
  ['light', 113.8, 22.39, 5.3],
  ['moderate', 113.86, 22.39, 10.1],
  ['heavy', 113.91, 22.4, 18.6],
  ['moderate', 113.96, 22.41, 13.5],
  ['light', 114.02, 22.43, 7.6],
  ['moderate', 114.08, 22.47, 11.7],
  ['moderate', 114.14, 22.51, 13.2],
  ['storm', 114.18, 22.54, 20.6],
  ['storm', 114.22, 22.56, 25.8],
  ['moderate', 114.26, 22.59, 14.1],
  ['light', 114.31, 22.62, 7.5],
  ['light', 114.36, 22.64, 6.3],
  ['light', 113.88, 22.58, 6.7],
  ['moderate', 113.94, 22.56, 11.4],
  ['moderate', 114.0, 22.54, 12.9],
  ['light', 114.06, 22.52, 8.2],
  ['light', 114.12, 22.55, 7.8],
  ['moderate', 114.18, 22.59, 10.6],
  ['moderate', 114.25, 22.62, 12.3],
  ['light', 114.31, 22.65, 8.9],
  ['light', 114.39, 22.77, 7.1],
  ['moderate', 114.44, 22.75, 12.8],
  ['moderate', 114.48, 22.72, 14.4],
  ['light', 114.5, 22.68, 8.6],
  ['light', 114.47, 22.64, 6.9],
  ['moderate', 114.05, 22.45, 12.8],
  ['moderate', 114.1, 22.42, 12.5],
  ['light', 114.16, 22.43, 8.4],
  ['light', 114.24, 22.42, 6.2],
  ['moderate', 114.31, 22.42, 10.2],
  ['light', 114.38, 22.42, 6.6],
  ['storm', 114.112, 22.512, 29.8],
  ['severeStorm', 114.163, 22.565, 43.4],
  ['storm', 114.232, 22.533, 26.7],
  ['storm', 114.333, 22.612, 28.5],
  ['severeStorm', 114.389, 22.681, 42.1],
  ['storm', 114.468, 22.638, 27.6],
];

const broadOffsets = [
  [-0.045, -0.028, -1.6],
  [-0.024, 0.026, -0.7],
  [0, 0, 0],
  [0.025, -0.022, -0.4],
  [0.046, 0.031, -1.4],
] as const;

const coreOffsets = [
  [-0.018, -0.014, -2],
  [0, 0, 0],
  [0.019, 0.016, -1.4],
] as const;

const speckleOffsets = [
  [-0.059, 0.019, -2.4],
  [-0.038, -0.035, -1.8],
  [-0.012, 0.043, -2.1],
  [0.034, -0.027, -1.5],
  [0.055, 0.026, -2.7],
] as const;

const westRainPath: Coordinate[] = [
  [113.78, 22.47],
  [113.83, 22.52],
  [113.9, 22.56],
  [113.98, 22.58],
  [114.06, 22.6],
  [114.13, 22.62],
];

const southRainPath: Coordinate[] = [
  [113.82, 22.4],
  [113.9, 22.43],
  [113.99, 22.48],
  [114.09, 22.53],
  [114.18, 22.57],
  [114.27, 22.6],
  [114.37, 22.62],
];

const eastRainPath: Coordinate[] = [
  [114.17, 22.45],
  [114.238, 22.522],
  [114.331, 22.566],
  [114.398, 22.642],
  [114.493, 22.676],
  [114.525, 22.712],
];

const northRainPath: Coordinate[] = [
  [113.88, 22.66],
  [113.98, 22.7],
  [114.1, 22.71],
  [114.22, 22.72],
  [114.34, 22.71],
  [114.47, 22.68],
];

const stormCorePath: Coordinate[] = [
  [114.102, 22.516],
  [114.131, 22.555],
  [114.176, 22.537],
  [114.191, 22.568],
  [114.248, 22.532],
];

const createBandCells = (
  level: RadarLevel,
  intensity: number,
  path: Coordinate[],
  offsets: ReadonlyArray<readonly [number, number, number]>,
): RadarCell[] =>
  path.flatMap(([lng, lat], index) =>
    offsets.map(([lngOffset, latOffset, intensityOffset], offsetIndex) => {
      const lngNoise = Math.sin(index * 1.7 + offsetIndex) * 0.006;
      const latNoise = Math.cos(index * 1.3 - offsetIndex) * 0.004;
      const cell: RadarCell = [
        level,
        Number((lng + lngOffset + lngNoise).toFixed(4)),
        Number((lat + latOffset + latNoise).toFixed(4)),
        Number(Math.max(0.1, intensity + intensityOffset + ((index % 3) - 1) * 0.7).toFixed(1)),
      ];

      return cell;
    }),
  );

const mockRadarCells: RadarCell[] = [
  ...baseRadarCells,
  ...createBandCells('light', 5.4, westRainPath, broadOffsets),
  ...createBandCells('moderate', 10.8, westRainPath, coreOffsets),
  ...createBandCells('light', 6.2, northRainPath, broadOffsets),
  ...createBandCells('moderate', 12.4, northRainPath, coreOffsets),
  ...createBandCells('light', 5.8, southRainPath, broadOffsets),
  ...createBandCells('moderate', 10.6, southRainPath, coreOffsets),
  ...createBandCells('moderate', 12.6, eastRainPath, broadOffsets),
  ...createBandCells('heavy', 18.8, eastRainPath, coreOffsets),
  ...createBandCells('storm', 27.6, stormCorePath, coreOffsets),
  ...createBandCells('severeStorm', 39.2, [[114.126, 22.553], [114.188, 22.568], [114.236, 22.526]], coreOffsets),
  ...createBandCells('severeStorm', 37.8, [[114.337, 22.618], [114.382, 22.679], [114.459, 22.641]], coreOffsets),
];

const mockRadarSpeckles: RadarCell[] = [
  ...createBandCells('light', 3.6, westRainPath, speckleOffsets),
  ...createBandCells('light', 4.2, northRainPath, speckleOffsets),
  ...createBandCells('moderate', 7.6, southRainPath, speckleOffsets),
  ...createBandCells('moderate', 7.2, eastRainPath, speckleOffsets),
  ...createBandCells('heavy', 13.8, stormCorePath, speckleOffsets),
];

const ambientEchoCenters: Coordinate[] = [
  [113.76, 22.57],
  [113.79, 22.61],
  [113.84, 22.68],
  [113.88, 22.72],
  [113.94, 22.74],
  [114.03, 22.75],
  [114.12, 22.76],
  [114.22, 22.77],
  [114.34, 22.75],
  [114.46, 22.72],
  [114.53, 22.68],
  [114.55, 22.61],
  [114.49, 22.55],
  [114.37, 22.5],
  [114.25, 22.43],
  [114.13, 22.38],
  [114.0, 22.37],
  [113.88, 22.37],
  [113.79, 22.39],
  [113.72, 22.48],
];

const luohuCoreCenters: Coordinate[] = [
  [114.094, 22.518],
  [114.124, 22.558],
  [114.168, 22.538],
  [114.187, 22.568],
  [114.238, 22.527],
];

const pingshanCoreCenters: Coordinate[] = [
  [114.319, 22.607],
  [114.351, 22.658],
  [114.397, 22.681],
  [114.421, 22.646],
  [114.474, 22.634],
];

const innerBurstCenters: Coordinate[] = [
  [114.074, 22.499],
  [114.111, 22.532],
  [114.142, 22.552],
  [114.194, 22.54],
  [114.263, 22.572],
  [114.328, 22.606],
  [114.386, 22.651],
  [114.435, 22.655],
];

const scatteredBlueCenters: Coordinate[] = [
  [113.8, 22.5],
  [113.84, 22.58],
  [113.91, 22.62],
  [113.99, 22.66],
  [114.08, 22.66],
  [114.18, 22.67],
  [114.3, 22.69],
  [114.44, 22.7],
  [114.5, 22.62],
  [114.42, 22.55],
  [114.29, 22.47],
  [114.17, 22.43],
  [114.03, 22.4],
  [113.9, 22.42],
];

const westernBurstCenters: Coordinate[] = [
  [113.8, 22.54],
  [113.85, 22.58],
  [113.88, 22.44],
  [113.93, 22.38],
  [113.96, 22.66],
];

const easternBurstCenters: Coordinate[] = [
  [114.329, 22.606],
  [114.361, 22.656],
  [114.418, 22.641],
  [114.476, 22.682],
];

const createFragmentCells = (
  level: RadarLevel,
  intensity: number,
  centers: Coordinate[],
  radius: number,
): RadarFragmentCell[] =>
  centers.flatMap(([lng, lat], index) => {
    const localCount = index % 3 === 0 ? 4 : 3;

    return Array.from({ length: localCount }, (_, offsetIndex) => {
      const angle = (index * 1.91 + offsetIndex * 2.27) % (Math.PI * 2);
      const distance = radius * (0.18 + offsetIndex * 0.34);
      const lngOffset = Math.cos(angle) * distance * 1.18;
      const latOffset = Math.sin(angle) * distance * 0.78;
      const cell: RadarFragmentCell = [
        level,
        Number((lng + lngOffset).toFixed(4)),
        Number((lat + latOffset).toFixed(4)),
        Number((intensity + ((index + offsetIndex) % 4) * 1.1 - 1.4).toFixed(1)),
        Number((radius * (0.48 + ((index + offsetIndex) % 3) * 0.14)).toFixed(4)),
      ];

      return cell;
    });
  });

const createMicroFragmentCells = (
  level: RadarLevel,
  intensity: number,
  seeds: FragmentSeed[],
  radius: number,
  count: number,
): RadarFragmentCell[] =>
  seeds.flatMap(([[lng, lat], lngSpread, latSpread], seedIndex) =>
    Array.from({ length: count }, (_, offsetIndex) => {
      const wave = seedIndex * 11.37 + offsetIndex * 5.19;
      const lngOffset = Math.sin(wave) * lngSpread + Math.cos(wave * 0.63) * lngSpread * 0.42;
      const latOffset = Math.cos(wave * 1.11) * latSpread + Math.sin(wave * 0.47) * latSpread * 0.38;
      const sizeNoise = 0.72 + ((seedIndex + offsetIndex) % 5) * 0.13;
      const intensityNoise = ((seedIndex * 3 + offsetIndex) % 7) * 0.55 - 1.45;
      const cell: RadarFragmentCell = [
        level,
        Number((lng + lngOffset).toFixed(4)),
        Number((lat + latOffset).toFixed(4)),
        Number((intensity + intensityNoise).toFixed(1)),
        Number((radius * sizeNoise).toFixed(4)),
      ];

      return cell;
    }),
  );

const toFragmentSeeds = (centers: Coordinate[], lngSpread: number, latSpread: number): FragmentSeed[] =>
  centers.map((center, index) => [
    center,
    Number((lngSpread * (0.88 + (index % 3) * 0.12)).toFixed(4)),
    Number((latSpread * (0.86 + (index % 4) * 0.08)).toFixed(4)),
  ]);

const mockRadarFragments: RadarFragmentCell[] = [
  ...createFragmentCells('light', 3.4, ambientEchoCenters, 0.02),
  ...createFragmentCells('light', 4.8, westRainPath, 0.018),
  ...createFragmentCells('moderate', 9.4, westRainPath, 0.015),
  ...createFragmentCells('light', 5.2, northRainPath, 0.019),
  ...createFragmentCells('moderate', 10.6, northRainPath, 0.016),
  ...createFragmentCells('moderate', 11.4, eastRainPath, 0.017),
  ...createFragmentCells('heavy', 16.8, pingshanCoreCenters, 0.014),
  ...createFragmentCells('storm', 25.6, pingshanCoreCenters.slice(1, 4), 0.011),
  ...createFragmentCells('light', 6.8, southRainPath, 0.016),
  ...createFragmentCells('moderate', 10.2, southRainPath.slice(1, 6), 0.011),
  ...createFragmentCells('storm', 24.8, luohuCoreCenters, 0.012),
  ...createFragmentCells('severeStorm', 36.6, luohuCoreCenters.slice(1, 4), 0.009),
  ...createFragmentCells('severeStorm', 39.4, [[114.166, 22.503], [114.211, 22.534], [114.263, 22.517]], 0.008),
  ...createMicroFragmentCells('light', 3.2, toFragmentSeeds(ambientEchoCenters, 0.03, 0.018), 0.0058, 9),
  ...createMicroFragmentCells('light', 4.8, toFragmentSeeds(westRainPath, 0.034, 0.024), 0.0062, 8),
  ...createMicroFragmentCells('light', 4.9, toFragmentSeeds(northRainPath, 0.04, 0.02), 0.006, 8),
  ...createMicroFragmentCells('light', 4.5, toFragmentSeeds(eastRainPath, 0.032, 0.025), 0.0058, 7),
  ...createMicroFragmentCells('moderate', 9.6, toFragmentSeeds(westRainPath, 0.023, 0.018), 0.0052, 6),
  ...createMicroFragmentCells('moderate', 10.8, toFragmentSeeds(northRainPath, 0.028, 0.016), 0.005, 6),
  ...createMicroFragmentCells('moderate', 11.6, toFragmentSeeds(eastRainPath, 0.026, 0.021), 0.0054, 7),
  ...createMicroFragmentCells('light', 6.8, toFragmentSeeds(southRainPath, 0.03, 0.02), 0.0054, 8),
  ...createMicroFragmentCells('light', 4.1, toFragmentSeeds(scatteredBlueCenters, 0.038, 0.024), 0.0048, 13),
  ...createMicroFragmentCells('moderate', 8.8, toFragmentSeeds(scatteredBlueCenters.slice(2, 11), 0.024, 0.018), 0.0046, 7),
  ...createMicroFragmentCells('moderate', 9.8, toFragmentSeeds(westernBurstCenters, 0.024, 0.018), 0.0048, 8),
  ...createMicroFragmentCells('heavy', 16.2, toFragmentSeeds(westernBurstCenters, 0.018, 0.014), 0.0044, 8),
  ...createMicroFragmentCells('heavy', 17.8, toFragmentSeeds(easternBurstCenters, 0.017, 0.013), 0.0042, 8),
  ...createMicroFragmentCells('moderate', 10.8, toFragmentSeeds(southRainPath.slice(1, 6), 0.024, 0.016), 0.0046, 8),
  ...createMicroFragmentCells('heavy', 17.6, toFragmentSeeds(pingshanCoreCenters, 0.022, 0.017), 0.0048, 8),
  ...createMicroFragmentCells('heavy', 18.4, toFragmentSeeds(innerBurstCenters, 0.018, 0.013), 0.0044, 7),
  ...createMicroFragmentCells('storm', 25.8, toFragmentSeeds(luohuCoreCenters, 0.019, 0.014), 0.0044, 9),
  ...createMicroFragmentCells('storm', 26.4, toFragmentSeeds(pingshanCoreCenters.slice(1, 4), 0.018, 0.014), 0.0042, 9),
  ...createMicroFragmentCells('storm', 27.2, toFragmentSeeds(easternBurstCenters.slice(1, 4), 0.013, 0.01), 0.0038, 8),
  ...createMicroFragmentCells('storm', 28.2, toFragmentSeeds(innerBurstCenters, 0.013, 0.01), 0.0038, 8),
  ...createMicroFragmentCells('severeStorm', 37.8, toFragmentSeeds(luohuCoreCenters.slice(1, 4), 0.013, 0.01), 0.0038, 9),
  ...createMicroFragmentCells('severeStorm', 36.8, toFragmentSeeds(pingshanCoreCenters.slice(1, 5), 0.012, 0.009), 0.0036, 8),
  ...createMicroFragmentCells('severeStorm', 38.4, toFragmentSeeds(easternBurstCenters.slice(1, 3), 0.009, 0.007), 0.0034, 7),
  ...createMicroFragmentCells(
    'severeStorm',
    39.6,
    toFragmentSeeds(
      [
        [114.157, 22.496],
        [114.203, 22.531],
        [114.258, 22.516],
        [114.334, 22.613],
      ],
      0.012,
      0.009,
    ),
    0.0036,
    8,
  ),
];

const createRadarBandFeature = (
  id: string,
  tier: RadarBandTier,
  level: RadarLevel,
  intensity: number,
  coordinates: Coordinate[],
): Feature<Polygon, RadarBandProperties> => ({
  type: 'Feature',
  properties: {
    id,
    tier,
    level,
    intensity,
  },
  geometry: {
    type: 'Polygon',
    coordinates: [coordinates],
  },
});

const createRadarRibbonFeature = (
  id: string,
  tier: RadarRibbonTier,
  level: RadarLevel,
  intensity: number,
  coordinates: Coordinate[],
): Feature<LineString, RadarRibbonProperties> => ({
  type: 'Feature',
  properties: {
    id,
    tier,
    level,
    intensity,
  },
  geometry: {
    type: 'LineString',
    coordinates,
  },
});

const createRadarFragmentFeature = (
  id: string,
  level: RadarLevel,
  lng: number,
  lat: number,
  intensity: number,
  radius: number,
): Feature<Polygon, RadarFragmentProperties> => {
  const skew = ((id.length % 5) - 2) * radius * 0.12;
  const wobble = ((id.charCodeAt(id.length - 1) % 7) - 3) * radius * 0.035;
  const coordinates: Coordinate[] = [
    [Number((lng - radius * 0.95).toFixed(4)), Number((lat - radius * 0.18 + wobble).toFixed(4))],
    [Number((lng - radius * 0.48 + skew).toFixed(4)), Number((lat + radius * 0.56).toFixed(4))],
    [Number((lng + radius * 0.22).toFixed(4)), Number((lat + radius * 0.74 + wobble).toFixed(4))],
    [Number((lng + radius * 0.92 + skew).toFixed(4)), Number((lat + radius * 0.24).toFixed(4))],
    [Number((lng + radius * 0.68).toFixed(4)), Number((lat - radius * 0.5 + wobble).toFixed(4))],
    [Number((lng - radius * 0.12 - skew).toFixed(4)), Number((lat - radius * 0.72).toFixed(4))],
    [Number((lng - radius * 0.95).toFixed(4)), Number((lat - radius * 0.18 + wobble).toFixed(4))],
  ];

  return {
    type: 'Feature',
    properties: {
      id,
      level,
      intensity,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
};

export const mockRadarBandsGeoJson: FeatureCollection<Polygon, RadarBandProperties> = {
  type: 'FeatureCollection',
  features: [
    createRadarBandFeature('west-base', 'base', 'light', 3.8, [
      [113.74, 22.48],
      [113.82, 22.6],
      [113.96, 22.68],
      [114.13, 22.66],
      [114.18, 22.56],
      [114.06, 22.46],
      [113.87, 22.4],
      [113.74, 22.48],
    ]),
    createRadarBandFeature('south-base', 'base', 'light', 4.4, [
      [113.76, 22.38],
      [113.92, 22.43],
      [114.1, 22.5],
      [114.31, 22.6],
      [114.51, 22.69],
      [114.59, 22.61],
      [114.39, 22.51],
      [114.18, 22.43],
      [113.95, 22.37],
      [113.76, 22.38],
    ]),
    createRadarBandFeature('north-east-base', 'base', 'light', 3.6, [
      [113.86, 22.62],
      [114.02, 22.72],
      [114.24, 22.76],
      [114.48, 22.73],
      [114.56, 22.65],
      [114.39, 22.58],
      [114.14, 22.58],
      [113.94, 22.56],
      [113.86, 22.62],
    ]),
    createRadarBandFeature('west-green-band', 'band', 'moderate', 10.2, [
      [113.8, 22.49],
      [113.88, 22.58],
      [114.02, 22.63],
      [114.12, 22.61],
      [114.07, 22.53],
      [113.93, 22.48],
      [113.83, 22.44],
      [113.8, 22.49],
    ]),
    createRadarBandFeature('north-green-band', 'band', 'moderate', 11.4, [
      [113.91, 22.66],
      [114.06, 22.73],
      [114.28, 22.75],
      [114.47, 22.7],
      [114.43, 22.62],
      [114.2, 22.64],
      [114.0, 22.61],
      [113.91, 22.66],
    ]),
    createRadarBandFeature('south-green-band', 'band', 'moderate', 12.8, [
      [113.83, 22.4],
      [113.96, 22.45],
      [114.1, 22.53],
      [114.27, 22.61],
      [114.41, 22.67],
      [114.46, 22.61],
      [114.31, 22.55],
      [114.13, 22.45],
      [113.92, 22.38],
      [113.83, 22.4],
    ]),
    createRadarBandFeature('east-yellow-band', 'band', 'heavy', 17.6, [
      [114.22, 22.51],
      [114.33, 22.58],
      [114.46, 22.68],
      [114.53, 22.66],
      [114.46, 22.57],
      [114.34, 22.5],
      [114.25, 22.47],
      [114.22, 22.51],
    ]),
    createRadarBandFeature('luohu-yellow-core', 'band', 'heavy', 18.4, [
      [114.07, 22.505],
      [114.13, 22.525],
      [114.22, 22.565],
      [114.25, 22.545],
      [114.18, 22.505],
      [114.1, 22.49],
      [114.07, 22.505],
    ]),
    createRadarBandFeature('luohu-orange-core', 'band', 'storm', 28.8, [
      [114.095, 22.515],
      [114.15, 22.535],
      [114.205, 22.565],
      [114.235, 22.545],
      [114.19, 22.515],
      [114.125, 22.5],
      [114.095, 22.515],
    ]),
    createRadarBandFeature('pingshan-orange-core', 'band', 'storm', 26.8, [
      [114.34, 22.62],
      [114.39, 22.655],
      [114.46, 22.69],
      [114.5, 22.665],
      [114.45, 22.625],
      [114.38, 22.6],
      [114.34, 22.62],
    ]),
    createRadarBandFeature('luohu-red-core', 'band', 'severeStorm', 38.8, [
      [114.14, 22.525],
      [114.18, 22.548],
      [114.22, 22.565],
      [114.245, 22.545],
      [114.205, 22.515],
      [114.16, 22.508],
      [114.14, 22.525],
    ]),
    createRadarBandFeature('pingshan-red-core', 'band', 'severeStorm', 37.6, [
      [114.37, 22.635],
      [114.405, 22.662],
      [114.445, 22.678],
      [114.47, 22.655],
      [114.43, 22.628],
      [114.39, 22.618],
      [114.37, 22.635],
    ]),
  ],
};

export const mockRadarRibbonsGeoJson: FeatureCollection<LineString, RadarRibbonProperties> = {
  type: 'FeatureCollection',
  features: [
    createRadarRibbonFeature('west-outer', 'outer', 'light', 5.2, [
      [113.76, 22.47],
      [113.84, 22.53],
      [113.95, 22.58],
      [114.08, 22.6],
      [114.17, 22.62],
    ]),
    createRadarRibbonFeature('west-core', 'core', 'moderate', 11.4, [
      [113.82, 22.49],
      [113.91, 22.54],
      [114.02, 22.58],
      [114.12, 22.6],
    ]),
    createRadarRibbonFeature('north-outer', 'outer', 'light', 5.8, [
      [113.9, 22.66],
      [114.04, 22.71],
      [114.23, 22.73],
      [114.42, 22.69],
      [114.53, 22.65],
    ]),
    createRadarRibbonFeature('north-core', 'core', 'moderate', 12.2, [
      [113.96, 22.66],
      [114.12, 22.7],
      [114.31, 22.7],
      [114.47, 22.66],
    ]),
    createRadarRibbonFeature('south-outer', 'outer', 'moderate', 13.2, [
      [113.78, 22.4],
      [113.94, 22.45],
      [114.1, 22.52],
      [114.28, 22.6],
      [114.47, 22.67],
      [114.58, 22.61],
    ]),
    createRadarRibbonFeature('coastal-texture', 'outer', 'light', 6.8, [
      [113.88, 22.4],
      [114.01, 22.46],
      [114.16, 22.53],
      [114.31, 22.59],
      [114.44, 22.63],
    ]),
    createRadarRibbonFeature('east-outer', 'outer', 'moderate', 12.4, [
      [114.17, 22.45],
      [114.28, 22.53],
      [114.4, 22.62],
      [114.52, 22.7],
    ]),
    createRadarRibbonFeature('east-core', 'core', 'heavy', 18.2, [
      [114.25, 22.5],
      [114.35, 22.57],
      [114.46, 22.65],
    ]),
    createRadarRibbonFeature('luohu-core', 'core', 'storm', 29.6, [
      [114.09, 22.515],
      [114.14, 22.535],
      [114.2, 22.555],
      [114.24, 22.55],
    ]),
    createRadarRibbonFeature('luohu-red-core', 'core', 'severeStorm', 39.4, [
      [114.145, 22.525],
      [114.19, 22.545],
      [114.225, 22.555],
    ]),
    createRadarRibbonFeature('pingshan-red-core', 'core', 'severeStorm', 38.4, [
      [114.365, 22.635],
      [114.41, 22.66],
      [114.455, 22.675],
    ]),
  ],
};

export const mockRadarFragmentsGeoJson: FeatureCollection<Polygon, RadarFragmentProperties> = {
  type: 'FeatureCollection',
  features: mockRadarFragments.map(([level, lng, lat, intensity, radius], index) =>
    createRadarFragmentFeature(`fragment-${index}`, level, lng, lat, intensity, radius),
  ),
};

export const mockRadarGeoJson: FeatureCollection<Point, RadarPointProperties> = {
  type: 'FeatureCollection',
  features: mockRadarCells.map(([level, lng, lat, intensity]) =>
    createRadarFeature(level, [lng, lat], intensity),
  ),
};

export const mockRadarSpecklesGeoJson: FeatureCollection<Point, RadarPointProperties> = {
  type: 'FeatureCollection',
  features: mockRadarSpeckles.map(([level, lng, lat, intensity]) =>
    createRadarFeature(level, [lng, lat], intensity),
  ),
};
