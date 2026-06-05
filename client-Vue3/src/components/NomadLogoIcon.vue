<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <polygon points="12,5 15,12 12,19 9,12" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number;
    color?: string;
  }>(),
  {
    size: 24,
    color: "currentColor",
  },
);
</script>