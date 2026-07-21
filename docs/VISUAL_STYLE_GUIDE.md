# Visual Style Guide

## 1. Overall Style

RainScope uses a dark professional weather dashboard style.
`docs/image.png` is the primary visual reference for the first dashboard pass.
The image is a 1536×1024 effect reference and should guide the dashboard's density, proportions, and first-screen hierarchy.

The visual priority is:

1. Map
2. Rainfall layer
3. Weather alerts
4. Metrics
5. Charts
6. Decorative elements

Do not overuse sci-fi decorations. Avoid heavy neon lines, excessive glow, animated borders, or complex background grids.

The interface should look modern, calm, professional, and data-focused.
The reference image uses dense operational-dashboard spacing. Keep panels compact, readable, and data-forward.

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
```

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

- Layer control
- Rainfall legend
- Station ranking
- Weather metrics
- Weather alerts
- Trend charts
- Timeline

Panel guidance from the reference:

- Panels should use dark translucent navy fills.
- Borders should be visible but soft.
- Section headers should be compact and aligned to the top-left.
- Use thin separators inside panels instead of nested cards where possible.
- Avoid oversized cards that reduce map space.

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

| Metric | Color |
| --- | --- |
| Rainfall | `#37D67A` |
| Max rainfall intensity | `#F4D03F` |
| Temperature | `#FF7A59` |
| Humidity | `#4BA3FF` |
| Wind speed | `#6DD3FF` |

Metric cards in the right panel should appear as compact 2-column cards.
Use large values, small labels, muted units, and small semantic icons.

## 6. Typography

Use:

```scss
font-family: Inter, "DIN Alternate", "PingFang SC", "Microsoft YaHei", sans-serif;
```

Typography scale:

| Element | Size | Weight | Color |
| --- | ---: | ---: | --- |
| App title | 24px | 700 | `#F1F7FF` |
| Section title | 16px | 600 | `#EAF4FF` |
| Metric value | 28px | 700 | dynamic |
| Body text | 14px | 400 | `#D8ECFF` |
| Secondary text | 13px | 400 | `#8EA6C1` |
| Helper text | 12px | 400 | `#5F7894` |

## 7. Rainfall Color Scale

Use a continuous rainfall scale. Do not render rainfall as administrative blocks.

| Level | Value | Color |
| --- | ---: | --- |
| No rain | 0 | `rgba(120, 160, 200, 0.12)` |
| Light rain | 0.1-2.5 | `#4BA3FF` |
| Moderate rain | 2.5-8 | `#37D67A` |
| Heavy rain | 8-16 | `#F4D03F` |
| Storm | 16-32 | `#F59E42` |
| Severe storm | 32-50 | `#E84C88` |
| Extreme storm | >50 | `#9B5DE5` |

Default rainfall layer opacity:

```txt
70%
```

Rainfall layer requirements:

- Soft edges
- Blurred transition
- Semi-transparent overlay
- Must not fully cover the map
- Must update when timeline frame changes
- On the `deckGL` branch, render the rainfall layer with deck.gl over the MapLibre base map.
- Use deck.gl blending, opacity, and data-driven color to keep radar bands continuous rather than blocky.
- Match the reference image's radar texture: broad translucent precipitation fields plus high-density irregular fragments and stronger warm-color cores.

## 8. Map Style

The map should be visually quiet.

| Element | Style |
| --- | --- |
| Map background | Dark navy |
| District boundary | `rgba(180, 220, 255, 0.55)` |
| District name | `#D8ECFF` |
| Water | `#0B3A5C` |
| Roads | `rgba(120, 160, 190, 0.18)` |
| Station point | `#D9F6FF` |
| Active station | `#FACC15` |

The map area should always be the largest visible area.

For the current MapLibre + OSM implementation:

- OSM tiles should be darkened and desaturated through layer paint settings, overlays, or CSS filters.
- Street and label detail should be secondary to rainfall data.
- Map controls should be visually integrated with dark panels where practical.
- District boundaries should be thin cyan-white strokes.
- District labels should be readable over rainfall overlays.
- Rainfall should appear as soft, semi-transparent radar bands rather than hard rectangular polygons.
- Use blue and cyan for low intensity, green and yellow for mid intensity, and orange/red/purple for strong rainfall.
- Popup panels should use the same dark translucent card style as the dashboard.
- Map zoom buttons should be square, compact, and placed on the right edge of the map.
- deck.gl radar overlays should sit visually above the basemap but below popups, controls, station emphasis, and active-alert emphasis.
- If using point aggregation, tune radius/intensity per zoom so the radar reads as a weather field, not as isolated dots.
- If using polygon/isoband data, soften edges through alpha, overlapping bands, and restrained blur-like layering instead of hard administrative fills.
- If using a generated bitmap radar frame, keep the image transparent outside rainfall areas and preserve the same rainfall color scale.

## 9. Alert Colors

| Level | Main Color | Background |
| --- | --- | --- |
| Blue | `#3B82F6` | `rgba(59,130,246,.12)` |
| Yellow | `#FACC15` | `rgba(250,204,21,.12)` |
| Orange | `#FB923C` | `rgba(251,146,60,.12)` |
| Red | `#EF4444` | `rgba(239,68,68,.12)` |

Alert cards should use a left border or vertical color bar.

## 10. Chart Style

Use ECharts with a dark theme.

General chart rules:

- Transparent chart background
- Weak axis lines
- Weak grid lines
- Clear tooltip
- Compact spacing
- No heavy 3D effects
- Dashboard charts should be dense enough to fit three chart groups in the bottom center panel at desktop size.

Colors:

| Chart Series | Color |
| --- | --- |
| Rainfall bar | `#4BA3FF` |
| Accumulated rainfall line | `#A5F3FC` |
| Temperature line | `#F59E42` |
| Humidity line | `#60A5FA` |
| Wind speed line | `#37D67A` |

Axis and grid:

```ts
axisLineColor: '#31506B'
splitLineColor: 'rgba(120, 160, 200, 0.12)'
textColor: '#8EA6C1'
```

## 11. Motion

Use restrained motion.

Allowed:

- Rainfall layer fade transition
- Timeline marker movement
- Station active pulse
- Chart tooltip transition

Avoid:

- Large animated borders
- Flashing panels
- Rotating backgrounds
- Excessive glow

## 12. Reference Screen Notes

The first implementation should visually resemble `docs/image.png`:

- Dark navy page background.
- Top header with brand, city, current weather, metric chips, update time, and actions.
- Left column: 图层控制, 降雨强度图例, 监测站点.
- Center: large MapLibre map with deck.gl rainfall radar overlay, district labels, popup, map controls, and scale bar.
- Center bottom: 趋势分析 panel with compact ECharts.
- Right column: 实时指标, 天气预警, 降雨强度分布.
- Bottom: full-width playback timeline.
- At the 1536×1024 reference size, all of the above should fit in one viewport with no vertical scrolling.

Do not copy every pixel mechanically. Match the composition, density, color mood, and dashboard hierarchy.
