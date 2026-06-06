<template>
  <AppLayout v-if="isAuthenticated">
    <PublicTripDetailPage />
  </AppLayout>
  <PublicTripDetailPage v-else />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores/authStore";
import AppLayout from "../components/AppLayout.vue";
import PublicTripDetailPage from "../pages/PublicTripDetailPage.vue";

const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
</script>