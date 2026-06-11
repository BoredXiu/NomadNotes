<template>
  <AppLayout v-if="isAuthenticated">
    <PublicTripDetailPage />
  </AppLayout>
  <div v-else style="min-height: 100vh; display: flex; flex-direction: column;">
    <div style="flex: 1;">
      <PublicTripDetailPage />
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores/authStore";
import AppLayout from "../components/AppLayout.vue";
import PublicTripDetailPage from "../pages/PublicTripDetailPage.vue";
import AppFooter from "../components/AppFooter.vue";

const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
</script>