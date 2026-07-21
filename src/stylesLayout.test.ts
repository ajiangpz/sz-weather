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
});
