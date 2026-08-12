# UI Design Spec — Dashboard V2

## 1. Authority

This document describes the current RainScope Dashboard V2 UI.

`docs/DASHBOARD_LAYOUT_V2_SPEC.md` is the authoritative layout acceptance document. If an older document or screenshot conflicts with Dashboard V2, the V2 specification wins.

`docs/image.png` is a **legacy V1 reference** and must not be used to require the old permanent left layer/legend stack, old right metric/distribution stack, or old trend placement.

## 2. Product goal

RainScope is a professional Shenzhen weather-operations dashboard. The interface should be compact, restrained and information-led rather than decorative.

The radar map is the absolute visual center. Side panels support the map and must not compete with it.

Primary desktop validation sizes:

- 1920×1080
- 1536×1024
- 1440×900

## 3. Dashboard V2 layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                     │
├──────────────┬──────────────────────────────────────────┬──────────────────┤
│ Rain summary │ Strong-rain risk banner                  │ Weather alerts   │
│ +            ├──────────────────────────────────────────┤                  │
│ Station TOP3 │                  Radar map               ├──────────────────┤
│              │                                          │ Impact areas     │
├──────────────┴──────────────────────────────────────────┴──────────────────┤
│ Trend · 全市 — Rainfall | Temperature/Humidity | Wind                     │
├────────────────────────────────────────────────────────────────────────────┤
│ Timeline                                                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

Desktop grid intent:

```scss
grid-template-columns:
  clamp(270px, 19vw, 310px)
  minmax(0, 1fr)
  clamp(300px, 20vw, 340px);

grid-template-areas:
  "left center right"
  "trend trend trend"
  "timeline timeline timeline";
```

The exact compact values may change at 1440–1600px, but the middle column must remain wider than either side column.

## 4. Header

Header stays single-line on supported desktop widths.

Left group:

- RainScope logo and name
- DEMO tag
- 深圳市
- current weather + temperature
- humidity
- wind speed

Right group:

- green data-health indicator
- current update time
- refresh icon
- menu icon

Rules:

- `深圳市` must never wrap on desktop;
- use weak vertical separators between information groups;
- do not reintroduce pressure or duplicated weather metrics solely to fill space;
- icon actions remain visually secondary to weather status.

## 5. Left auxiliary column

The left column contains only high-value rainfall information.

### Rain summary

One shared panel with three horizontal metrics:

- 1h rainfall
- 24h rainfall
- maximum rain intensity

Numbers carry the highest visual weight. Units and labels are secondary. Do not split the three values into nested cards.

### Station TOP3

Show the three stations with the highest current 24h rainfall from the existing station data.

Each row contains:

- station name;
- rainfall value;
- thin relative progress indicator.

Station names must remain horizontally readable. Clicking a station keeps the existing map-selection behavior.

## 6. Central map area

The center contains:

1. compact strong-rain risk banner;
2. existing MapLibre/deck.gl map;
3. radar dBZ legend inside the map;
4. map interaction controls;
5. floating full layer controls.

### Risk banner

Derive affected area and active-alert counts from current alert data. Do not invent data just to match a mockup.

### Map implementation

Keep the current MapLibre GL + deck.gl architecture and behavior.

Do not change as part of layout work:

- radar algorithm;
- wind-field algorithm;
- MapLibre initialization semantics;
- timeline-to-radar frame behavior;
- store data meaning.

The basemap remains subdued and dark. Radar, stations and alert information must remain visually dominant.

### Radar legend

Display a compact horizontal dBZ scale inside the lower part of the map. It should not be a large independent card and must not obscure critical district labels.

### Layer control

The full existing controls must remain reachable from a floating map-layer entry:

- 降雨雷达
- 预警区域
- 监测站点
- 风场流线
- 温度热力
- 湿度热力

Opacity controls remain linked to the enabled state of their respective layers. When a layer is disabled, its opacity control remains disabled.

## 7. Right risk column

The right column contains two panels only.

### Weather Alert

Show active alert count plus compact alert rows. Each row retains:

- alert icon;
- title;
- active/resolved state;
- affected district summary;
- issue time;
- detail action.

Alert detail and map-focus behavior remain available.

### Impact Area

Derive unique impact areas from currently active alert data. Display up to the most relevant four rows in the dashboard summary.

Use small semantic risk colors rather than large colored backgrounds.

## 8. Trend · 全市

Trend is one full-width panel, not a center-column-only card.

It contains three chart regions in one row:

1. rainfall;
2. temperature / humidity;
3. wind speed.

Use subtle vertical dividers. Do not create three nested dashboard cards.

Existing chart data and current-time markers remain authoritative.

## 9. Timeline

Timeline spans the full dashboard width and preserves the current data model:

- play / pause;
- frame stepping;
- playback speed;
- frame rail;
- current marker;
- current/forecast state.

Do not introduce fake 1h/3h/6h behavior until the timeline data model supports those ranges. Visual resemblance must not override truthful interaction semantics.

## 10. Visual style

Use `docs/VISUAL_STYLE_GUIDE.md` for tokens and detailed styling. Dashboard V2 additionally requires:

- restrained borders;
- minimal glow;
- limited backdrop blur;
- no card-inside-card decoration unless needed for interaction;
- warning/danger colors only for meaningful states;
- side panels remain visually quieter than the map;
- dense but readable information spacing.

## 11. Validation

Before merge:

- `pnpm verify` passes;
- `pnpm test:e2e` passes;
- 1920×1080, 1536×1024 and 1440×900 Chromium screenshots are inspected manually;
- no horizontal overflow exists at the three desktop widths;
- Header and city selector remain one line;
- center map is wider than both side columns;
- full layer popover remains usable;
- dynamic wind evidence is inspected in full Chromium QA when available.
