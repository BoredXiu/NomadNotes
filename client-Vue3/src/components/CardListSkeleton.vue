<template>
  <el-row :gutter="16">
    <el-col
      v-for="i in count"
      :key="i"
      :xs="24"
      :sm="12"
      :md="8"
      :lg="8"
      :xl="6"
      style="margin-bottom: 16px"
    >
      <el-card :body-style="{ padding: 0 }">
        <el-skeleton style="width: 100%; height: 180px" animated />
        <div style="padding: 16px">
          <el-skeleton :rows="2" animated />
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number;
  }>(),
  {
    count: 6,
  },
);
</script>