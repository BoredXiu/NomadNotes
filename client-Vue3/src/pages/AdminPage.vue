<template>
	<div class="admin-page">
		<!-- 滑板标签栏切换 -->
		<SkateboardTabBar
			:active-key="activeTab"
			:items="tabItems"
			@update:active-key="activeTab = $event"
		/>

		<!-- 标签页内容 -->
		<div class="admin-tab-content">
			<AuditTab v-if="activeTab === 'audit'" />
			<UserTab v-if="activeTab === 'users'" />
			<TripTab v-if="activeTab === 'trips'" />
			<OperationLogTab v-if="activeTab === 'logs'" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { useRouter } from "vue-router";
	import { useAuthStore } from "../stores/authStore";
	import AuditTab from "../components/admin/AuditTab.vue";
	import UserTab from "../components/admin/UserTab.vue";
	import TripTab from "../components/admin/TripTab.vue";
	import OperationLogTab from "../components/admin/OperationLogTab.vue";
	import SkateboardTabBar from "../components/SkateboardTabBar.vue";

	const router = useRouter();
	const authStore = useAuthStore();

	const activeTab = ref("audit");

	const tabItems = [
		{ key: "audit", label: "内容审核" },
		{ key: "users", label: "用户管理" },
		{ key: "trips", label: "旅程管理" },
		{ key: "logs", label: "操作日志" },
	];

	// 权限检查：仅管理员可访问
	onMounted(() => {
		if (!authStore.isAdmin) {
			router.replace("/");
		}
	});
</script>

<style scoped lang="scss">
	.admin-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 24px 16px;
	}

	.admin-tab-content {
		margin-top: 16px;
	}
</style>