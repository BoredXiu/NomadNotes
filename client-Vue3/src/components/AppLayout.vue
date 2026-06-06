<template>
	<el-container
		:class="themeStore.mode === 'dark' ? 'dark-theme' : 'light-theme'"
		style="min-height: 100vh"
	>
		<!-- 顶部导航栏 -->
		<el-header
			class="app-header"
			style="display: flex; align-items: center; justify-content: space-between; padding: 0 24px"
		>
			<el-space>
				<NomadLogoIcon
					:size="22"
					color="#fff"
				/>
				<span class="app-title"> NomadNotes </span>
			</el-space>

			<el-space
				class="header-actions"
				:size="12"
			>
				<el-button
					class="journey-btn"
					@click="router.push('/trip/new')"
				>
					<el-icon><Plus /></el-icon>新建旅程
				</el-button>

				<el-space
					class="user-profile"
					:size="8"
					@click="router.push('/profile')"
				>
					<el-avatar
						v-if="user?.avatarUrl"
						:src="user.avatarUrl"
						:size="32"
					/>
					<el-avatar
						v-else
						:size="32"
					>
						{{ user?.username?.charAt(0).toUpperCase() }}
					</el-avatar>
					<span class="username">{{ user?.username }}</span>
				</el-space>

				<el-button
					class="icon-btn theme-btn"
					@click="themeStore.toggleTheme()"
				>
					<el-icon :size="18">
						<Sunny v-if="themeStore.mode === 'dark'" />
						<Moon v-else />
					</el-icon>
				</el-button>

				<el-button
					class="icon-btn logout-btn"
					@click="handleLogout"
				>
					<el-icon :size="18"><SwitchButton /></el-icon>
				</el-button>
			</el-space>
		</el-header>

		<!-- Tab 导航栏 -->
		<div class="tab-bar-wrapper">
			<SkateboardTabBar
				:active-key="activeKey"
				:items="tabItems"
				@update:active-key="(key: string) => router.push(key)"
			>
				<template
					v-for="tab in tabItems"
					:key="tab.key"
					#[`label-${tab.key}`]
				>
					<span>
						<MyTripIcon
							v-if="tab.key === '/'"
							:size="14"
						/>
						<el-icon v-if="tab.key === '/explore'"><Compass /></el-icon>
						{{ tab.label }}
					</span>
				</template>
			</SkateboardTabBar>
			<SearchBar />
		</div>

		<!-- 内容区域 -->
		<el-main class="app-main">
			<slot />
		</el-main>
	</el-container>
</template>

<script setup lang="ts">
	import { computed } from "vue";
	import { storeToRefs } from "pinia";
	import { useRouter, useRoute } from "vue-router";
	import { Plus, Sunny, Moon, SwitchButton, Compass } from "@element-plus/icons-vue";
	import { useAuthStore } from "../stores/authStore";
	import { useThemeStore } from "../stores/themeStore";
	import NomadLogoIcon from "./NomadLogoIcon.vue";
	import MyTripIcon from "./MyTripIcon.vue";
	import SkateboardTabBar from "./SkateboardTabBar.vue";
	import SearchBar from "./SearchBar.vue";

	const authStore = useAuthStore();
	const { user } = storeToRefs(authStore);
	const themeStore = useThemeStore();
	const router = useRouter();
	const route = useRoute();

	const activeKey = computed(() => {
		if (route.path === "/") return "/";
		if (route.path.startsWith("/explore")) return "/explore";
		return "";
	});

	const tabItems = [
		{ key: "/", label: "我的旅程" },
		{ key: "/explore", label: "微游记" },
	];

	function handleLogout() {
		authStore.logout();
		router.push("/login");
	}
</script>

<style scoped lang="scss">
	/* 导航栏背景色 */
	.app-header {
		background: #001529;
	}

	.app-title {
		color: #fff;
		font-size: 18px;
		font-weight: 600;
	}

	/* 右侧按钮组紧凑布局 */
	.header-actions {
		display: flex;
		align-items: center;
	}

	/* 新建旅程按钮 - 较浅背景色 */
	.journey-btn {
		background-color: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		color: #fff;
		transition: all 0.2s ease;
	}

	.journey-btn:hover {
		background-color: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.5);
		color: #fff;
	}

	.journey-btn:active {
		background-color: rgba(255, 255, 255, 0.1);
	}

	/* 用户头像区域 */
	.user-profile {
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.username {
		color: #fff;
	}

	/* 图标按钮通用样式 - 移除悬浮变白效果 */
	.icon-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.85);
		padding: 8px;
		min-width: auto;
		height: auto;
	}

	.icon-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.85);
	}

	.icon-btn:active {
		background: rgba(255, 255, 255, 0.05);
	}

	/* Tab 导航栏包装器 */
	.tab-bar-wrapper {
		padding: 0 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* 内容区域 */
	.app-main {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	/* 暗色主题适配 */
	.dark-theme {
		background-color: #141414;
	}

	.light-theme {
		background-color: #f5f5f5;
	}

	/* 响应式适配 */
	@media (max-width: 768px) {
		.app-header {
			padding: 0 16px;
		}

		.tab-bar-wrapper {
			padding: 0 16px;
		}

		.app-main {
			padding: 16px;
		}

		.username {
			display: none;
		}

		.header-actions {
			gap: 8px;
		}
	}
</style>
