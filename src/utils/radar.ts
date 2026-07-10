import type { RadarLevel } from '@/types/weather';

export const radarLayerColors: Record<RadarLevel, string> = {
  light: '#4BA3FF',
  moderate: '#37D67A',
  heavy: '#F4D03F',
  storm: '#F59E42',
  severeStorm: '#E84C88',
};

export const createRadarFeature = (
  level: RadarLevel,
  coordinates: [number, number],
  intensity: number,
) => ({
  type: 'Feature',
  properties: {
    level,
    color: radarLayerColors[level],
    intensity,
  },
  geometry: {
    type: 'Point',
    coordinates,
  },
});
