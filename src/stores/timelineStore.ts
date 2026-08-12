import { defineStore } from 'pinia';

const DEFAULT_FRAME_COUNT = 25;
const DEFAULT_ANCHOR_INDEX = 12;

const createFallbackTime = (index: number) => {
  const totalMinutes = 12 * 60 + 30 + index * 10;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
};

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    currentFrameIndex: DEFAULT_ANCHOR_INDEX,
    currentFrameAnchorIndex: DEFAULT_ANCHOR_INDEX,
    frameTimes: [] as string[],
    isPlaying: false,
    playbackSpeed: 1 as 1 | 2 | 4,
  }),
  getters: {
    frameCount(state) {
      return state.frameTimes.length || DEFAULT_FRAME_COUNT;
    },
    currentFrameTime(state) {
      return state.frameTimes[state.currentFrameIndex] ?? createFallbackTime(state.currentFrameIndex);
    },
    currentFramePhase(state): 'past' | 'current' | 'forecast' {
      if (state.currentFrameIndex < state.currentFrameAnchorIndex) return 'past';
      if (state.currentFrameIndex > state.currentFrameAnchorIndex) return 'forecast';
      return 'current';
    },
  },
  actions: {
    setFrame(index: number) {
      this.currentFrameIndex = Math.max(0, Math.min(this.frameCount - 1, index));
    },
    setFrameTimes(times: string[], currentIndex = DEFAULT_ANCHOR_INDEX) {
      if (times.length === 0) return;
      this.frameTimes = [...times];
      this.currentFrameAnchorIndex = Math.max(0, Math.min(times.length - 1, currentIndex));
      this.currentFrameIndex = this.currentFrameAnchorIndex;
    },
    stepFrame(delta: number) {
      const next = this.currentFrameIndex + delta;
      const lastIndex = this.frameCount - 1;
      this.currentFrameIndex = next > lastIndex ? 0 : next < 0 ? lastIndex : next;
    },
    cyclePlaybackSpeed() {
      this.playbackSpeed = this.playbackSpeed === 1 ? 2 : this.playbackSpeed === 2 ? 4 : 1;
    },
  },
});
