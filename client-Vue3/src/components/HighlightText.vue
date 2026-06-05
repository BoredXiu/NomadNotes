<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <mark
        v-if="part.highlight"
        style="background: #fff3b0; padding: 0 2px; border-radius: 2px"
      >
        {{ part.text }}
      </mark>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  text: string;
  keyword: string;
}>();

interface HighlightPart {
  text: string;
  highlight: boolean;
}

const parts = computed<HighlightPart[]>(() => {
  if (!props.keyword || !props.text) {
    return [{ text: props.text, highlight: false }];
  }

  const lowerText = props.text.toLowerCase();
  const lowerKw = props.keyword.toLowerCase();
  const result: HighlightPart[] = [];
  let lastIndex = 0;

  while (lastIndex < props.text.length) {
    const index = lowerText.indexOf(lowerKw, lastIndex);
    if (index === -1) {
      result.push({ text: props.text.slice(lastIndex), highlight: false });
      break;
    }
    if (index > lastIndex) {
      result.push({
        text: props.text.slice(lastIndex, index),
        highlight: false,
      });
    }
    result.push({
      text: props.text.slice(index, index + props.keyword.length),
      highlight: true,
    });
    lastIndex = index + props.keyword.length;
  }

  return result;
});
</script>