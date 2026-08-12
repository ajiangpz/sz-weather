# Codex Tasks

## Task 1: Static Layout

Create the static dashboard layout.
Use `docs/image.png` as the visual target for the first static layout pass.

Requirements:

- Vue3 + TypeScript
- SCSS
- CSS Grid
- 1920×1080 first
- 1440px compatible
- No real API
- Keep existing MapLibre + OSM map if present
- Use deck.gl for rainfall radar rendering on the `deckGL` branch
- Use mock text and mock data

Components:

- WeatherDashboardView
- WeatherHeader
- WeatherLayerPanel
- WeatherLegend
- WeatherStationRank
- WeatherMapPanel
- WeatherMetricPanel
- WeatherAlertPanel
- WeatherTrendPanel
- WeatherTimeline

Acceptance:

- Layout matches `docs/UI_DESIGN_SPEC.md`
- Style follows `docs/VISUAL_STYLE_GUIDE.md`
- First viewport composition resembles `docs/image.png`
- 1536x1024 keeps the complete reference composition visible without scrolling
- Current MapLibre + OSM page is restyled into the dark RainScope dashboard direction
- deck.gl radar direction is reflected in the map implementation plan
- No unnecessary decorative effects

---

## Task 2: Mock Data and Pinia

Create mock data and stores.

Files:

- `stores/weatherStore.ts`
- `stores/layerStore.ts`
- `stores/timelineStore.ts`
- `stores/mapStore.ts`
- `mock/currentWeather.ts`
- `mock/rainFrames.ts`
- `mock/alerts.ts`
- `mock/stations.ts`
- `mock/trends.ts`
- `types/weather.ts`

Acceptance:

- All page data comes from stores
- TypeScript interfaces are complete
- No hardcoded data inside components except labels

---

## Task 3: MapLibre Map and deck.gl Rainfall Radar Layer

Implement the first dashboard map version using the current MapLibre + OSM foundation and a deck.gl radar overlay.

This task intentionally differs from the original generated template in `chatGPT.md`: the local project already has MapLibre + OSM, so the current milestone should restyle and extend it instead of replacing it with a simulated-only map.

Requirements:

- Keep MapLibre + OSM raster tiles for this milestone
- Add deck.gl dependencies needed for MapLibre overlay rendering
- Use `MapboxOverlay` from `@deck.gl/mapbox` to connect deck.gl to the MapLibre map
- Restyle the map area to match the dark professional dashboard style
- Subdue the OSM basemap so rainfall remains dominant
- District labels
- Rainfall radar rendered by deck.gl from mock cell/band data
- Station points
- Alert area
- Point popup
- Zoom controls
- Current frame time
- Scale bar
- Layer and locate controls
- deck.gl overlay cleanup on component unmount

Acceptance:

- Rainfall layer looks continuous
- Rainfall texture resembles `docs/image.png`: broad precipitation fields, dense irregular fragments, and warm-color high-intensity cores
- Rainfall opacity is controlled by layer store
- Timeline frame changes update deck.gl radar data without recreating the MapLibre map
- Station click works
- Map click shows popup
- Map visually follows `docs/VISUAL_STYLE_GUIDE.md`
- The dashboard does not look like a generic OSM map page
- Map panel composition resembles the center area of `docs/image.png`

---

## Task 4: ECharts

Implement chart components.

Charts:

- RainTrendChart
- TemperatureHumidityChart
- WindSpeedChart
- RainDistributionChart

Acceptance:

- Use BaseChart wrapper
- Dispose ECharts instance on unmount
- Resize works
- Theme follows visual guide

---

## Task 5: Timeline Interaction

Implement timeline playback.

Acceptance:

- Play and pause work
- Frame switching updates weather data
- Rainfall layer updates
- Metrics update
- Header time updates

---

## Task 6: Responsive Layout

Implement responsive layout.

Breakpoints:

- 1920×1080
- 1440px
- 1024px
- 768px
- 375px

Acceptance:

- Map remains primary
- Panels collapse on small screens
- Charts reflow correctly
- Timeline is simplified on mobile

---

## Automation Queue

This section is the task source for the scheduled GitHub Issue producer.

Only unchecked Markdown items directly written in this format are eligible:

```text
- [x] Short, implementation-ready task title
```

Rules:

- Put the highest-priority task first.
- Keep each queue item scoped so Codex can reasonably complete it in one development run.
- Do not add `codex-ready` manually unless you want Codex to pick up an Issue outside this queue.
- The scheduled workflow creates at most one Issue per run.
- If any open Issue already has the `codex-ready` label, the workflow creates nothing.
- After an Issue is created successfully, the corresponding queue item is changed from `[ ]` to `[x]` and committed back to the repository.
- Checked items are historical records and will not be recreated.

### Pending tasks

<!-- Add implementation-ready tasks below this line. Example:
- [ ] Add 0.5x, 1x, and 2x playback-speed controls to WeatherTimeline
-->
