
# UI Design Spec

## 1. Target Page

Build a single-page weather visualization dashboard:

```txt
RainScope 深圳天气可视化大屏
```

The dashboard should focus on Shenzhen weather visualization.

---

## 2. Main Layout

Use a 1920×1080 dashboard layout as the primary design target.
Use `docs/image.png` as the primary visual reference for spacing, density, hierarchy, and panel placement.

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                       │
├───────────────┬──────────────────────────────────────────────┬───────────────┤
│ Left Panel     │ Main Map                                      │ Right Panel    │
│ Layer Control  │ Rainfall Radar Layer                         │ Metrics        │
│ Legend         │ Stations                                     │ Alerts         │
│ Station Rank   │ Point Popup                                  │ Distribution   │
├───────────────┴──────────────────────────────────────────────┴───────────────┤
│ Trend Charts                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Timeline                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Recommended grid:

```scss
.weather-dashboard__body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 390px;
  grid-template-rows: minmax(0, 1fr) 260px 96px;
  gap: 16px;
}
```

Header height:
```
72px
```

Page padding:
```
16px
```

## 3. Header

Header should include:

- Logo: blue rainfall/radar mark
- Project name: `RainScope`
- Subtitle: `深圳天气可视化大屏`
- City selector: `深圳市`
- Current weather: `中雨 29℃`
- Humidity: `82%`
- Wind speed: `5.2m/s`
- Pressure: `1005hPa`
- Update time: `2026-07-09 14:30:00`
- Refresh button
- Theme button

Header layout:

- Brand block on the left.
- City selector near the brand block.
- Current condition centered and visually prominent.
- Humidity, wind speed, and pressure shown as compact metric chips.
- Update time and helper text on the right.
- Refresh and dark-mode controls at the far right.
- Header should be dense and single-line at desktop sizes.

## 4. Left Panel

Left panel includes:

1. WeatherLayerPanel
2. WeatherLegend
3. WeatherStationRank

The left column should match the reference image density: stacked translucent panels with compact section titles and no marketing copy.

### Layer Control

Layers:

- 降雨雷达
- 预警区域
- 监测站点
- 风场流线
- 温度热力
- 湿度热力

For MVP:

- 降雨雷达: enabled by default
- 预警区域: enabled by default
- 监测站点: enabled by default
- 风场流线: visible as a disabled or optional control
- 温度热力: visible as a disabled or optional control
- 湿度热力: visible as a disabled or optional control

Layer controls should include an opacity slider for every enabled visual layer.
The default opacity values should visually match the reference:

- 降雨雷达: 70%
- 预警区域: 60%
- 风场流线: 50%
- 温度热力: 60%
- 湿度热力: 60%

### Rainfall Legend

Show rainfall levels:

- 无雨
- 小雨
- 中雨
- 大雨
- 暴雨
- 大暴雨
- 特大暴雨

### Station Rank

Show 24h rainfall ranking:

- 大梧桐
- 罗湖
- 南山
- 福田
- 宝安

Clicking a station should highlight the station on the map.

## 5. Main Map

The map should be the visual center.
In the reference image, the map is the largest single area and should occupy most of the center column above the trend chart.

MVP decision:

The current project already uses MapLibre GL with OSM raster tiles. Keep this implementation for now.
The OSM basemap must be visually restyled through container styling, layer paint settings, overlays, and CSS filters so it reads as a dark professional dashboard map.

Do not make the product feel like a normal map/weather query app. The rainfall radar layer, station data, alert areas, and timeline state should remain the main visual story.

The map should show:

- Shenzhen area
- District names
- District boundaries
- Rainfall radar layer
- Weather stations
- Alert area
- Map point popup
- Zoom controls
- Current frame time
- Scale bar
- Layer shortcut button
- Locate or target button
- Clicked-point popup

District labels:

- 宝安区
- 南山区
- 福田区
- 罗湖区
- 龙华区
- 龙岗区
- 光明区
- 坪山区
- 大鹏新区
- 盐田区

Clicking the map should show a point weather popup.

Popup content should follow the reference:

- Popup title: `点击位置`
- Longitude
- Latitude
- Current rainfall intensity
- 1-hour rainfall
- Temperature
- Humidity
- Wind speed
- Wind direction
- Alert summary when relevant

MapLibre styling requirements:

- Basemap should be subdued, dark, and cool-toned.
- Rainfall layer should be more visually prominent than streets or labels.
- OSM tiles may remain visible, but should not dominate the dashboard.
- Map controls should match the dashboard style where practical.
- Rainfall polygons/blobs should use semi-transparent continuous bands, not administrative blocks.
- Future replacement with a simulated SVG/Canvas Shenzhen map is allowed, but not required for the current milestone.

## 6. Right Panel

Right panel includes:

1. WeatherMetricPanel
2. WeatherAlertPanel
3. RainDistributionChart

The right column should be stacked as:

1. 实时指标
2. 天气预警
3. 降雨强度分布

### Metrics

Display six metric cards:

- 1小时降雨
- 24小时降雨
- 最大雨强
- 当前温度
- 相对湿度
- 风速

Metric cards should use a 2-column grid in the right panel at desktop size.
Each card should include label, value, unit, and a small weather-related icon or visual mark.

### Alerts

Show two mock alerts:

- 暴雨黄色预警
- 雷雨大风蓝色预警

Clicking an alert should highlight the related alert area on the map.

Alert cards should include:

- Alert icon
- Alert title
- Status badge: `生效中`
- Publish time
- Impact area
- Forecast period
- `查看详情` action

### Distribution

Use ECharts donut chart to show rainfall level distribution.

## 7. Trend Chart Area

Trend chart area includes:

- Rainfall trend chart
- Temperature and humidity chart
- Wind speed chart

Use ECharts.

The charts should use compact dark-dashboard styling.
The trend panel should match the reference image:

- Title: `趋势分析（未来24小时）`
- Tab-like controls for 降雨量、温度、湿度、风速
- Three compact chart regions can be visible together on desktop.
- Rainfall chart should combine rainfall bars and accumulated rainfall line.
- Temperature and humidity chart should use two lines.
- Wind chart should use one line.

## 8. Timeline

Timeline includes:

- Play / pause button
- Next frame button
- Speed selector
- Frame marks
- Current frame marker
- Current label
- Step backward button
- Step forward button

Time range:

```txt
Past 2 hours + current + next 2 hours
```

Frame interval:

```txt
10 minutes
```

When the current frame changes:

- Header time updates
- Map rainfall layer updates
- Metric cards update
- Charts highlight current time

Timeline visual requirements:

- Full-width bottom panel.
- Large play button on the left.
- Speed selector near the play controls.
- Horizontal time rail with 10-minute marks.
- Current time marker uses a bright blue handle and `当前` label.
- Forecast segment can be visually distinguished from past/current segment.
- Right-side buttons should include `近小时` and `逐10分钟`.
