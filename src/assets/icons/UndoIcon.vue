<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="size ?? 18" 
    :height="size ?? 18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <path d="M3 7v6h6"></path>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
  </svg>
</template>
