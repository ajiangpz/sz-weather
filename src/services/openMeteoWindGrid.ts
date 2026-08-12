export const WIND_GRID_SOURCE = 'Open-Meteo Best Match wind grid';
export const WIND_GRID_COLUMNS = 5;
export const WIND_GRID_ROWS = 3;
export const WIND_GRID_BOUNDS = {
  west: 113.64,
  east: 114.78,
  south: 22.28,
  north: 22.98,
} as const;

const PAST_FRAME_COUNT = 12;
const FUTURE_FRAME_COUNT = 12;
const FRAME_COUNT = PAST_FRAME_COUNT + 1 + FUTURE_FRAME_COUNT;

export interface WindGridPoint {
  longitude: number;
  latitude: number;
}

export interface WindGridSample extends WindGridPoint {
  speed: number;
  direction: number;
  u: number;
  v: number;
}

export interface WindGridFrame {
  timestamp: string;
  time: string;
  samples: WindGridSample[];
}

export interface LiveWindGridSnapshot {
  source: typeof WIND_GRID_SOURCE;
  fetchedAt: Date;
  currentIndex: number;
  frames: WindGridFrame[];
}

interface OpenMeteoWindLocationResponse {
  latitude?: number;
  longitude?: number;
  current?: { time?: string };
  minutely_15?: {
    time?: string[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
  };
}

const round = (value: number, digits = 4) => Number(value.toFixed(digits));

export const createWindGridPoints = (): WindGridPoint[] => Array.from(
  { length: WIND_GRID_COLUMNS * WIND_GRID_ROWS },
  (_, index) => {
    const row = Math.floor(index / WIND_GRID_COLUMNS);
    const column = index % WIND_GRID_COLUMNS;
    const longitudeRatio = column / (WIND_GRID_COLUMNS - 1);
    const latitudeRatio = row / (WIND_GRID_ROWS - 1);
    return {
      longitude: round(WIND_GRID_BOUNDS.west + (WIND_GRID_BOUNDS.east - WIND_GRID_BOUNDS.west) * longitudeRatio),
      latitude: round(WIND_GRID_BOUNDS.south + (WIND_GRID_BOUNDS.north - WIND_GRID_BOUNDS.south) * latitudeRatio),
    };
  },
);

export const meteorologicalWindToVector = (speed: number, direction: number) => {
  const radians = direction * Math.PI / 180;
  return {
    u: -speed * Math.sin(radians),
    v: -speed * Math.cos(radians),
  };
};

export const buildOpenMeteoWindGridUrl = () => {
  const points = createWindGridPoints();
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', points.map((point) => point.latitude).join(','));
  url.searchParams.set('longitude', points.map((point) => point.longitude).join(','));
  url.searchParams.set('minutely_15', 'wind_speed_10m,wind_direction_10m');
  url.searchParams.set('current', 'wind_speed_10m');
  url.searchParams.set('past_minutely_15', String(PAST_FRAME_COUNT));
  url.searchParams.set('forecast_minutely_15', String(FUTURE_FRAME_COUNT + 1));
  url.searchParams.set('timezone', 'Asia/Shanghai');
  url.searchParams.set('wind_speed_unit', 'ms');
  url.searchParams.set('cell_selection', 'nearest');
  return url.toString();
};

const requireSeries = (series: number[] | undefined, name: string, expectedLength: number) => {
  if (!series || series.length !== expectedLength || series.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid Open-Meteo wind series: ${name}`);
  }
  return series;
};

export const createWindGridSnapshot = (
  payload: OpenMeteoWindLocationResponse[],
  fetchedAt = new Date(),
): LiveWindGridSnapshot => {
  const expectedPoints = createWindGridPoints();
  if (!Array.isArray(payload) || payload.length !== expectedPoints.length) {
    throw new Error(`Open-Meteo wind grid returned ${payload?.length ?? 0} locations; expected ${expectedPoints.length}`);
  }

  const firstTimes = payload[0]?.minutely_15?.time;
  if (!firstTimes || firstTimes.length < FRAME_COUNT) {
    throw new Error('Open-Meteo wind grid returned insufficient timeline frames');
  }

  const exactCurrentIndex = payload[0]?.current?.time ? firstTimes.indexOf(payload[0].current.time) : -1;
  const currentRawIndex = exactCurrentIndex >= 0 ? exactCurrentIndex : firstTimes.length - (FUTURE_FRAME_COUNT + 1);
  const startIndex = currentRawIndex - PAST_FRAME_COUNT;
  const endIndex = currentRawIndex + FUTURE_FRAME_COUNT;
  if (startIndex < 0 || endIndex >= firstTimes.length) {
    throw new Error('Open-Meteo wind grid does not cover the required timeline window');
  }

  const locations = payload.map((location, locationIndex) => {
    const times = location.minutely_15?.time;
    if (!times || times.length !== firstTimes.length || times.some((time, index) => time !== firstTimes[index])) {
      throw new Error(`Open-Meteo wind grid timeline mismatch at location ${locationIndex}`);
    }
    return {
      point: expectedPoints[locationIndex],
      speeds: requireSeries(location.minutely_15?.wind_speed_10m, `speed-${locationIndex}`, firstTimes.length),
      directions: requireSeries(location.minutely_15?.wind_direction_10m, `direction-${locationIndex}`, firstTimes.length),
    };
  });

  const frames = Array.from({ length: FRAME_COUNT }, (_, frameIndex): WindGridFrame => {
    const rawIndex = startIndex + frameIndex;
    return {
      timestamp: firstTimes[rawIndex],
      time: firstTimes[rawIndex].slice(11, 16),
      samples: locations.map(({ point, speeds, directions }) => {
        const speed = speeds[rawIndex];
        const direction = directions[rawIndex];
        const { u, v } = meteorologicalWindToVector(speed, direction);
        return {
          ...point,
          speed: round(speed, 2),
          direction: round(direction, 1),
          u: round(u, 4),
          v: round(v, 4),
        };
      }),
    };
  });

  return {
    source: WIND_GRID_SOURCE,
    fetchedAt,
    currentIndex: PAST_FRAME_COUNT,
    frames,
  };
};

export const fetchShenzhenWindGrid = async (timeoutMs = 6000): Promise<LiveWindGridSnapshot> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildOpenMeteoWindGridUrl(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo wind grid request failed with ${response.status}`);
    }
    const payload = await response.json() as OpenMeteoWindLocationResponse[];
    return createWindGridSnapshot(payload);
  } finally {
    window.clearTimeout(timeout);
  }
};
