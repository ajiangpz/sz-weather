import { describe, expect, it } from 'vitest';

import { createMockWindStreams } from './windField';

describe('mock wind field', () => {
  it('creates stable streamlines inside the Shenzhen map area', () => {
    const streams = createMockWindStreams(12);
    expect(streams).toHaveLength(160);
    expect(streams.every((stream) => stream.path.length === 15)).toBe(true);
    expect(streams.flatMap((stream) => stream.path).every(([longitude, latitude]) =>
      longitude >= 113.68 && longitude <= 114.9 && latitude >= 22.2 && latitude <= 22.95,
    )).toBe(true);
  });

  it('moves the wind field when the timeline frame changes', () => {
    expect(createMockWindStreams(11)[0].path).not.toEqual(createMockWindStreams(13)[0].path);
  });
});
