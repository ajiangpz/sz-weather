<template>
  <section class="dashboard-panel station-rank">
    <h2>监测站点 (24h降雨)</h2>

    <ol>
      <li v-for="station in stations" :key="station.name">
        <span>{{ station.name }}</span>
        <strong>{{ station.value }} mm</strong>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
const stations = [
  { name: '大梧桐', value: 36.8 },
  { name: '罗湖', value: 28.6 },
  { name: '南山', value: 24.3 },
  { name: '福田', value: 20.1 },
  { name: '宝安', value: 18.5 },
];
</script>
