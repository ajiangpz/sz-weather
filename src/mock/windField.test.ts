import { describe, expect, it } from 'vitest';

import { createMockWindStreams } from './windField';

describe('mock wind field', () => {
  it('creates stable streamlines inside the Shenzhen map area', () => {
    const streams = createMockWindStreams(12);
    expect(streams).toHaveLength(216);
    expect(streams.every((stream) => stream.path.length >= 8 && stream.path.length <= 37)).toBe(true);
    expect(streams.flatMap((stream) => stream.path).every(([longitude, latitude]) =>
      longitude >= 113.66 && longitude <= 114.76 && latitude >= 22.3 && latitude <= 22.96,
    )).toBe(true);
  });

  it('moves the wind field when the timeline frame changes', () => {
    expect(createMockWindStreams(11)[0].path).not.toEqual(createMockWindStreams(13)[0].path);
  });
});
