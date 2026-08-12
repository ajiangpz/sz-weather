<template>
  <section class="weather-legend weather-legend--map" aria-label="雷达强度图例">
    <span class="weather-legend__unit">dBZ</span>
    <div class="weather-legend__scale">
      <div class="weather-legend__labels">
        <span v-for="item in labels" :key="item">{{ item }}</span>
      </div>
      <div class="weather-legend__gradient"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
const labels = ['<5', '10', '20', '30', '40', '50', '60', '70+'];
</script>
