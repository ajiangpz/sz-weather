# Component Architecture

## 1. Component Principles

- Keep components small and focused.
- Keep the map as the visual center.
- Use Pinia stores for shared state.
- Use ECharts only through reusable chart components.
- Keep data shape definitions in `types/weather.ts`.
- Clean up MapLibre instances, ECharts instances, timers, and event listeners on unmount.

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

`WeatherMapPanel` owns MapLibre setup and teardown.

Responsibilities:

- Initialize MapLibre.
- Load OSM raster tiles.
- Apply dashboard map styling.
- Render rainfall radar layer.
- Render station points.
- Render alert areas.
- Show point popup on map click.
- Highlight selected station or selected alert.
- Render current frame time overlay.
- Render map controls and scale bar.
- Remove the map instance on unmount.

The map component can use helper modules for layer definitions and GeoJSON generation.

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
- Layer toggles update MapLibre layer visibility and opacity.
