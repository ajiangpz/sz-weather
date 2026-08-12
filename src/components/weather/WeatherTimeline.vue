<template>
  <section class="dashboard-panel timeline-panel">
    <div class="timeline-panel__controls">
      <button class="timeline-panel__play" type="button" :aria-label="store.isPlaying ? '暂停' : '播放'" @click="togglePlayback">
        <UiIcon :name="store.isPlaying ? 'pause' : 'play'" />
      </button>
      <div class="timeline-panel__transport" aria-label="时间轴步进控制">
        <button class="timeline-panel__step timeline-panel__step--previous" type="button" aria-label="上一帧" @click="store.stepFrame(-1)"><UiIcon name="step" /></button>
        <button class="timeline-panel__step" type="button" aria-label="下一帧" @click="store.stepFrame(1)"><UiIcon name="step" /></button>
        <button class="timeline-panel__speed" type="button" aria-label="播放速度" @click="store.cyclePlaybackSpeed()"><span>{{ store.playbackSpeed }}x</span><UiIcon name="chevron-down" /></button>
      </div>
    </div>

    <div class="timeline-panel__rail" aria-label="时间轴">
      <div class="timeline-panel__meta" aria-hidden="true">
        <span>过去</span>
        <strong>{{ store.currentFrameTime }}</strong>
        <span>预报</span>
      </div>
      <div class="timeline-panel__track">
        <span class="timeline-panel__past"></span>
        <span class="timeline-panel__forecast-zone"></span>
        <span class="timeline-panel__progress" :class="`timeline-panel__progress--${store.currentFramePhase}`" :style="{ width: `${progress}%` }"></span>
        <span class="timeline-panel__forecast" :style="{ left: `${anchorProgress}%` }"></span>
        <span class="timeline-panel__marker" :style="{ left: `${progress}%` }">
          <i></i>
          <span class="timeline-panel__marker-phase">{{ phaseLabel }}</span>
          <strong>{{ store.currentFrameTime }}</strong>
        </span>
      </div>
      <div class="timeline-panel__ticks">
        <button v-for="(time, index) in times" :key="`${time}-${index}`" type="button" :class="{ active: index === store.currentFrameIndex, past: index < store.currentFrameAnchorIndex, current: index === store.currentFrameAnchorIndex, forecast: index > store.currentFrameAnchorIndex }" :aria-label="`${phaseName(index)} ${time}`" @click="store.setFrame(index)">
          {{ time }}
        </button>
      </div>
    </div>

    <div class="timeline-panel__quick">
      <button type="button" @click="store.stepFrame(-1)"><UiIcon name="chevron-left" />近时次</button>
      <button type="button" @click="store.stepFrame(1)">逐15分钟<UiIcon name="chevron-right" /></button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useTimelineStore } from '@/stores/timelineStore';
import UiIcon from './UiIcon.vue';

const store = useTimelineStore();
const fallbackTimes = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 12 * 60 + 30 + index * 10;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
});
const times = computed(() => store.frameTimes.length > 0 ? store.frameTimes : fallbackTimes);
const progress = computed(() => (store.currentFrameIndex / Math.max(1, times.value.length - 1)) * 100);
const anchorProgress = computed(() => (store.currentFrameAnchorIndex / Math.max(1, times.value.length - 1)) * 100);
const phaseLabel = computed(() => ({ past: '过去', current: '当前', forecast: '预报' })[store.currentFramePhase]);
const phaseName = (index: number) => index < store.currentFrameAnchorIndex ? '过去时刻' : index > store.currentFrameAnchorIndex ? '预报时刻' : '当前时刻';
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
.timeline-panel__controls {
  gap: 8px;
}

.timeline-panel__controls button {
  border-color: rgba(126, 183, 222, 0.13);
  background: rgba(5, 22, 37, 0.62);
  color: #9fb9ca;
}

.timeline-panel__play {
  width: 40px;
  height: 40px !important;
  flex: 0 0 40px;
  border: 1px solid rgba(67, 172, 247, 0.34) !important;
  border-radius: 50% !important;
  background: rgba(31, 117, 179, 0.24) !important;
  color: #e4f4ff !important;
  box-shadow: inset 0 0 0 1px rgba(75, 163, 255, 0.035), 0 6px 18px rgba(0, 6, 12, 0.14);
}

.timeline-panel__play:hover {
  border-color: rgba(83, 184, 255, 0.54) !important;
  background: rgba(37, 137, 207, 0.32) !important;
}

.timeline-panel__play .ui-icon {
  width: 18px;
  height: 18px;
}

.timeline-panel__transport {
  display: flex;
  height: 34px;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(126, 183, 222, 0.12);
  border-radius: 8px;
  background: rgba(4, 19, 32, 0.45);
}

.timeline-panel__transport button {
  height: 32px !important;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.timeline-panel__transport button + button {
  border-left: 1px solid rgba(126, 183, 222, 0.10);
}

.timeline-panel__transport button:hover {
  background: rgba(49, 125, 177, 0.13);
  color: #e7f4fc;
}

.timeline-panel__step {
  width: 31px;
  padding: 0;
}

.timeline-panel__step .ui-icon {
  width: 15px;
  height: 15px;
}

.timeline-panel__speed {
  min-width: 47px;
  gap: 3px;
  padding-inline: 7px;
  color: #a8c0cf !important;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.timeline-panel__speed .ui-icon {
  width: 11px;
  height: 11px;
}

.timeline-panel__rail {
  position: relative;
  padding-top: 8px;
}

.timeline-panel__meta {
  position: absolute;
  top: -10px;
  right: 0;
  left: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  pointer-events: none;
}

.timeline-panel__meta span {
  color: #60798b;
  font-size: 9px;
  letter-spacing: 0.04em;
}

.timeline-panel__meta span:last-child {
  text-align: right;
}

.timeline-panel__meta strong {
  padding: 2px 7px;
  border: 1px solid rgba(74, 167, 232, 0.12);
  border-radius: 999px;
  background: rgba(31, 106, 158, 0.08);
  color: #8fc7ea;
  font-size: 9px;
  font-weight: 550;
  font-variant-numeric: tabular-nums;
}

.timeline-panel__track {
  height: 3px;
  border-radius: 999px;
  background: rgba(92, 132, 160, 0.16);
}

.timeline-panel__past,
.timeline-panel__forecast-zone {
  opacity: 0.56;
}

.timeline-panel__forecast {
  width: 1px;
  top: -3px;
  bottom: -3px;
  background: rgba(127, 180, 215, 0.28);
}

.timeline-panel__progress {
  height: 3px;
  border-radius: 999px;
  box-shadow: none;
}

.timeline-panel__progress--past {
  background: rgba(96, 156, 199, 0.68);
}

.timeline-panel__progress--current {
  background: #42aaf1;
}

.timeline-panel__progress--forecast {
  background: linear-gradient(90deg, rgba(72, 162, 223, 0.76), rgba(76, 190, 244, 0.92));
}

.timeline-panel__marker {
  top: 50%;
  display: flex;
  min-width: 54px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 6px;
  border: 1px solid rgba(79, 178, 242, 0.24);
  border-radius: 6px;
  background: rgba(4, 24, 39, 0.92);
  box-shadow: 0 6px 18px rgba(0, 5, 10, 0.18);
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.timeline-panel__marker i {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: #4ab4f5;
  box-shadow: 0 0 0 3px rgba(74, 180, 245, 0.08);
}

.timeline-panel__marker-phase {
  color: #7698ad;
  font-size: 8px;
}

.timeline-panel__marker strong {
  color: #deeff9;
  font-size: 9px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.timeline-panel__ticks {
  margin-top: 9px;
}

.timeline-panel__ticks button {
  color: #657e90;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  transition: color 120ms ease, opacity 120ms ease;
}

.timeline-panel__ticks button.past {
  opacity: 0.62;
}

.timeline-panel__ticks button.forecast {
  color: #779bb2;
}

.timeline-panel__ticks button.current,
.timeline-panel__ticks button.active {
  color: #dceef9;
  opacity: 1;
}

.timeline-panel__quick button {
  height: 34px !important;
  border-color: rgba(126, 183, 222, 0.11) !important;
  background: rgba(5, 22, 37, 0.44) !important;
  color: #819baa !important;
  font-size: 10px;
}

.timeline-panel__quick button:hover {
  border-color: rgba(91, 177, 236, 0.22) !important;
  background: rgba(35, 92, 132, 0.15) !important;
  color: #c4dbe8 !important;
}

@media (min-width: 1321px) and (max-width: 1600px) {
  .timeline-panel__play {
    width: 36px;
    height: 36px !important;
    flex-basis: 36px;
  }

  .timeline-panel__transport {
    height: 32px;
  }

  .timeline-panel__transport button {
    height: 30px !important;
  }

  .timeline-panel__meta {
    top: -8px;
  }

  .timeline-panel__marker {
    padding-inline: 5px;
  }
}
</style>
