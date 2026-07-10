<template>
  <section class="dashboard-panel timeline-panel">
    <div class="timeline-panel__controls">
      <button class="timeline-panel__play" type="button" aria-label="播放">▶</button>
      <button type="button" aria-label="下一帧">▸|</button>
      <button type="button">1x⌄</button>
    </div>

    <div class="timeline-panel__rail" aria-label="时间轴">
      <div class="timeline-panel__track">
        <span class="timeline-panel__progress"></span>
        <span class="timeline-panel__forecast"></span>
        <span class="timeline-panel__marker">
          <i></i>
          <strong>当前</strong>
        </span>
      </div>
      <div class="timeline-panel__ticks">
        <span v-for="time in times" :key="time">{{ time }}</span>
      </div>
    </div>

    <div class="timeline-panel__quick">
      <button type="button">‹ 近小时</button>
      <button type="button">逐10分钟 ›</button>
    </div>
  </section>
</template>

<script setup lang="ts">
const times = ['12:30', '12:40', '12:50', '13:00', '13:10', '13:20', '13:30', '13:40', '14:00', '14:10', '14:20', '14:30', '14:40', '15:00', '15:20', '15:40', '16:00', '16:20', '16:30'];
</script>
