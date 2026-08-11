<template>
  <section class="dashboard-panel timeline-panel">
    <div class="timeline-panel__controls">
      <button class="timeline-panel__play" type="button" :aria-label="store.isPlaying ? '暂停' : '播放'" @click="togglePlayback">
        <UiIcon :name="store.isPlaying ? 'pause' : 'play'" />
      </button>
      <button class="timeline-panel__step timeline-panel__step--previous" type="button" aria-label="上一帧" @click="store.stepFrame(-1)"><UiIcon name="step" /></button>
      <button class="timeline-panel__step" type="button" aria-label="下一帧" @click="store.stepFrame(1)"><UiIcon name="step" /></button>
      <button class="timeline-panel__speed" type="button" aria-label="播放速度" @click="store.cyclePlaybackSpeed()"><span>{{ store.playbackSpeed }}x</span><UiIcon name="chevron-down" /></button>
    </div>

    <div class="timeline-panel__rail" aria-label="时间轴">
      <div class="timeline-panel__track">
        <span class="timeline-panel__past"></span>
        <span class="timeline-panel__forecast-zone"></span>
        <span class="timeline-panel__progress" :class="`timeline-panel__progress--${store.currentFramePhase}`" :style="{ width: `${progress}%` }"></span>
        <span class="timeline-panel__forecast" :style="{ left: '50%' }"></span>
        <span class="timeline-panel__marker" :style="{ left: `${progress}%` }">
          <i></i><strong>{{ phaseLabel }}</strong>
        </span>
      </div>
      <div class="timeline-panel__ticks">
        <button v-for="(time, index) in times" :key="time" type="button" :class="{ active: index === store.currentFrameIndex, past: index < 12, current: index === 12, forecast: index > 12 }" :aria-label="`${phaseName(index)} ${time}`" @click="store.setFrame(index)">
          {{ time }}
        </button>
      </div>
    </div>

    <div class="timeline-panel__quick">
      <button type="button" @click="store.stepFrame(-1)"><UiIcon name="chevron-left" />近小时</button>
      <button type="button" @click="store.stepFrame(1)">逐10分钟<UiIcon name="chevron-right" /></button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useTimelineStore } from '@/stores/timelineStore';
import UiIcon from './UiIcon.vue';

const store = useTimelineStore();
const times = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 12 * 60 + 30 + index * 10;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
});
const progress = computed(() => (store.currentFrameIndex / (times.length - 1)) * 100);
const phaseLabel = computed(() => ({ past: '过去', current: '当前', forecast: '预报' })[store.currentFramePhase]);
const phaseName = (index: number) => index < 12 ? '过去时刻' : index > 12 ? '预报时刻' : '当前时刻';
let playbackTimer: ReturnType<typeof setInterval> | null = null;

const stopTimer = () => {
  if (playbackTimer) clearInterval(playbackTimer);
  playbackTimer = null;
};

const startTimer = () => {
  stopTimer();
  playbackTimer = setInterval(() => store.stepFrame(1), 1200 / store.playbackSpeed);
};

const togglePlayback = () => {
  store.isPlaying = !store.isPlaying;
};

watch(() => [store.isPlaying, store.playbackSpeed], () => {
  if (store.isPlaying) startTimer(); else stopTimer();
});

onBeforeUnmount(stopTimer);
</script>

<style scoped>
.timeline-panel__controls button {
  border-color: rgba(87, 164, 230, 0.24);
  background: rgba(13, 33, 55, 0.82);
  color: #b9d8f4;
}

.timeline-panel__play {
  width: 42px;
  height: 42px !important;
  border-color: rgba(75, 163, 255, 0.55) !important;
  border-radius: 10px !important;
  background: rgba(45, 139, 238, 0.24) !important;
  color: #dff1ff !important;
  box-shadow: inset 0 0 0 1px rgba(75, 163, 255, 0.08);
}

.timeline-panel__play .ui-icon {
  width: 21px;
  height: 21px;
}

.timeline-panel__step .ui-icon {
  width: 18px;
  height: 18px;
}

.timeline-panel__speed {
  min-width: 54px;
}
</style>
