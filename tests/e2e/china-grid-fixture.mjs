export const GRID_COLUMNS = 12;
export const GRID_ROWS = 8;
export const GRID_BOUNDS = { west: 73.4, east: 135.2, south: 18.0, north: 53.8 };

export const createTimeline = (startText = '2026-08-12T13:00:00+08:00') => {
  const start = new Date(startText);
  return Array.from({ length: 25 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    const chinaTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 16);
  });
};

export const createChinaGridPoints = () => Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
  const row = Math.floor(index / GRID_COLUMNS);
  const column = index % GRID_COLUMNS;
  return {
    longitude: GRID_BOUNDS.west + (GRID_BOUNDS.east - GRID_BOUNDS.west) * column / (GRID_COLUMNS - 1),
    latitude: GRID_BOUNDS.south + (GRID_BOUNDS.north - GRID_BOUNDS.south) * row / (GRID_ROWS - 1),
  };
});

export const createReferencePayload = (times, overrides = {}) => ({
  timezone: 'Asia/Shanghai',
  current: { time: times[12] },
  minutely_15: {
    time: times,
    temperature_2m: times.map((_, index) => 28 + index * 0.04),
    relative_humidity_2m: times.map((_, index) => 74 - index * 0.1),
    precipitation: times.map(() => 0.1),
    weather_code: times.map(() => 61),
    wind_speed_10m: times.map((_, index) => 3.4 + index * 0.02),
    wind_direction_10m: times.map(() => 270),
    surface_pressure: times.map((_, index) => 1005 + index * 0.02),
    ...overrides,
  },
});

export const createChinaGridPayload = (times, createFields) => createChinaGridPoints().map((point, pointIndex) => {
  const column = pointIndex % GRID_COLUMNS;
  const row = Math.floor(pointIndex / GRID_COLUMNS);
  return {
    ...point,
    current: { time: times[12] },
    minutely_15: {
      time: times,
      ...createFields({ pointIndex, column, row, times }),
    },
  };
});

export const defaultGridFields = ({ column, row, times }) => ({
  wind_speed_10m: times.map((_, frameIndex) => 3.5 + column * 0.08 + frameIndex * 0.01),
  wind_direction_10m: times.map(() => 265 + row * 3),
  precipitation: times.map(() => 0.08),
  temperature_2m: times.map((_, frameIndex) => 12 + row * 2.5 + column * 0.55 + frameIndex * 0.03),
  relative_humidity_2m: times.map((_, frameIndex) => 84 - row * 2.2 - column * 0.8 - frameIndex * 0.08),
  surface_pressure: times.map((_, frameIndex) => 1000 + column * 0.35 + row * 0.2 + frameIndex * 0.02),
});
