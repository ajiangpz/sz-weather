import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

const findRule = (selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styles.match(new RegExp(`${escapedSelector}\\s*{[\\s\\S]*?}`));

  return match?.[0] ?? '';
};

describe('dashboard layout styles', () => {
  it('keeps the map as the dominant desktop column', () => {
    expect(findRule('.weather-dashboard__body')).toContain('grid-template-columns: 260px minmax(0, 1fr) 340px;');
  });

  it('keeps the map wide on 1440px-class desktop viewports', () => {
    const compactDesktopRule = styles.match(/@media \(max-width: 1600px\)[\s\S]*?\.weather-dashboard__body\s*{[\s\S]*?}/)?.[0] ?? '';

    expect(compactDesktopRule).toContain('grid-template-columns: 240px minmax(0, 1fr) 320px;');
  });

  it('uses a radar-specific brand signature instead of a generic circular badge', () => {
    expect(findRule('.weather-header__logo')).toContain('border-radius: 14px;');
    expect(findRule('.weather-header__logo::before')).toContain('border-radius: 50%;');
    expect(findRule('.weather-header__logo::after')).toContain('transform: rotate(-28deg);');
  });

  it('provides keyboard focus and reduced-motion safeguards', () => {
    expect(styles).toContain('button:focus-visible');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('compacts the full telemetry header before the tablet breakpoint', () => {
    const narrowDesktopRule = styles.match(/@media \(min-width: 1201px\) and \(max-width: 1320px\)[\s\S]*?\.weather-header\s*{[\s\S]*?}/)?.[0] ?? '';

    expect(narrowDesktopRule).toContain('grid-template-columns: 210px 112px 210px minmax(270px, 1fr) 168px 126px;');
  });

  it('keeps the playback-speed chevron from collapsing inside the compact timeline', () => {
    expect(findRule('.timeline-panel__speed .ui-icon')).toContain('flex: 0 0 13px;');
  });

  it('applies compact right-panel content at 1440px-class short viewports', () => {
    const compactHeightRule = styles.match(/@media \(min-width: 1201px\) and \(max-width: 1500px\) and \(max-height: 950px\)[\s\S]*?\.metric-card i \.weather-icon\s*{[\s\S]*?}/)?.[0] ?? '';

    expect(compactHeightRule).toContain('width: 20px;');
    expect(compactHeightRule).toContain('height: 20px;');
  });
});
