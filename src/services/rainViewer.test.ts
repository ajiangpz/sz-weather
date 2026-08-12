import { describe, expect, it } from 'vitest';

import {
  RAINVIEWER_METADATA_URL,
  buildRainViewerTileTemplate,
  createRainViewerSnapshot,
  findNearestRainViewerFrame,
  parseShenzhenTimestamp,
} from './rainViewer';

const frames = [
  { time: 1786524000, path: '/v2/radar/frame-a' },
  { time: 1786524600, path: '/v2/radar/frame-b' },
  { time: 1786525200, path: '/v2/radar/frame-c' },
];

describe('RainViewer radar adapter', () => {
  it('uses the public Weather Maps metadata endpoint', () => {
    expect(RAINVIEWER_METADATA_URL).toBe('https://api.rainviewer.com/public/weather-maps.json');
  });

  it('normalizes and sorts past radar frames', () => {
    const snapshot = createRainViewerSnapshot({
      generated: 1786525800,
      host: 'https://tilecache.rainviewer.com',
      radar: { past: [...frames].reverse() },
    }, new Date('2026-08-12T09:30:00Z'));

    expect(snapshot.frames.map((frame) => frame.path)).toEqual([
      '/v2/radar/frame-a',
      '/v2/radar/frame-b',
      '/v2/radar/frame-c',
    ]);
    expect(snapshot.source).toBe('RainViewer');
  });

  it('parses timezone-less forecast timestamps as Shenzhen time', () => {
    expect(parseShenzhenTimestamp('2026-08-12T17:00')).toBe(Date.parse('2026-08-12T09:00:00Z'));
    expect(parseShenzhenTimestamp('2026-08-12T09:00:00Z')).toBe(Date.parse('2026-08-12T09:00:00Z'));
  });

  it('uses radar only when a frame is near the selected Timeline timestamp', () => {
    const current = findNearestRainViewerFrame(frames, '2026-08-12T17:10', 12 * 60);
    expect(current?.path).toBe('/v2/radar/frame-c');

    const future = findNearestRainViewerFrame(frames, '2026-08-12T18:00', 12 * 60);
    expect(future).toBeNull();
  });

  it('builds the documented 256px Universal Blue tile template', () => {
    expect(buildRainViewerTileTemplate('https://tilecache.rainviewer.com', frames[0]))
      .toBe('https://tilecache.rainviewer.com/v2/radar/frame-a/256/{z}/{x}/{y}/2/1_0.png');
  });
});
