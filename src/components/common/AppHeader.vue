<template>
  <header class="app-header">
    <div>
      <p class="app-header__eyebrow">Realtime Weather Radar</p>
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();
</script>
