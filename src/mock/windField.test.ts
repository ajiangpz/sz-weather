import { describe, expect, it } from 'vitest';

import { createMockWindStreams } from './windField';

describe('mock wind field', () => {
  it('creates stable streamlines inside the Shenzhen map area', () => {
    const streams = createMockWindStreams(12);
    expect(streams).toHaveLength(30);
    expect(streams.every((stream) => stream.path.length === 7)).toBe(true);
    expect(streams.flatMap((stream) => stream.path).every(([longitude, latitude]) =>
      longitude >= 113.7 && longitude <= 114.7 && latitude >= 22.4 && latitude <= 22.9,
    )).toBe(true);
  });

  it('moves the wind field when the timeline frame changes', () => {
    expect(createMockWindStreams(11)[0].path).not.toEqual(createMockWindStreams(13)[0].path);
  });
});
