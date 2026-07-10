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

For the first version, keep the existing MapLibre GL + OSM tile implementation if it is already present.
The map must still follow the RainScope visual direction: dark professional dashboard style, visually quiet basemap, prominent rainfall layer, and no generic weather-query UI.
Do not introduce a real weather API in the first version.

Do not use Three.js in the first version.

## Documentation Source

`chatGPT.md` is a seed/reference document for the project documentation structure.
When it conflicts with later project decisions, follow the current project documents and direct user instructions.
The current map decision is to keep MapLibre GL + OSM for the first implementation milestone and restyle it to match RainScope.

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
