# Component Architecture

## 1. Component Principles

- Keep components small and focused.
- Keep the map as the visual center.
- Use Pinia stores for shared state.
- Use ECharts only through reusable chart components.
- Keep data shape definitions in `types/weather.ts`.
- Clean up MapLibre instances, deck.gl overlays, ECharts instances, timers, and event listeners on unmount.

## 2. Target Structure

```txt
src/
  pages/
    WeatherDashboardView.vue
  components/
    weather/
      WeatherHeader.vue
      WeatherLayerPanel.vue
      WeatherLegend.vue
      WeatherStationRank.vue
      WeatherMapPanel.vue
      WeatherMetricPanel.vue
      WeatherAlertPanel.vue
      WeatherTrendPanel.vue
      WeatherTimeline.vue
    charts/
      BaseChart.vue
      RainTrendChart.vue
      TemperatureHumidityChart.vue
      WindSpeedChart.vue
      RainDistributionChart.vue
  stores/
    weatherStore.ts
    layerStore.ts
    timelineStore.ts
    mapStore.ts
  mock/
    currentWeather.ts
    rainFrames.ts
    alerts.ts
    stations.ts
    trends.ts
  types/
    weather.ts
```

## 3. Page Ownership

`WeatherDashboardView` owns the dashboard layout.

It should compose the header, left panel, map, right panel, trend area, and timeline. It should not hardcode weather values directly. Values should come from stores.
The target composition should follow `docs/image.png`.

Suggested layout regions:

- `header`: WeatherHeader
- `left`: WeatherLayerPanel, WeatherLegend, WeatherStationRank
- `map`: WeatherMapPanel
- `right`: WeatherMetricPanel, WeatherAlertPanel, RainDistributionChart
- `trend`: WeatherTrendPanel
- `timeline`: WeatherTimeline

## 4. Map Component

`WeatherMapPanel` owns MapLibre setup, deck.gl radar overlay setup, and teardown.

Responsibilities:

- Initialize MapLibre.
- Initialize the deck.gl MapboxOverlay used for rainfall radar rendering.
- Load OSM raster tiles.
- Apply dashboard map styling.
- Render rainfall radar layer with deck.gl.
- Render station points.
- Render alert areas.
- Show point popup on map click.
- Highlight selected station or selected alert.
- Render current frame time overlay.
- Render map controls and scale bar.
- Remove the map instance on unmount.
- Finalize/remove the deck.gl overlay on unmount.

The map component can use helper modules for layer definitions, deck.gl layer factories, and GeoJSON/mock radar generation.

Recommended ownership:

- MapLibre: basemap, viewport, controls, scale, base click coordinate.
- deck.gl: rainfall radar layers, radar opacity, frame-to-frame visual updates, optional radar picking.
- Pinia stores: selected station, selected alert, active frame, enabled layers, opacity values.

## 5. Store Boundaries

`weatherStore`:

- Current weather summary
- Metrics
- Alerts
- Stations
- Trend datasets

`layerStore`:

- Enabled map layers
- Rainfall opacity
- Disabled or UI-only layers

`timelineStore`:

- Current frame index
- Playback state
- Playback speed
- Frame list

`mapStore`:

- Selected station
- Selected alert
- Popup state
- Map viewport state if needed

## 6. Chart Components

`BaseChart` owns the shared ECharts lifecycle:

- `echarts.init`
- `setOption`
- resize listener
- `dispose`

Specific chart components should only build options and pass them to `BaseChart`.

`WeatherTrendPanel` should own chart grouping and tabs:

- 降雨量
- 温度
- 湿度
- 风速

At desktop size it may show rainfall, temperature/humidity, and wind charts together, matching the reference image.

## 7. Interaction Flow

- Station rank click updates `mapStore.selectedStationId`.
- Map station click updates `mapStore.selectedStationId`.
- Alert card click updates `mapStore.selectedAlertId`.
- Timeline frame change updates current frame-dependent weather data.
- Layer toggles update MapLibre layer visibility for native map layers and deck.gl layer visibility/opacity for radar overlays.
