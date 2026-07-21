import type { WindStream } from '@/types/weather';

const roundCoordinate = (value: number) => Number(value.toFixed(4));

export const createMockWindStreams = (frameIndex: number): WindStream[] => {
  const phase = (frameIndex - 12) * 0.12;
  const columns = 16;
  const rows = 10;

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const startLongitude = 113.7 + column * 0.061 + Math.sin(row * 1.7 + phase) * 0.009;
    const startLatitude = 22.39 + row * 0.052 + Math.cos(column * 0.8 + phase) * 0.008;
    const speed = Number((2.2 + ((index * 7 + frameIndex * 3) % 42) / 10).toFixed(1));
    const path: Array<[number, number]> = [[roundCoordinate(startLongitude), roundCoordinate(startLatitude)]];
    let longitude = startLongitude;
    let latitude = startLatitude;

    for (let pointIndex = 1; pointIndex < 15; pointIndex += 1) {
      const broadWave = Math.sin((longitude - 113.72) * 8.4 + row * 0.34 + phase) * 0.3;
      const coastalTurn = Math.cos((latitude - 22.4) * 13 - column * 0.22 - phase) * 0.2;
      const angle = 0.08 + broadWave + coastalTurn;
      const step = 0.0125 + speed * 0.00075;
      longitude += Math.cos(angle) * step;
      latitude += Math.sin(angle) * step * 0.68;
      path.push([roundCoordinate(longitude), roundCoordinate(latitude)]);
    }

    const [first, second] = path;
    const bearing = Math.atan2(second[1] - first[1], second[0] - first[0]) * 180 / Math.PI;
    return { id: `wind-${index}`, speed, bearing: Number(bearing.toFixed(1)), path };
  });
};
