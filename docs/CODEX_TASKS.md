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
- Current MapLibre + OSM page is restyled into the dark RainScope dashboard direction
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

## Task 3: MapLibre Map and Rainfall Layer

Implement the first dashboard map version using the current MapLibre + OSM foundation.

This task intentionally differs from the original generated template in `chatGPT.md`: the local project already has MapLibre + OSM, so the current milestone should restyle and extend it instead of replacing it with a simulated-only map.

Requirements:

- Keep MapLibre + OSM raster tiles for this milestone
- Restyle the map area to match the dark professional dashboard style
- Subdue the OSM basemap so rainfall remains dominant
- District labels
- Rainfall blobs
- Station points
- Alert area
- Point popup
- Zoom controls
- Current frame time
- Scale bar
- Layer and locate controls

Acceptance:

- Rainfall layer looks continuous
- Rainfall opacity is controlled by layer store
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
