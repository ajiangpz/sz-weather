import type { Feature, FeatureCollection, Point } from 'geojson';

import type { RadarLevel } from '@/types/weather';

interface DemoRadarBand {
  center: [number, number];
  length: number;
  width: number;
  angle: number;
  peakIntensity: number;
  phase: number;
}

interface DemoRadarPointProperties {
  level: RadarLevel;
  intensity: number;
}

const demoRadarBands: DemoRadarBand[] = [
  { center: [113.8, 23.1], length: 16.5, width: 4.8, angle: -0.13, peakIntensity: 48, phase: 0.7 },
  { center: [119.2, 29.4], length: 13.5, width: 4.2, angle: -0.42, peakIntensity: 39, phase: 2.1 },
  { center: [105.6, 28.3], length: 10.5, width: 3.8, angle: 0.28, peakIntensity: 24, phase: 4.4 },
  { center: [124.2, 43.1], length: 8.2, width: 3.1, angle: -0.2, peakIntensity: 18, phase: 5.6 },
];

const levelForIntensity = (intensity: number): RadarLevel => {
  if (intensity >= 32) return 'severeStorm';
  if (intensity >= 16) return 'storm';
  if (intensity >= 8) return 'heavy';
  if (intensity >= 2.5) return 'moderate';
  return 'light';
};

const createBandPoints = (band: DemoRadarBand, bandIndex: number): Array<Feature<Point, DemoRadarPointProperties>> => {
  const features: Array<Feature<Point, DemoRadarPointProperties>> = [];
  const cos = Math.cos(band.angle);
  const sin = Math.sin(band.angle);

  for (let alongIndex = -14; alongIndex <= 14; alongIndex += 1) {
    const along = alongIndex / 14;
    for (let acrossIndex = -6; acrossIndex <= 6; acrossIndex += 1) {
      const across = acrossIndex / 6;
      const envelope = Math.exp(-(along * along * 1.2 + across * across * 2.5));
      const texture = 0.76
        + Math.sin(alongIndex * 1.73 + acrossIndex * 0.91 + band.phase) * 0.16
        + Math.cos(alongIndex * 0.47 - acrossIndex * 1.51 + band.phase) * 0.1;
      const intensity = band.peakIntensity * envelope * Math.max(0.35, texture);
      if (intensity < 0.45) continue;

      const edgeBreakup = Math.sin(alongIndex * 2.41 + acrossIndex * 3.17 + band.phase) * 0.16;
      if (Math.abs(across) > 0.72 && edgeBreakup < -0.02) continue;

      const alongDistance = along * band.length * 0.5;
      const acrossDistance = across * band.width * 0.5;
      const wave = Math.sin(alongIndex * 0.61 + band.phase) * band.width * 0.12;
      const longitude = band.center[0] + alongDistance * cos - (acrossDistance + wave) * sin;
      const latitude = band.center[1] + alongDistance * sin + (acrossDistance + wave) * cos;

      features.push({
        type: 'Feature',
        id: `demo-radar-${bandIndex}-${alongIndex}-${acrossIndex}`,
        properties: {
          level: levelForIntensity(intensity),
          intensity: Number(intensity.toFixed(2)),
        },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      });
    }
  }

  return features;
};

export const createNationalDemoRadarPoints = (): FeatureCollection<Point, DemoRadarPointProperties> => ({
  type: 'FeatureCollection',
  features: demoRadarBands.flatMap(createBandPoints),
});
