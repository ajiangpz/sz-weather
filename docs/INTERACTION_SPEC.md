# Interaction Spec

## 1. Layer Control

Users can toggle:

- 降雨雷达
- 预警区域
- 监测站点

The following layers can appear as disabled or UI-only in the MVP:

- 风场流线
- 温度热力
- 湿度热力

Rainfall opacity should be adjustable through store state even if the first UI only uses a fixed value.
The reference screen shows opacity sliders in the layer panel. Enabled visual layers should expose opacity controls when practical.

## 2. Station Interaction

Clicking a station in the station ranking should:

- Set the active station id.
- Highlight the station on the map.
- Optionally open a station popup.

Clicking a station point on the map should use the same active station state.

## 3. Alert Interaction

Clicking an alert card should:

- Set the active alert id.
- Highlight the related alert area on the map.
- Keep alert styling consistent with its warning level.

## 4. Map Click

Clicking the map background should show a point weather popup.

The popup should include:

- Location label or approximate coordinate
- Current frame time
- Rainfall level
- Rainfall intensity
- 1-hour rainfall
- Temperature
- Humidity
- Wind speed
- Wind direction
- Alert title when relevant

## 5. Timeline

The timeline should support:

- Play
- Pause
- Next frame
- Previous frame
- Speed selection
- Current frame marker
- Current frame label
- Past/current/forecast visual distinction

Frame range:

- Past 2 hours
- Current time
- Next 2 hours

Frame interval:

- 10 minutes

When the current frame changes:

- Header update time changes.
- Map rainfall layer changes.
- Metrics update.
- Charts highlight the current time.

Timeline should match the reference screen: a full-width bottom rail with a large play button, compact speed selector, 10-minute marks, a bright current-time marker, and right-side quick controls.

## 6. Cleanup Rules

Components must clean up:

- Timeline intervals
- ECharts instances
- Window resize listeners
- MapLibre map instances
- Map event listeners registered manually
