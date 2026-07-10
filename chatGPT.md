可以，而且**强烈建议这样做**。

Codex 官方支持用 `AGENTS.md` 给项目提供长期指令；官方文档说明 Codex 会在开始工作前读取 `AGENTS.md`，也可以在不同层级放置 `AGENTS.md` 来提供项目级规范和子目录级规范。([OpenAI开发者][1]) OpenAI 也说明 `AGENTS.md` 类似 `README.md`，可以告诉 Codex 如何理解代码库、运行命令、遵守项目标准。([OpenAI][2])

你这个天气可视化项目，建议这样组织：

```txt
rain-scope/
├─ AGENTS.md
├─ README.md
├─ docs/
│  ├─ PRODUCT_REQUIREMENTS.md
│  ├─ UI_DESIGN_SPEC.md
│  ├─ VISUAL_STYLE_GUIDE.md
│  ├─ COMPONENT_ARCHITECTURE.md
│  ├─ DATA_MODEL.md
│  ├─ INTERACTION_SPEC.md
│  ├─ RESPONSIVE_SPEC.md
│  └─ CODEX_TASKS.md
├─ src/
│  ├─ components/
│  ├─ stores/
│  ├─ mock/
│  ├─ types/
│  ├─ utils/
│  └─ styles/
```

其中最关键的是：

```txt
AGENTS.md                         给 Codex 的总规则
docs/UI_DESIGN_SPEC.md             页面结构和模块说明
docs/VISUAL_STYLE_GUIDE.md         样式规范、颜色、间距、卡片、图表规范
docs/COMPONENT_ARCHITECTURE.md     组件拆分和目录结构
docs/DATA_MODEL.md                 TypeScript 数据结构
docs/INTERACTION_SPEC.md           图层、时间轴、地图点击等交互逻辑
docs/CODEX_TASKS.md                分阶段开发任务
```

---

# 1. 根目录 AGENTS.md

这个文件是 Codex 最应该先读的。内容不要太长，重点告诉它：**先读哪些文档、遵守什么技术栈、不要擅自改方向**。

```md
# AGENTS.md

## Project

This project is called RainScope. It is a weather visualization dashboard for Shenzhen.

The goal is to build a portfolio-level frontend data visualization project, not a normal weather query app.

The project should focus on:

- Weather map visualization
- Rainfall radar layer
- Weather alerts
- Time-axis playback
- Trend charts
- Layer control
- Responsive dashboard layout

## Tech Stack

Use:

- Vue 3
- TypeScript
- Vite
- Pinia
- ECharts
- SCSS
- CSS Variables
- Mock data

For the first version, do not require a real weather API.

For the first version, the map can be simulated with SVG, Canvas, or positioned elements. MapLibre GL can be added later.

Do not use Three.js in the first version.

## Required Reading Before Coding

Before making changes, read these documents:

1. `docs/PRODUCT_REQUIREMENTS.md`
2. `docs/UI_DESIGN_SPEC.md`
3. `docs/VISUAL_STYLE_GUIDE.md`
4. `docs/COMPONENT_ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/INTERACTION_SPEC.md`
7. `docs/RESPONSIVE_SPEC.md`
8. `docs/CODEX_TASKS.md`

## Development Principles

- Keep the map as the visual center.
- Do not overuse decorative sci-fi effects.
- Do not turn the project into a basic weather app.
- Use mock data first.
- Keep components small and focused.
- Use TypeScript interfaces for all core weather data.
- Use Pinia for shared dashboard state.
- Use ECharts only through reusable chart components.
- Clean up timers, ECharts instances, and event listeners on component unmount.
- Use responsive layout rules from `docs/RESPONSIVE_SPEC.md`.

## UI Principles

- Use a dark professional dashboard style.
- Use translucent dark-blue panels.
- Keep the rainfall layer visually prominent.
- Use continuous rainfall bands, not administrative area blocks.
- Use meaningful colors for rainfall and alert levels.
- Do not use excessive glow, borders, or animated decorations.

## Validation

Before finishing a task, check:

- The page still works at 1920×1080.
- The page still works at 1440px width.
- TypeScript has no obvious errors.
- ECharts instances are disposed correctly.
- Intervals and event listeners are cleaned up.
- Components follow the documented structure.
```

---

# 2. docs/VISUAL_STYLE_GUIDE.md

这个文件专门放样式规范。以后你只需要对 Codex 说：

```txt
请严格按照 docs/VISUAL_STYLE_GUIDE.md 实现页面样式。
```

内容如下：

````md
# Visual Style Guide

## 1. Overall Style

RainScope uses a dark professional weather dashboard style.

The visual priority is:

1. Map
2. Rainfall layer
3. Weather alerts
4. Metrics
5. Charts
6. Decorative elements

Do not overuse sci-fi decorations. Avoid heavy neon lines, excessive glow, animated borders, or complex background grids.

The interface should look modern, calm, professional, and data-focused.

---

## 2. Color Tokens

Use CSS variables.

```scss
:root {
  --color-bg: #06111f;
  --color-bg-gradient-start: #07182b;
  --color-bg-gradient-end: #06111f;

  --color-panel: rgba(9, 26, 45, 0.88);
  --color-panel-strong: rgba(13, 33, 55, 0.94);
  --color-card: rgba(13, 33, 55, 0.88);

  --color-border: rgba(87, 164, 230, 0.28);
  --color-border-soft: rgba(87, 164, 230, 0.14);

  --color-text: #eef7ff;
  --color-text-secondary: #8ea6c1;
  --color-text-muted: #5f7894;

  --color-primary: #4ba3ff;
  --color-success: #37d67a;
  --color-warning: #facc15;
  --color-danger: #ef4444;

  --radius-card: 12px;
  --radius-panel: 14px;

  --shadow-panel: 0 12px 32px rgba(0, 0, 0, 0.28);
}
````

---

## 3. Page Background

Use this style for the main dashboard container:

```scss
.weather-dashboard {
  min-height: 100vh;
  background:
    radial-gradient(circle at 30% 10%, rgba(42, 136, 255, 0.14), transparent 32%),
    linear-gradient(180deg, var(--color-bg-gradient-start) 0%, var(--color-bg-gradient-end) 100%);
  color: var(--color-text);
}
```

---

## 4. Panel Style

All main panels should use:

```scss
.dashboard-panel {
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(12px);
}
```

Use panels for:

* Layer control
* Rainfall legend
* Station ranking
* Weather metrics
* Weather alerts
* Trend charts
* Timeline

---

## 5. Metric Card Style

```scss
.metric-card {
  background: linear-gradient(
    180deg,
    rgba(23, 52, 82, 0.88),
    rgba(10, 30, 52, 0.88)
  );
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  padding: 16px;
}
```

Metric value colors:

| Metric                 | Color     |
| ---------------------- | --------- |
| Rainfall               | `#37D67A` |
| Max rainfall intensity | `#F4D03F` |
| Temperature            | `#FF7A59` |
| Humidity               | `#4BA3FF` |
| Wind speed             | `#6DD3FF` |

---

## 6. Typography

Use:

```scss
font-family: Inter, "DIN Alternate", "PingFang SC", "Microsoft YaHei", sans-serif;
```

Typography scale:

| Element        | Size | Weight | Color     |
| -------------- | ---: | -----: | --------- |
| App title      | 24px |    700 | `#F1F7FF` |
| Section title  | 16px |    600 | `#EAF4FF` |
| Metric value   | 28px |    700 | dynamic   |
| Body text      | 14px |    400 | `#D8ECFF` |
| Secondary text | 13px |    400 | `#8EA6C1` |
| Helper text    | 12px |    400 | `#5F7894` |

---

## 7. Rainfall Color Scale

Use a continuous rainfall scale. Do not render rainfall as administrative blocks.

| Level         |   Value | Color                       |
| ------------- | ------: | --------------------------- |
| No rain       |       0 | `rgba(120, 160, 200, 0.12)` |
| Light rain    | 0.1–2.5 | `#4BA3FF`                   |
| Moderate rain |   2.5–8 | `#37D67A`                   |
| Heavy rain    |    8–16 | `#F4D03F`                   |
| Storm         |   16–32 | `#F59E42`                   |
| Severe storm  |   32–50 | `#E84C88`                   |
| Extreme storm |     >50 | `#9B5DE5`                   |

Default rainfall layer opacity:

```txt
70%
```

Rainfall layer requirements:

* Soft edges
* Blurred transition
* Semi-transparent overlay
* Must not fully cover the map
* Must update when timeline frame changes

---

## 8. Map Style

The map should be visually quiet.

| Element           | Style                       |
| ----------------- | --------------------------- |
| Map background    | Dark navy                   |
| District boundary | `rgba(180, 220, 255, 0.55)` |
| District name     | `#D8ECFF`                   |
| Water             | `#0B3A5C`                   |
| Roads             | `rgba(120, 160, 190, 0.18)` |
| Station point     | `#D9F6FF`                   |
| Active station    | `#FACC15`                   |

The map area should always be the largest visible area.

---

## 9. Alert Colors

| Level  | Main Color | Background             |
| ------ | ---------- | ---------------------- |
| Blue   | `#3B82F6`  | `rgba(59,130,246,.12)` |
| Yellow | `#FACC15`  | `rgba(250,204,21,.12)` |
| Orange | `#FB923C`  | `rgba(251,146,60,.12)` |
| Red    | `#EF4444`  | `rgba(239,68,68,.12)`  |

Alert cards should use a left border or vertical color bar.

---

## 10. Chart Style

Use ECharts with a dark theme.

General chart rules:

* Transparent chart background
* Weak axis lines
* Weak grid lines
* Clear tooltip
* Compact spacing
* No heavy 3D effects

Colors:

| Chart Series              | Color     |
| ------------------------- | --------- |
| Rainfall bar              | `#4BA3FF` |
| Accumulated rainfall line | `#A5F3FC` |
| Temperature line          | `#F59E42` |
| Humidity line             | `#60A5FA` |
| Wind speed line           | `#37D67A` |

Axis and grid:

```ts
axisLineColor: '#31506B'
splitLineColor: 'rgba(120, 160, 200, 0.12)'
textColor: '#8EA6C1'
```

---

## 11. Motion

Use restrained motion.

Allowed:

* Rainfall layer fade transition
* Timeline marker movement
* Station active pulse
* Chart tooltip transition

Avoid:

* Large animated borders
* Flashing panels
* Rotating backgrounds
* Excessive glow

````

---

# 3. docs/UI_DESIGN_SPEC.md

这个文件告诉 Codex 页面长什么样。

```md
# UI Design Spec

## 1. Target Page

Build a single-page weather visualization dashboard:

```txt
RainScope 深圳天气可视化大屏
````

The dashboard should focus on Shenzhen weather visualization.

---

## 2. Main Layout

Use a 1920×1080 dashboard layout as the primary design target.

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
  grid-template-columns: 300px 1fr 360px;
  grid-template-rows: 1fr 260px 96px;
  gap: 16px;
}
```

Header height:

```txt
72px
```

Page padding:

```txt
16px
```

---

## 3. Header

Header should include:

* Logo
* Project name: `RainScope`
* Subtitle: `深圳天气可视化大屏`
* City selector: `深圳市`
* Current weather: `中雨 29℃`
* Humidity: `82%`
* Wind speed: `5.2m/s`
* Pressure: `1005hPa`
* Update time: `2026-07-09 14:30:00`
* Refresh button
* Theme button

---

## 4. Left Panel

Left panel includes:

1. WeatherLayerPanel
2. WeatherLegend
3. WeatherStationRank

### Layer Control

Layers:

* 降雨雷达
* 预警区域
* 监测站点
* 风场流线
* 温度热力
* 湿度热力

For MVP:

* 降雨雷达: enabled by default
* 预警区域: enabled by default
* 监测站点: enabled by default
* 风场流线: UI only or disabled
* 温度热力: UI only or disabled
* 湿度热力: UI only or disabled

### Rainfall Legend

Show rainfall levels:

* 无雨
* 小雨
* 中雨
* 大雨
* 暴雨
* 大暴雨
* 特大暴雨

### Station Rank

Show 24h rainfall ranking:

* 大梧桐
* 罗湖
* 南山
* 福田
* 宝安

Clicking a station should highlight the station on the map.

---

## 5. Main Map

The map should be the visual center.

MVP map can be simulated with SVG, Canvas, or HTML elements.

The map should show:

* Shenzhen area
* District names
* District boundaries
* Rainfall radar layer
* Weather stations
* Alert area
* Map point popup
* Zoom controls
* Current frame time

District labels:

* 宝安区
* 南山区
* 福田区
* 罗湖区
* 龙华区
* 龙岗区
* 光明区
* 坪山区
* 大鹏新区
* 盐田区

Clicking the map should show a point weather popup.

---

## 6. Right Panel

Right panel includes:

1. WeatherMetricPanel
2. WeatherAlertPanel
3. RainDistributionChart

### Metrics

Display six metric cards:

* 1小时降雨
* 24小时降雨
* 最大雨强
* 当前温度
* 相对湿度
* 风速

### Alerts

Show two mock alerts:

* 暴雨黄色预警
* 雷雨大风蓝色预警

Clicking an alert should highlight the related alert area on the map.

### Distribution

Use ECharts donut chart to show rainfall level distribution.

---

## 7. Trend Chart Area

Trend chart area includes:

* Rainfall trend chart
* Temperature and humidity chart
* Wind speed chart

Use ECharts.

The charts should use compact dark-dashboard styling.

---

## 8. Timeline

Timeline includes:

* Play / pause button
* Next frame button
* Speed selector
* Frame marks
* Current frame marker
* Current label

Time range:

```txt
Past 2 hours + current + next 2 hours
```

Frame interval:

```txt
10 minutes
```

When the current frame changes:

* Header time updates
* Map rainfall layer updates
* Metric cards update
* Charts highlight current time

````

---

# 4. docs/CODEX_TASKS.md

这个文件让 Codex 按步骤做，不容易乱。

```md
# Codex Tasks

## Task 1: Static Layout

Create the static dashboard layout.

Requirements:

- Vue3 + TypeScript
- SCSS
- CSS Grid
- 1920×1080 first
- 1440px compatible
- No real API
- No real map
- Use mock text

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

## Task 3: Simulated Map and Rainfall Layer

Implement the first map version.

Requirements:

- Simulated Shenzhen map
- District labels
- Rainfall blobs
- Station points
- Alert area
- Point popup

Acceptance:

- Rainfall layer looks continuous
- Rainfall opacity is controlled by layer store
- Station click works
- Map click shows popup

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
````

---

# 5. 你以后给 Codex 的提示词可以很短

有了这些文档后，你不需要每次写一大堆。可以这样说：

```txt
请先阅读 AGENTS.md 和 docs 目录下的项目文档，然后实现 Task 1：天气可视化大屏静态布局。严格遵守 docs/UI_DESIGN_SPEC.md 和 docs/VISUAL_STYLE_GUIDE.md，不要自由发挥视觉风格。
```

或者：

```txt
请根据 docs/VISUAL_STYLE_GUIDE.md 优化当前页面样式。不要改变组件结构，不要新增业务功能，只处理颜色、间距、卡片、字体、图表视觉和地图区域样式。
```

或者：

```txt
请根据 docs/CODEX_TASKS.md 执行 Task 3，实现模拟深圳地图和连续降雨图层。不要接真实地图 API，不要使用 Three.js。
```

---

# 6. 最推荐的落地方式

你可以先创建这些文件：

```txt
AGENTS.md
docs/UI_DESIGN_SPEC.md
docs/VISUAL_STYLE_GUIDE.md
docs/CODEX_TASKS.md
```

先不必一次性写太多文档。第一版够用了。

等代码生成后，再补：

```txt
docs/DATA_MODEL.md
docs/COMPONENT_ARCHITECTURE.md
docs/INTERACTION_SPEC.md
docs/RESPONSIVE_SPEC.md
```

这样 Codex 会更稳定：
**AGENTS.md 管方向，docs 管细节，提示词只下达当前任务。**

[1]: https://developers.openai.com/codex/guides/agents-md?utm_source=chatgpt.com "Custom instructions with AGENTS.md – Codex"
[2]: https://openai.com/index/introducing-codex/?utm_source=chatgpt.com "Introducing Codex"
