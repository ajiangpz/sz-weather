import { describe, expect, it } from 'vitest';
import { mockAlerts } from './alerts';

describe('weather alert mock data', () => {
  it('provides typed active alerts with distinct affected areas', () => {
    expect(mockAlerts).toHaveLength(2);
    expect(mockAlerts.every((alert) => alert.status === 'active')).toBe(true);
    expect(new Set(mockAlerts.map((alert) => alert.id)).size).toBe(mockAlerts.length);
    expect(mockAlerts.find((alert) => alert.id === 'rain-yellow')?.affectedAreas).toContain('罗湖区');
    expect(mockAlerts.find((alert) => alert.id === 'wind-blue')?.affectedAreas).toContain('珠江口海域');
  });
});
