import type { WindStream } from '@/types/weather';

const roundCoordinate = (value: number) => Number(value.toFixed(4));

export const createMockWindStreams = (frameIndex: number): WindStream[] => {
  const phase = (frameIndex - 12) * 0.18;

  return Array.from({ length: 30 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const startLongitude = 113.78 + column * 0.145 + Math.sin(row + phase) * 0.012;
    const startLatitude = 22.46 + row * 0.078 + Math.cos(column * 0.7 + phase) * 0.009;
    const speed = Number((2.4 + ((index * 7 + frameIndex * 3) % 37) / 10).toFixed(1));
    const bearing = 18 + Math.sin(index * 0.72 + phase) * 24;
    const bearingRadians = bearing * Math.PI / 180;

    return {
      id: `wind-${index}`,
      speed,
      bearing: Number(bearing.toFixed(1)),
      path: Array.from({ length: 7 }, (__, pointIndex) => {
        const distance = pointIndex * (0.018 + speed * 0.0012);
        const curve = Math.sin(pointIndex * 0.82 + index * 0.43 + phase) * 0.006;
        return [
          roundCoordinate(startLongitude + Math.cos(bearingRadians) * distance - Math.sin(bearingRadians) * curve),
          roundCoordinate(startLatitude + Math.sin(bearingRadians) * distance + Math.cos(bearingRadians) * curve),
        ] as [number, number];
      }),
    };
  });
};
