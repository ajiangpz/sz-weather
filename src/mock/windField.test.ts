import { describe, expect, it } from 'vitest';

import { createMockWindStreams } from './windField';

describe('mock wind field', () => {
  it('creates a denser default field while preserving the explicit baseline density', () => {
    const streams = createMockWindStreams(12);
    expect(streams).toHaveLength(414);
    expect(createMockWindStreams(12, 1)).toHaveLength(300);
    expect(streams.every((stream) => stream.path.length >= 8 && stream.path.length <= 35)).toBe(true);
    expect(streams.flatMap((stream) => stream.path).every(([longitude, latitude]) =>
      longitude >= 113.64 && longitude <= 114.78 && latitude >= 22.28 && latitude <= 22.98,
    )).toBe(true);
  });

  it('moves the wind field when the timeline frame changes', () => {
    expect(createMockWindStreams(11)[0].path).not.toEqual(createMockWindStreams(13)[0].path);
  });
});
