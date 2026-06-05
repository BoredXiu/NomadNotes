<template>
  <AppLayout v-if="isAuthenticated">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "./components/AppLayout.vue";

const route = useRoute();
const isAuthenticated = computed(() => {
  const token = localStorage.getItem("accessToken");
  return !!token && !route.meta.guest;
});
</script>