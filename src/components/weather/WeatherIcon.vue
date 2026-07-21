<template>
  <svg class="weather-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <template v-if="name === 'rain' || name === 'brand'">
      <path d="M13 28h22a8 8 0 0 0 1-15.94A13 13 0 0 0 11.3 15.5 6.5 6.5 0 0 0 13 28Z" fill="currentColor" opacity=".9"/>
      <path d="m17 32-3 7m11-7-3 9m12-9-3 7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </template>
    <template v-else-if="name === 'cloud'">
      <path d="M12 34h25a8 8 0 0 0 .7-15.97A13 13 0 0 0 13 21a6.5 6.5 0 0 0-1 13Z" fill="currentColor" opacity=".9"/>
    </template>
    <template v-else-if="name === 'temperature'">
      <path d="M21 29.5V10a5 5 0 0 1 10 0v19.5a9 9 0 1 1-10 0Z" stroke="currentColor" stroke-width="3"/>
      <path d="M26 17v17" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="26" cy="35" r="4" fill="currentColor"/>
    </template>
    <template v-else-if="name === 'humidity'">
      <path d="M24 5S12 20 12 29a12 12 0 0 0 24 0C36 20 24 5 24 5Z" fill="currentColor" opacity=".92"/>
      <path d="M19 31c1 4 4 6 8 6" stroke="#d9f3ff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>
    </template>
    <template v-else-if="name === 'wind'">
      <path d="M7 16h24c7 0 7-9 1-9-3 0-5 2-5 4M7 24h31c6 0 6 9 0 9-3 0-5-2-5-4M7 32h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </template>
    <template v-else-if="name === 'lightning'">
      <path d="m27 4-15 24h11l-3 16 17-25H26l1-15Z" fill="currentColor"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: 'brand' | 'rain' | 'cloud' | 'temperature' | 'humidity' | 'wind' | 'lightning' }>();
</script>
