# deck.gl Radar Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move RainScope's dashboard rainfall radar rendering from MapLibre style layers to a deck.gl overlay while keeping the existing MapLibre basemap and dashboard layout.

**Architecture:** MapLibre remains responsible for the basemap, viewport, district boundaries, controls, and component lifecycle. A focused deck.gl layer factory builds radar band, ribbon, fragment, and point-echo layers from the existing mock GeoJSON data; `WeatherMapPanel.vue` owns the `MapboxOverlay` instance and updates/removes it with the map lifecycle.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, MapLibre GL, deck.gl, Vitest.

---

### Task 1: Dependencies and Test Harness

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Add deck.gl runtime packages**

Run:

```powershell
pnpm add '@deck.gl/core' '@deck.gl/layers' '@deck.gl/mapbox'
```

Expected: `package.json` and `pnpm-lock.yaml` include the new deck.gl packages.

- [x] **Step 2: Add Vitest for focused TypeScript utility tests**

Run:

```powershell
pnpm add -D vitest
```

Expected: `package.json` and `pnpm-lock.yaml` include `vitest`.

- [x] **Step 3: Add a test script**

Update `package.json` scripts to include:

```json
"test": "vitest run"
```

Expected: `pnpm test` runs Vitest.

### Task 2: Radar Layer Factory TDD

**Files:**
- Create: `src/utils/radarDeckLayers.test.ts`
- Create: `src/utils/radarDeckLayers.ts`

- [x] **Step 1: Write the failing tests**

Create `src/utils/radarDeckLayers.test.ts` with tests for:

```ts
import { describe, expect, it } from 'vitest';

import { createRainRadarDeckLayers, getRadarColor, getRadarPointRadius } from './radarDeckLayers';

describe('radarDeckLayers', () => {
  it('maps radar levels to deck.gl rgba colors with opacity applied', () => {
    expect(getRadarColor('light', 0.5)).toEqual([75, 163, 255, 128]);
    expect(getRadarColor('severeStorm', 0.75)).toEqual([232, 76, 136, 191]);
  });

  it('scales point echo radius by rainfall intensity', () => {
    expect(getRadarPointRadius(2)).toBe(1200);
    expect(getRadarPointRadius(18)).toBe(2600);
    expect(getRadarPointRadius(42)).toBe(4200);
  });

  it('creates the expected deck.gl radar layer stack', () => {
    const layers = createRainRadarDeckLayers({
      bands: { type: 'FeatureCollection', features: [] },
      ribbons: { type: 'FeatureCollection', features: [] },
      fragments: { type: 'FeatureCollection', features: [] },
      cells: { type: 'FeatureCollection', features: [] },
      speckles: { type: 'FeatureCollection', features: [] },
      opacity: 0.7,
      visible: true,
    });

    expect(layers.map((layer) => layer.id)).toEqual([
      'deck-radar-band-wash',
      'deck-radar-band-core',
      'deck-radar-ribbons',
      'deck-radar-fragments',
      'deck-radar-cells',
      'deck-radar-speckles',
    ]);
  });
});
```

- [x] **Step 2: Run the tests and verify they fail for missing implementation**

Run:

```powershell
pnpm vitest run src/utils/radarDeckLayers.test.ts
```

Expected: FAIL because `src/utils/radarDeckLayers.ts` does not exist yet.

- [x] **Step 3: Implement the radar layer factory**

Create `src/utils/radarDeckLayers.ts` with:

```ts
import type { Layer } from '@deck.gl/core';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';

import type { RadarLevel } from '@/types/weather';

type DeckColor = [number, number, number, number];
type RadarFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      id?: string;
      level?: RadarLevel;
      tier?: string;
      intensity?: number;
    };
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
};

type RadarPointFeature = RadarFeatureCollection['features'][number] & {
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export interface RainRadarDeckLayerInput {
  bands: RadarFeatureCollection;
  ribbons: RadarFeatureCollection;
  fragments: RadarFeatureCollection;
  cells: RadarFeatureCollection;
  speckles: RadarFeatureCollection;
  opacity: number;
  visible: boolean;
}

const radarColors: Record<RadarLevel, [number, number, number]> = {
  light: [75, 163, 255],
  moderate: [55, 214, 122],
  heavy: [244, 208, 63],
  storm: [245, 158, 66],
  severeStorm: [232, 76, 136],
};

export const getRadarColor = (level: RadarLevel = 'light', opacity = 1): DeckColor => {
  const [red, green, blue] = radarColors[level];
  return [red, green, blue, Math.round(Math.max(0, Math.min(opacity, 1)) * 255)];
};

export const getRadarPointRadius = (intensity = 0): number => {
  if (intensity >= 32) {
    return 4200;
  }

  if (intensity >= 16) {
    return 2600;
  }

  if (intensity >= 8) {
    return 1900;
  }

  return 1200;
};

export const createRainRadarDeckLayers = ({
  bands,
  ribbons,
  fragments,
  cells,
  speckles,
  opacity,
  visible,
}: RainRadarDeckLayerInput): Layer[] => [
  new GeoJsonLayer({
    id: 'deck-radar-band-wash',
    data: bands,
    visible,
    filled: true,
    stroked: false,
    opacity,
    getFillColor: (feature) => getRadarColor(feature.properties.level, 0.3),
  }),
  new GeoJsonLayer({
    id: 'deck-radar-band-core',
    data: bands,
    visible,
    filled: true,
    stroked: true,
    opacity,
    getFillColor: (feature) => getRadarColor(feature.properties.level, feature.properties.tier === 'base' ? 0.22 : 0.48),
    getLineColor: (feature) => getRadarColor(feature.properties.level, 0.28),
    getLineWidth: 80,
    lineWidthUnits: 'meters',
  }),
  new GeoJsonLayer({
    id: 'deck-radar-ribbons',
    data: ribbons,
    visible,
    filled: false,
    stroked: true,
    opacity,
    getLineColor: (feature) => getRadarColor(feature.properties.level, feature.properties.tier === 'core' ? 0.52 : 0.32),
    getLineWidth: (feature) => (feature.properties.tier === 'core' ? 5200 : 8800),
    lineWidthUnits: 'meters',
    lineJointRounded: true,
    lineCapRounded: true,
  }),
  new GeoJsonLayer({
    id: 'deck-radar-fragments',
    data: fragments,
    visible,
    filled: true,
    stroked: false,
    opacity,
    getFillColor: (feature) => getRadarColor(feature.properties.level, 0.62),
  }),
  new ScatterplotLayer<RadarPointFeature>({
    id: 'deck-radar-cells',
    data: cells.features.filter((feature): feature is RadarPointFeature => feature.geometry.type === 'Point'),
    visible,
    opacity,
    getPosition: (feature) => feature.geometry.coordinates,
    getFillColor: (feature) => getRadarColor(feature.properties.level, 0.4),
    getRadius: (feature) => getRadarPointRadius(feature.properties.intensity),
    radiusUnits: 'meters',
    radiusMinPixels: 8,
    radiusMaxPixels: 48,
    stroked: false,
  }),
  new ScatterplotLayer<RadarPointFeature>({
    id: 'deck-radar-speckles',
    data: speckles.features.filter((feature): feature is RadarPointFeature => feature.geometry.type === 'Point'),
    visible,
    opacity,
    getPosition: (feature) => feature.geometry.coordinates,
    getFillColor: (feature) => getRadarColor(feature.properties.level, 0.56),
    getRadius: (feature) => getRadarPointRadius(feature.properties.intensity) * 0.28,
    radiusUnits: 'meters',
    radiusMinPixels: 1,
    radiusMaxPixels: 9,
    stroked: false,
  }),
];
```

- [x] **Step 4: Run the focused tests**

Run:

```powershell
pnpm vitest run src/utils/radarDeckLayers.test.ts
```

Expected: PASS.

### Task 3: WeatherMapPanel deck.gl Integration

**Files:**
- Modify: `src/components/weather/WeatherMapPanel.vue`

- [x] **Step 1: Import overlay and layer factory**

Add:

```ts
import { MapboxOverlay } from '@deck.gl/mapbox';
import { createRainRadarDeckLayers } from '@/utils/radarDeckLayers';
```

- [x] **Step 2: Add overlay lifecycle state**

Add:

```ts
let deckOverlay: MapboxOverlay | null = null;
```

- [x] **Step 3: Remove native MapLibre radar sources and layers from the map style**

Remove `radarBands`, `radarFragments`, `radarRibbons`, `radar`, and `radarSpeckles` MapLibre sources plus the native `radar-*` MapLibre style layers from `WeatherMapPanel.vue`.

- [x] **Step 4: Add the deck.gl overlay after map load**

Inside the `map.once('load', () => { ... })` block, after `fitBounds`, create and add the overlay:

```ts
deckOverlay = new MapboxOverlay({
  interleaved: false,
  layers: createRainRadarDeckLayers({
    bands: store.radarBandsGeoJson,
    ribbons: store.radarRibbonsGeoJson,
    fragments: store.radarFragmentsGeoJson,
    cells: store.radarGeoJson,
    speckles: store.radarSpecklesGeoJson,
    opacity: 0.7,
    visible: true,
  }),
});

map.addControl(deckOverlay);
```

- [x] **Step 5: Remove the overlay on unmount**

Before removing the MapLibre map, add:

```ts
deckOverlay?.finalize();
deckOverlay = null;
```

- [x] **Step 6: Run TypeScript build**

Run:

```powershell
pnpm build
```

Expected: exit code 0.

### Task 4: Runtime Visual Verification

**Files:**
- No source edits unless verification reveals a concrete issue.

- [x] **Step 1: Start or reuse Vite dev server**

Run:

```powershell
pnpm dev -- --host 127.0.0.1
```

Expected: local Vite URL is available.

- [x] **Step 2: Verify 1536×1024 and 1440px dashboard view**

Use browser verification to check:

- The page loads.
- The deck.gl radar overlay is visible.
- Map remains the largest central region.
- Header, side panels, trend charts, and timeline remain visible at 1536×1024.
- There are no obvious blank canvases or covering-layer regressions.

- [x] **Step 3: Run final verification**

Run:

```powershell
pnpm test
pnpm build
git diff --check
```

Expected: all commands exit 0.
