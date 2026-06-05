<template>
  <div
    style="
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    "
  >
    <el-space>
      <el-button v-if="showBack" text @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <span v-if="title" style="font-size: 18px; font-weight: 600">
        {{ title }}
      </span>
    </el-space>
    <slot name="extra" />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

const props = withDefaults(
  defineProps<{
    title?: string;
    showBack?: boolean;
    backTo?: string;
  }>(),
  {
    showBack: true,
  },
);

const router = useRouter();

function handleBack() {
  if (props.backTo) {
    router.push(props.backTo);
  } else {
    router.back();
  }
}
</script>