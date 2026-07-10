<template>
  <section class="dashboard-panel alert-panel">
    <div class="panel-title">
      <h2>天气预警（2）</h2>
      <button type="button">更多 ›</button>
    </div>

    <article v-for="alert in alerts" :key="alert.title" :class="`alert-card alert-card--${alert.level}`">
      <div class="alert-card__icon" aria-hidden="true">{{ alert.icon }}</div>
      <div class="alert-card__body">
        <div class="alert-card__head">
          <h3>{{ alert.title }}</h3>
          <span>生效中</span>
        </div>
        <p>发布时间：{{ alert.time }}</p>
        <p>影响区域：{{ alert.area }}</p>
        <p>预计时间：{{ alert.period }}</p>
        <button type="button">查看详情</button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
const alerts = [
  {
    title: '暴雨黄色预警',
    level: 'yellow',
    icon: '☔',
    time: '07-09 13:45',
    area: '罗湖区、福田区、南山区',
    period: '未来6小时',
  },
  {
    title: '雷雨大风蓝色预警',
    level: 'blue',
    icon: 'ϟ',
    time: '07-09 12:30',
    area: '全市陆地、珠江口海域',
    period: '未来3小时',
  },
];
</script>
