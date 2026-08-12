# RainScope Dashboard Layout V2

## Status

This document is the desktop layout baseline for the RainScope Dashboard V2 redesign.

The redesign replaces the previous layout where the sidebars extended beside the trend area. The V2 desktop hierarchy is:

1. Header
2. Left auxiliary area | Central risk banner + radar map | Right risk area
3. Full-width trend area
4. Full-width timeline

The central radar map is always the primary visual focus.

## Desktop grid

For desktop widths of 1440px and above, retain a three-column first row. The middle column must be wider than either side column.

```text
Header

Left auxiliary | Risk banner + Radar map | Weather alert + Impact area

Full-width Trend

Full-width Timeline
```

Required validation viewports:

- 1920×1080
- 1536×1024
- 1440×900

At all three viewports:

- no horizontal page overflow;
- Header stays on one line;
- `深圳市` stays on one line;
- the central map is wider than the left and right columns;
- Trend stays in one full-width row;
- Timeline stays in one full-width row;
- core dashboard content remains visible in the first screen.

## Header

Left group:

- RainScope brand
- DEMO tag
- 深圳市
- weather condition + temperature
- humidity
- wind speed

Right group:

- data status
- update time
- refresh action
- menu action

Use weak dividers rather than card containers between metrics.

## Left auxiliary area

The left column contains only high-value rainfall information:

- 1h rainfall
- 24h rainfall
- maximum rainfall intensity
- Station rainfall TOP3

The three rainfall metrics are one shared panel, not three nested cards.

Station ranking uses compact horizontal progress indicators. Station names and values must remain horizontally readable.

## Central area

The central area contains:

- compact strong-rain risk banner;
- existing MapLibre/deck.gl weather map;
- radar dBZ legend inside the map area;
- map controls.

The V2 layout must not rewrite the radar algorithm, wind-field algorithm, MapLibre initialization or data-store semantics.

The complete existing layer controls remain available through a floating map-layer entry. Radar, alert, station, wind, temperature and humidity controls must not be lost during the redesign. Disabled opacity controls must continue to follow their layer-enabled state.

## Right risk area

Top: Weather Alert.

Bottom: Impact Area.

Use compact rows and restrained warning colors. Avoid cards nested inside cards.

Impact-area rows are derived from current alert data. Do not invent business data solely to match a visual mockup.

## Trend

Trend is one full-width panel containing three sections:

1. Rainfall
2. Temperature / Humidity
3. Wind speed

Use subtle vertical dividers rather than three independent cards.

## Timeline

Timeline spans the dashboard width. Preserve the existing playback state and frame stepping behavior. Controls should remain compact and subordinate to the map.

Do not introduce range controls whose behavior is unsupported by the current timeline data model merely to imitate a screenshot.

## Visual direction

- professional weather operations dashboard;
- restrained navy background;
- low-opacity borders;
- minimal glow;
- restrained blur;
- no decorative sci-fi treatment;
- warning/danger colors used only where semantically necessary;
- map remains the absolute visual center.

## Scope discipline

Allowed:

- component re-composition;
- layout and responsive CSS;
- moving existing controls into overlays;
- new presentational components for risk banner / impact area;
- visual hierarchy and spacing changes;
- E2E assertions that validate the new design intent.

Not in scope:

- radar algorithm changes;
- wind algorithm changes;
- MapLibre/deck.gl architecture changes;
- unrelated data-model changes;
- replacing the chart library;
- weakening tests solely to make CI pass.

## Acceptance

- [ ] Header is single-line at 1920×1080, 1536×1024 and 1440×900.
- [ ] `深圳市` never wraps at supported desktop widths.
- [ ] Central map width is greater than left and right column widths.
- [ ] Left column contains rainfall summary and Station TOP3 only.
- [ ] Strong-rain risk banner sits above the map.
- [ ] Radar dBZ legend is integrated into the map area.
- [ ] Complete layer controls remain available from a map overlay.
- [ ] Weather Alert is at upper right.
- [ ] Impact Area is at lower right.
- [ ] Trend spans the full dashboard width and keeps three chart sections on one row.
- [ ] Timeline spans the full dashboard width.
- [ ] No horizontal overflow at all three desktop validation widths.
- [ ] Map, radar, wind, alert and station layers continue to render.
- [ ] Layer enabled/disabled and opacity controls keep correct state behavior.
- [ ] `pnpm verify` passes.
- [ ] `pnpm test:e2e` passes.
- [ ] Real Chromium artifacts are manually inspected before merge.
- [ ] Full-mode Chromium QA with dynamic wind frames is completed before final merge when available.
