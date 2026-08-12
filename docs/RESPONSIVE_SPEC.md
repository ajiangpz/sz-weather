# Responsive Spec — Dashboard V2

## 1. Authoritative desktop baseline

Dashboard V2 replaces the legacy V1 layout guidance. Use `docs/DASHBOARD_LAYOUT_V2_SPEC.md` together with this document.

`docs/image.png` is a legacy V1 screenshot and is not authoritative for V2 panel placement.

Primary desktop validation viewports:

- 1920×1080
- 1536×1024
- 1440×900

## 2. Desktop layout: 1440px and wider

All supported desktop widths keep the same semantic structure:

```text
Header

Left auxiliary | Center risk banner + map | Right risk panels

Full-width Trend

Full-width Timeline
```

Required behavior:

- three main columns remain on one row;
- map is wider than each side column;
- Trend spans all three columns;
- Timeline spans all three columns;
- Header stays one line;
- 深圳市 stays one line;
- no horizontal page overflow;
- core dashboard remains visible in the first screen.

Current wide-desktop intent:

```scss
grid-template-columns:
  clamp(270px, 19vw, 310px)
  minmax(0, 1fr)
  clamp(300px, 20vw, 340px);

grid-template-rows:
  minmax(0, 1fr)
  clamp(185px, 21vh, 205px)
  72px;
```

For approximately 1321–1600px, compact the side columns, gaps, paddings and secondary typography before changing the three-column structure.

## 3. 1920×1080

This is the widest validation target.

- allow generous central map width;
- keep side columns restrained;
- maintain full single-line Header spacing;
- Trend remains one row with three chart regions;
- Timeline remains one row.

Do not stretch side panels merely to consume empty space.

## 4. 1536×1024

This is the primary density target for Dashboard V2.

- preserve the same first-screen composition as 1920;
- reduce horizontal gaps and side-panel padding where useful;
- map remains dominant;
- floating layer popover must fit inside the map/center area without creating page overflow.

## 5. 1440×900

This is the minimum required desktop V2 width.

Must retain:

- Header single-line;
- three-column main row;
- full-width one-row Trend;
- full-width one-row Timeline;
- readable station names;
- readable alert titles;
- usable layer popover;
- no horizontal scroll.

Allowed compaction:

- smaller side columns;
- smaller gaps;
- 1–2px reduction in secondary typography;
- reduced panel padding;
- smaller non-primary icon buttons.

Not allowed:

- moving either side column below the map;
- wrapping Trend into multiple rows;
- wrapping Timeline controls into multiple rows;
- hiding core weather status to solve Header width issues.

## 6. Below desktop target

Below the required desktop range, progressive reflow is allowed.

### 1024–1320px

- keep map high in the page;
- allow a two-column layout;
- move secondary risk/auxiliary content below the map where necessary;
- keep Trend and Timeline full-width;
- avoid horizontal overflow.

### Tablet portrait / mobile

- map stays near the top after Header;
- stack secondary panels;
- reduce chart height;
- simplify Timeline density;
- avoid dense desktop table-like layouts.

Mobile behavior is not permitted to compromise the required 1440+ desktop composition.

## 7. Map rule

Map remains the primary visual element at every breakpoint.

Do not bury the map below metric panels or charts.

## 8. Overflow rule

No supported layout may require page-level horizontal scrolling.

Interactive popovers may scroll internally when their content cannot fit vertically, but must remain inside the viewport.

## 9. Automated checks

Chromium E2E should validate at all three desktop widths:

- dashboard exists;
- left, center and right regions exist;
- center width > left width;
- center width > right width;
- document scrollWidth <= clientWidth + 1;
- city label has one text rect and `white-space: nowrap`;
- Trend and Timeline are visible;
- screenshots are saved for visual inspection.
