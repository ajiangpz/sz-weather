import { describe, expect, it } from 'vitest';

import { WIND_GRID_BOUNDS } from '@/services/openMeteoWindGrid';
import { createMockWindStreams } from './windField';

describe('mock wind field', () => {
  it('creates a denser national field while preserving the explicit baseline density', () => {
    const streams = createMockWindStreams(12);
    expect(streams).toHaveLength(374);
    expect(createMockWindStreams(12, 1)).toHaveLength(300);
    expect(streams.every((stream) => stream.path.length >= 8 && stream.path.length <= 35)).toBe(true);
    expect(streams.flatMap((stream) => stream.path).every(([longitude, latitude]) =>
      longitude >= WIND_GRID_BOUNDS.west
      && longitude <= WIND_GRID_BOUNDS.east
      && latitude >= WIND_GRID_BOUNDS.south
      && latitude <= WIND_GRID_BOUNDS.north,
    )).toBe(true);
  });

  it('moves the wind field when the timeline frame changes', () => {
    expect(createMockWindStreams(11)[0].path).not.toEqual(createMockWindStreams(13)[0].path);
  });
});
