# Responsive Spec

## 1. Primary Target

Design first for 1920x1080.

The dashboard should also work well at 1440px width because that is a common development and review size.

## 2. Desktop Layout

For 1440px and wider:

- Header stays at the top.
- Left panel, map, and right panel are visible in one row.
- Map is the largest visible region.
- Trend charts sit below the main row.
- Timeline sits at the bottom.
- The desktop layout should resemble `docs/image.png`.

Recommended layout:

```scss
.weather-dashboard__body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 390px;
  grid-template-rows: minmax(0, 1fr) 260px 96px;
  gap: 16px;
}
```

At 1920x1080, the right metrics panel should support a 2-column metric grid, and the center trend panel should support three chart regions.

## 3. 1024px Layout

At tablet landscape width:

- Keep the map near the top.
- Move left and right panels into a two-column area below or beside the map.
- Keep charts compact.
- Avoid horizontal overflow.
- If there is not enough width for both side columns, stack right-panel content below the map before secondary left-panel content.

## 4. 768px Layout

At tablet portrait width:

- Use a single-column layout.
- Show map first after the header.
- Stack layer controls, metrics, alerts, and charts.
- Timeline can use fewer visible frame marks.

## 5. 375px Layout

At mobile width:

- Keep the map usable and visible near the top.
- Collapse secondary panels into compact sections.
- Reduce chart height.
- Simplify timeline controls to play/pause, next, and current label.
- Avoid dense table-like layouts.
- Hide nonessential header chips before wrapping the header into multiple crowded rows.

## 6. Map Rule

The map remains the primary visual element at every breakpoint.

On small screens, do not bury the map below metrics or charts.

## 7. Overflow Rule

No dashboard section should require horizontal scrolling at supported breakpoints.

Text should wrap before it overflows. Numeric metric values can reduce slightly in size on small screens.
