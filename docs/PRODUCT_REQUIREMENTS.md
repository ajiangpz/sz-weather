# Product Requirements

## 1. Product Name

RainScope

## 2. Product Goal

Build a portfolio-level Shenzhen weather visualization dashboard.

RainScope is not a normal weather query app. It should feel like a professional data visualization cockpit focused on rainfall monitoring, alert awareness, timeline playback, and trend analysis.

## 3. MVP Scope

The first version should include:

- Dark dashboard layout
- Map-centered rainfall visualization
- A first-screen composition matching `docs/image.png`
- MapLibre GL + OSM raster tile map
- Rainfall radar overlay
- Weather station points
- Weather alert area
- Layer control panel
- Rainfall legend
- Station rainfall ranking
- Metric cards
- ECharts trend charts
- Timeline playback with mock frames
- Responsive layout

The first version should not include:

- Real weather API integration
- User login
- Historical data query pages
- Search-oriented city weather lookup
- Three.js scenes
- Heavy sci-fi decoration

## 4. Core User Story

As a portfolio reviewer or dashboard user, I want to open RainScope and immediately understand the rainfall situation in Shenzhen, including where rain is strongest, which stations are most affected, what alerts are active, and how conditions change over time.

## 5. Visual Priority

The visual hierarchy is:

1. Map
2. Rainfall layer
3. Weather alerts
4. Metrics
5. Charts
6. Decorative elements

## 6. Data Strategy

Use mock data for the MVP.

Mock data should be structured as if it came from a real API, so a real backend can be added later without rewriting components.

## 7. Current Map Decision

The current project already contains a MapLibre GL + OSM tile implementation.

Keep it for the current milestone, but restyle it so it matches the RainScope visual direction:

- Dark dashboard surface
- Quiet basemap
- Prominent rainfall overlay
- Clear weather station points
- Dashboard-style controls and legends

The map can be replaced by a custom simulated Shenzhen map later if needed.

## 8. Success Criteria

- The first viewport clearly reads as RainScope 深圳天气可视化大屏.
- The map is the largest and most important visual region.
- The overall screen composition should follow `docs/image.png`: header at top, left control column, central map and trend area, right metrics/alerts/distribution column, and full-width timeline at bottom.
- Rainfall is immediately visible and uses meaningful colors.
- All dashboard data comes from mock data and Pinia stores.
- Timeline changes update map, header, metrics, and charts.
- The page works at 1920x1080 and remains usable at 1440px.
