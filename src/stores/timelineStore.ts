import { defineStore } from 'pinia';

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    currentFrameIndex: 12,
    isPlaying: false,
    playbackSpeed: 1 as 1 | 2 | 4,
  }),
  getters: {
    currentFrameTime(state) {
      const totalMinutes = 12 * 60 + 30 + state.currentFrameIndex * 10;
      return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    },
    currentFramePhase(state): 'past' | 'current' | 'forecast' {
      if (state.currentFrameIndex < 12) return 'past';
      if (state.currentFrameIndex > 12) return 'forecast';
      return 'current';
    },
  },
  actions: {
    setFrame(index: number) {
      this.currentFrameIndex = Math.max(0, Math.min(24, index));
    },
    stepFrame(delta: number) {
      const next = this.currentFrameIndex + delta;
      this.currentFrameIndex = next > 24 ? 0 : next < 0 ? 24 : next;
    },
    cyclePlaybackSpeed() {
      this.playbackSpeed = this.playbackSpeed === 1 ? 2 : this.playbackSpeed === 2 ? 4 : 1;
    },
  },
});
