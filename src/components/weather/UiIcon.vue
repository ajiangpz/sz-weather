<template>
  <svg class="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path v-if="name === 'play'" d="m9 6 9 6-9 6V6Z" fill="currentColor"/>
    <path v-else-if="name === 'pause'" d="M8 6v12M16 6v12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <template v-else-if="name === 'step'">
      <path d="m7 7 7 5-7 5V7Z" fill="currentColor"/><path d="M17 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </template>
    <path v-else-if="name === 'layers'" d="m12 4 8 5-8 5-8-5 8-5Zm-7 9 7 4 7-4M5 17l7 4 7-4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <template v-else-if="name === 'locate'">
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </template>
    <path v-else-if="name === 'refresh'" d="M19 8a8 8 0 1 0 1 7M19 4v4h-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path v-else-if="name === 'moon'" d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path v-else-if="name === 'menu'" d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path v-else-if="name === 'calendar'" d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path v-else-if="name === 'chevron-left'" d="m14 7-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path v-else-if="name === 'chevron-right'" d="m10 7 5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path v-else-if="name === 'chevron-down'" d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: 'play' | 'pause' | 'step' | 'layers' | 'locate' | 'refresh' | 'moon' | 'menu' | 'calendar' | 'chevron-left' | 'chevron-right' | 'chevron-down' }>();
</script>
