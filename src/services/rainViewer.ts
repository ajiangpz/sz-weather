export const RAINVIEWER_METADATA_URL = 'https://api.rainviewer.com/public/weather-maps.json';
export const RAINVIEWER_SOURCE = 'RainViewer';
export const RAINVIEWER_ATTRIBUTION_URL = 'https://www.rainviewer.com/';
export const RAINVIEWER_COLOR_SCHEME = 2;
export const RAINVIEWER_MAX_ZOOM = 7;
export const RAINVIEWER_TILE_SIZE = 256;

export interface RainViewerRadarFrame {
  time: number;
  path: string;
}

export interface RainViewerRadarSnapshot {
  source: typeof RAINVIEWER_SOURCE;
  generatedAt: number;
  host: string;
  frames: RainViewerRadarFrame[];
  fetchedAt: Date;
}

interface RainViewerWeatherMapsResponse {
  version?: string;
  generated?: number;
  host?: string;
  radar?: {
    past?: Array<{ time?: number; path?: string }>;
  };
}

const SHENZHEN_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

export const parseShenzhenTimestamp = (timestamp: string) => {
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(timestamp)) {
    const parsed = Date.parse(timestamp);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid timestamp: ${timestamp}`);
    return parsed;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(timestamp);
  if (!match) throw new Error(`Invalid Shenzhen timestamp: ${timestamp}`);
  const [, year, month, day, hour, minute, second = '0'] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ) - SHENZHEN_UTC_OFFSET_MS;
};

export const createRainViewerSnapshot = (
  payload: RainViewerWeatherMapsResponse,
  fetchedAt = new Date(),
): RainViewerRadarSnapshot => {
  if (!payload.host || !payload.host.startsWith('https://')) {
    throw new Error('RainViewer response has an invalid tile host');
  }
  if (!Number.isFinite(payload.generated)) {
    throw new Error('RainViewer response has an invalid generated timestamp');
  }

  const frames = (payload.radar?.past ?? []).map((frame, index) => {
    if (!Number.isFinite(frame.time) || !frame.path || !frame.path.startsWith('/')) {
      throw new Error(`RainViewer response has an invalid radar frame at index ${index}`);
    }
    return { time: frame.time as number, path: frame.path };
  }).sort((a, b) => a.time - b.time);

  if (frames.length === 0) {
    throw new Error('RainViewer response contains no past radar frames');
  }

  return {
    source: RAINVIEWER_SOURCE,
    generatedAt: payload.generated as number,
    host: payload.host,
    frames,
    fetchedAt,
  };
};

export const findNearestRainViewerFrame = (
  frames: RainViewerRadarFrame[],
  targetTimestamp: string,
  toleranceSeconds = 12 * 60,
): RainViewerRadarFrame | null => {
  if (frames.length === 0) return null;
  const targetSeconds = Math.round(parseShenzhenTimestamp(targetTimestamp) / 1000);
  const nearest = frames.reduce((best, frame) => (
    Math.abs(frame.time - targetSeconds) < Math.abs(best.time - targetSeconds) ? frame : best
  ));
  return Math.abs(nearest.time - targetSeconds) <= toleranceSeconds ? nearest : null;
};

export const buildRainViewerTileTemplate = (
  host: string,
  frame: RainViewerRadarFrame,
) => `${host}${frame.path}/${RAINVIEWER_TILE_SIZE}/{z}/{x}/{y}/${RAINVIEWER_COLOR_SCHEME}/1_0.png`;

export const fetchRainViewerRadar = async (timeoutMs = 5000): Promise<RainViewerRadarSnapshot> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(RAINVIEWER_METADATA_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`RainViewer request failed with ${response.status}`);
    }
    return createRainViewerSnapshot(await response.json() as RainViewerWeatherMapsResponse);
  } finally {
    window.clearTimeout(timeout);
  }
};
