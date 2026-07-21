# deck.gl Radar Feasibility

## 1. Summary

Using deck.gl for the RainScope rainfall radar layer is feasible and recommended on the `deckGL` branch.

The best first milestone is not to replace the whole map. Keep MapLibre GL + OSM as the basemap and viewport owner, then render rainfall radar as a deck.gl overlay. This matches the current project direction, avoids a large rewrite, and gives the radar layer a stronger WebGL rendering path for animation, opacity, and future data growth.

## 2. Current Project State

- The project already depends on `maplibre-gl`.
- The project does not yet depend on deck.gl.
- The main dashboard uses `WeatherMapPanel.vue`, which currently initializes a MapLibre map, loads a dark OSM/CARTO raster basemap, and renders radar bands/fragments/ribbons/speckles through native MapLibre style layers.
- `RainRadarMap.vue` is a smaller radar page that also initializes MapLibre and renders rainfall through a MapLibre `heatmap` layer.
- Mock radar data already exists as point cells, bands, ribbons, fragments, and speckles in `src/mock/weather.ts`.
- The MVP still uses mock data and should not introduce a real weather API.
- The MVP should not introduce Three.js.

## 3. Recommended Architecture

Use this ownership split:

| Area | Owner |
| --- | --- |
| Basemap, camera, zoom controls, scale, base click coordinate | MapLibre GL |
| Rainfall radar rendering, opacity, frame updates, optional radar picking | deck.gl |
| Timeline state, layer state, selected station/alert, mock weather data | Pinia |
| Charts | ECharts |

Recommended integration:

```ts
import { MapboxOverlay } from '@deck.gl/mapbox';

const overlay = new MapboxOverlay({
  interleaved: false,
  layers: buildRadarLayers(activeFrame, layerState),
});

map.addControl(overlay);
```

Use overlaid mode first. It is enough for an OSM raster basemap and avoids unnecessary ordering complexity. Interleaved mode can be considered later if the basemap changes to a vector style and radar must sit under selected label layers.

## 4. Layer Options

### Option A: GeoJSON / Polygon Radar Bands

Use deck.gl layers such as `GeoJsonLayer`, `PolygonLayer`, `PathLayer`, and `ScatterplotLayer` over the existing mock data.

Pros:

- Fits the current mock bands/fragments/cells well.
- Supports data-driven colors and opacity.
- Easy to update per timeline frame.
- Easy to keep inspectable and typed.

Cons:

- Edges can look too geometric if bands are not tuned.
- Needs careful alpha stacking so it looks like radar, not administrative polygons.

This is the recommended first implementation.

### Option B: deck.gl HeatmapLayer

Use point-like radar cells as weighted data and aggregate them on the GPU.

Pros:

- Good for soft continuous rainfall fields.
- Natural migration path from the current MapLibre heatmap approach.

Cons:

- Screen-space aggregation can change appearance across zoom levels.
- Color thresholds may need extra tuning to match rainfall categories.
- Picking exact rainfall values is less direct.

This is useful as a companion or fallback layer, not the only radar representation.

### Option C: BitmapLayer Radar Frames

Generate a transparent radar image per mock frame and render it with `BitmapLayer` over Shenzhen bounds.

Pros:

- Closest visual model to real radar imagery.
- Smooth playback can be very cheap once images are generated.
- Keeps the basemap visually quiet and radar-focused.

Cons:

- Requires a preprocessing step or offscreen canvas generation.
- Picking rainfall intensity from pixels is extra work.
- Harder to keep individual radar shapes semantically inspectable.

This is a strong second milestone after the vector/mock data layer works.

### Option D: WeatherLayers GL

WeatherLayers GL is a deck.gl ecosystem library for meteorological visualization.

Pros:

- Purpose-built for weather layers.
- Better suited to real weather raster/tile/vector-field datasets.

Cons:

- Adds complexity before RainScope has real weather data.
- Overkill for the first mock-data milestone.

Do not use this for the first pass. Reconsider it only when the project starts consuming real meteorological raster or tiled weather data.

## 5. Feasibility Assessment

Feasibility: High.

Reasons:

- deck.gl officially supports MapLibre integration through `MapboxOverlay`.
- The current MapLibre map can stay in place.
- Existing mock radar points, bands, fragments, and ribbons can be converted into deck.gl layer data without changing the product concept.
- Timeline playback can update deck.gl layer props instead of recreating the map.
- The expected MVP data size is small enough for deck.gl.

Primary risks:

- Visual tuning: radar must read as continuous rainfall bands, not scattered dots or hard polygons.
- Layer ordering: overlaid mode is fine for OSM raster, but future vector basemap labels may need interleaved mode.
- Event handling: MapLibre map clicks and deck.gl picking should have clear ownership.
- Cleanup: the map component must remove/finalize both MapLibre and deck.gl resources on unmount.
- Mobile GPU cost: large animated heatmaps or oversized bitmap frames should be tested at supported breakpoints.

## 6. First Implementation Recommendation

Implement in two steps:

1. Add deck.gl overlay infrastructure.
   - Add the required deck.gl packages.
   - Create a radar layer factory near the map component.
   - Initialize `MapboxOverlay` after the MapLibre map is ready.
   - Remove the overlay during component unmount.

2. Move rainfall rendering into deck.gl.
   - Convert current mock radar cells/bands/fragments into deck.gl layer data.
   - Use `GeoJsonLayer` or polygon/path layers for broad bands.
   - Use point or heatmap-style layers for soft echo texture.
   - Bind opacity and visibility to layer store state.
   - Update layer props on timeline frame changes.

Do not add a real weather API in this milestone.
Do not replace the dashboard layout.
Do not add Three.js.

## 7. Documentation References Checked

- deck.gl MapLibre integration docs: `MapboxOverlay` is the recommended MapLibre/Mapbox integration path.
- deck.gl upgrade guidance: deck.gl v9 removed `MapboxLayer`; use `MapboxOverlay`.
- deck.gl layer docs: `TileLayer` can render `BitmapLayer`; `HeatmapLayer` supports weighted aggregation; custom layers can support picking when needed.
