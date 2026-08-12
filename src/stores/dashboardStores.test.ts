import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockStations } from '@/mock/weather';
import { useLayerStore } from './layerStore';
import { useMapStore } from './mapStore';
import { useTimelineStore } from './timelineStore';

describe('dashboard stores', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('keeps documented layer defaults in shared state', () => {
    const layers = useLayerStore();
    expect(layers.radarEnabled).toBe(true);
    expect(layers.radarOpacity).toBe(70);
    expect(layers.alertOpacity).toBe(60);
    expect(layers.windEnabled).toBe(true);
    expect(layers.windOpacity).toBe(38);
  });

  it('classifies and wraps timeline frames', () => {
    const timeline = useTimelineStore();
    timeline.setFrame(0);
    expect(timeline.currentFramePhase).toBe('past');
    timeline.stepFrame(-1);
    expect(timeline.currentFrameIndex).toBe(24);
    expect(timeline.currentFramePhase).toBe('forecast');
    timeline.setFrame(12);
    expect(timeline.currentFrameTime).toBe('14:30');
    expect(timeline.currentFramePhase).toBe('current');
  });

  it('uses real forecast labels when a live timeline is hydrated', () => {
    const timeline = useTimelineStore();
    const times = Array.from({ length: 25 }, (_, index) => `${String(9 + Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`);
    timeline.setFrameTimes(times, 12);

    expect(timeline.currentFrameIndex).toBe(12);
    expect(timeline.currentFrameTime).toBe(times[12]);
    timeline.stepFrame(1);
    expect(timeline.currentFramePhase).toBe('forecast');
    timeline.setFrame(0);
    timeline.stepFrame(-1);
    expect(timeline.currentFrameIndex).toBe(24);
  });

  it('creates a typed popup when selecting a station', () => {
    const map = useMapStore();
    const station = mockStations[0];
    map.selectStation(station);
    expect(map.activeStationId).toBe(station.id);
    expect(map.popup?.label).toContain(station.name);
    expect(map.popup?.rainfall1h).toBe(station.rainfall1h);
  });
});
