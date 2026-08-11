<template>
  <svg class="weather-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <template v-if="name === 'brand'">
      <path d="M13 28h22a8 8 0 0 0 1-15.94A13 13 0 0 0 11.3 15.5 6.5 6.5 0 0 0 13 28Z" fill="currentColor" opacity=".9"/>
      <path d="m17 32-3 7m11-7-3 9m12-9-3 7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </template>
    <template v-else-if="name === 'rain'">
      <path d="M13 29h22a8 8 0 0 0 1-15.94A13 13 0 0 0 11.3 16.5 6.5 6.5 0 0 0 13 29Z" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m17 33-2 5m10-5-2.5 7m11.5-7-2 5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    </template>
    <template v-else-if="name === 'cloud'">
      <path d="M12 34h25a8 8 0 0 0 .7-15.97A13 13 0 0 0 13 21a6.5 6.5 0 0 0-1 13Z" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </template>
    <template v-else-if="name === 'temperature'">
      <path d="M21 29.5V10a5 5 0 0 1 10 0v19.5a9 9 0 1 1-10 0Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M26 17v17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="26" cy="35" r="3.2" fill="currentColor"/>
    </template>
    <template v-else-if="name === 'humidity'">
      <path d="M24 6S12.5 20.2 12.5 29a11.5 11.5 0 0 0 23 0C35.5 20.2 24 6 24 6Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M19.5 31c1 3.5 3.8 5.5 7.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".72"/>
    </template>
    <template v-else-if="name === 'wind'">
      <path d="M7 16h24c7 0 7-9 1-9-3 0-5 2-5 4M7 24h31c6 0 6 9 0 9-3 0-5-2-5-4M7 32h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    </template>
    <template v-else-if="name === 'lightning'">
      <path d="m27 5-14 22h10l-2.5 15L36 20H26l1-15Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: 'brand' | 'rain' | 'cloud' | 'temperature' | 'humidity' | 'wind' | 'lightning' }>();
</script>
