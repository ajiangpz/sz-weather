import type { FeatureCollection, Geometry } from 'geojson';
import { describe, expect, it } from 'vitest';

import { mockRadarBandsGeoJson, mockRadarFragmentsGeoJson, mockRadarGeoJson, mockRadarRibbonsGeoJson, mockRadarSpecklesGeoJson } from './weather';

type Coordinate = [number, number];

const visitCoordinates = (coordinates: unknown, output: Coordinate[]) => {
  if (
    Array.isArray(coordinates) &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    output.push([coordinates[0], coordinates[1]]);
    return;
  }

  if (Array.isArray(coordinates)) {
    coordinates.forEach((child) => visitCoordinates(child, output));
  }
};

const collectCoordinates = (collection: FeatureCollection<Geometry, unknown>) => {
  const coordinates: Coordinate[] = [];

  collection.features.forEach((feature) => {
    if ('coordinates' in feature.geometry) {
      visitCoordinates(feature.geometry.coordinates, coordinates);
      return;
    }

    feature.geometry.geometries.forEach((geometry) => {
      if ('coordinates' in geometry) {
        visitCoordinates(geometry.coordinates, coordinates);
      }
    });
  });

  return coordinates;
};

describe('weather mock radar data', () => {
  it('keeps radar echoes inside the designed map viewport', () => {
    const collections: Array<FeatureCollection<Geometry, unknown>> = [
      mockRadarBandsGeoJson,
      mockRadarFragmentsGeoJson,
      mockRadarGeoJson,
      mockRadarRibbonsGeoJson,
      mockRadarSpecklesGeoJson,
    ];
    const coordinates = collections.flatMap(collectCoordinates);
    const longitudes = coordinates.map(([longitude]) => longitude);
    const latitudes = coordinates.map(([, latitude]) => latitude);

    expect(Math.min(...longitudes)).toBeGreaterThanOrEqual(113.68);
    expect(Math.max(...longitudes)).toBeLessThanOrEqual(114.64);
    expect(Math.min(...latitudes)).toBeGreaterThanOrEqual(22.34);
    expect(Math.max(...latitudes)).toBeLessThanOrEqual(22.83);
  });

  it('keeps storm cores as localized Luohu and Pingshan echoes instead of a south diagonal band', () => {
    const strongCells = mockRadarGeoJson.features.filter((feature) => {
      const { level, intensity } = feature.properties;

      return level === 'storm' || level === 'severeStorm' || intensity >= 24;
    });
    const isInLuohuCore = ([longitude, latitude]: number[]) =>
      longitude >= 114.08 && longitude <= 114.28 && latitude >= 22.49 && latitude <= 22.59;
    const isInPingshanCore = ([longitude, latitude]: number[]) =>
      longitude >= 114.32 && longitude <= 114.49 && latitude >= 22.6 && latitude <= 22.71;
    const southDiagonalCells = strongCells.filter((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;

      return latitude < 22.49 || (longitude < 114.08 && latitude < 22.53);
    });
    const bandIds = mockRadarBandsGeoJson.features.map((feature) => feature.properties.id);

    expect(strongCells.some((feature) => isInLuohuCore(feature.geometry.coordinates))).toBe(true);
    expect(strongCells.some((feature) => isInPingshanCore(feature.geometry.coordinates))).toBe(true);
    expect(southDiagonalCells).toHaveLength(0);
    expect(bandIds).toContain('luohu-red-core');
    expect(bandIds).toContain('pingshan-red-core');
    expect(bandIds).not.toContain('south-yellow-band');
    expect(bandIds).not.toContain('southern-orange-core');
  });

  it('breaks strong radar cells into uneven two-dimensional clusters instead of bead chains', () => {
    const strongCells = mockRadarGeoJson.features.filter((feature) => feature.properties.intensity >= 24);
    const clusters = [
      strongCells.filter((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        return longitude >= 114.08 && longitude <= 114.28 && latitude >= 22.49 && latitude <= 22.59;
      }),
      strongCells.filter((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        return longitude >= 114.32 && longitude <= 114.49 && latitude >= 22.6 && latitude <= 22.71;
      }),
    ];

    clusters.forEach((cluster) => {
      const sortedLongitudes = cluster
        .map((feature) => feature.geometry.coordinates[0])
        .sort((a, b) => a - b);
      const latitudeValues = cluster.map((feature) => feature.geometry.coordinates[1]);
      const adjacentGaps = sortedLongitudes.slice(1).map((longitude, index) => longitude - sortedLongitudes[index]);
      const uniqueIntensityBands = new Set(cluster.map((feature) => Math.round(feature.properties.intensity)));

      expect(cluster.length).toBeGreaterThanOrEqual(8);
      expect(Math.max(...latitudeValues) - Math.min(...latitudeValues)).toBeGreaterThan(0.035);
      expect(Math.max(...adjacentGaps) - Math.min(...adjacentGaps)).toBeGreaterThan(0.008);
      expect(uniqueIntensityBands.size).toBeGreaterThanOrEqual(4);
    });
  });
});
