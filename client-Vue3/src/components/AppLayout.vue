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
				<!-- 审核按钮：仅管理员可见 -->
				<el-badge
					v-if="isAdmin"
					:value="pendingCount"
					:hidden="pendingCount === 0"
					class="audit-badge"
				>
					<el-button
						class="journey-btn audit-btn"
						@click="router.push('/admin')"
					>
						<el-icon><Document /></el-icon>管理
					</el-button>
				</el-badge>

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
					@click="triggerRipple"
				>
					<el-icon :size="18">
						<Sunny v-if="themeStore.mode === 'dark'" />
						<Moon v-else />
					</el-icon>
				</el-button>

				<el-button
					v-if="canInstall"
					class="icon-btn install-btn"
					title="添加到桌面"
					@click="install"
				>
					<el-icon :size="18"><Download /></el-icon>
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
			<!-- 搜索：仅在"我的旅程"页面显示，搜索范围为当前页面数据 -->
			<SearchBar
				v-if="route.path === '/'"
				:inline="true"
			/>
		</div>

		<!-- 内容区域 -->
		<el-main class="app-main">
			<slot />
		</el-main>

		<!-- 页脚：ICP 备案信息，flex-shrink: 0 确保不被挤压 -->
		<AppFooter />
	</el-container>
</template>

<script setup lang="ts">
	import { computed, onMounted, provide, ref } from "vue";
	import { storeToRefs } from "pinia";
	import { useRouter, useRoute } from "vue-router";
	import { Plus, Sunny, Moon, SwitchButton, Compass, Document, Download } from "@element-plus/icons-vue";
	import { useAuthStore } from "../stores/authStore";
	import { useThemeStore } from "../stores/themeStore";
	import { useThemeRipple } from "../composables/useThemeRipple";
	import { usePWAInstall } from "../composables/usePWAInstall";
	import { getPendingCount } from "../api/admin";
	import NomadLogoIcon from "./NomadLogoIcon.vue";
	import MyTripIcon from "./MyTripIcon.vue";
	import SkateboardTabBar from "./SkateboardTabBar.vue";
	import SearchBar from "./SearchBar.vue";
	import AppFooter from "./AppFooter.vue";

	const authStore = useAuthStore();
	const { user, isAdmin } = storeToRefs(authStore);
	const themeStore = useThemeStore();
	const { triggerRipple } = useThemeRipple();
	const { canInstall, checkingInstall, install } = usePWAInstall();
	const router = useRouter();
	const route = useRoute();

	// 待审核数量（管理员可见徽章数字）
	const pendingCount = ref(0);

	// 内联搜索关键词：provide 给子组件（SearchBar 写入，HomePage 读取）
	const searchKeyword = ref("");
	provide("searchKeyword", searchKeyword);

	// 管理员登录时获取待审核数量
	onMounted(async () => {
		if (isAdmin.value) {
			try {
				const res = await getPendingCount();
				if (res.success) {
					pendingCount.value = res.data.count;
				}
			} catch {
				// 静默失败，不影响主流程
			}
		}
	});

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
		font-size: 1.125rem; // 18px
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

	/* 审核徽章对齐 */
	.audit-badge {
		vertical-align: middle;
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
		padding: 0.5rem; // 8px
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
		padding: 0 1.5rem; // 24px
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* 内容区域 */
	.app-main {
		padding: 1.5rem; // 24px
		max-width: 75rem; // 1200px
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

	/* 响应式适配（H5 移动端） */
	@media (max-width: 48rem) {
		// 768px
		.app-header {
			padding: 0 1rem; // 16px
		}

		.tab-bar-wrapper {
			padding: 0 1rem;
		}

		.app-main {
			padding: 1rem;
		}

		.username {
			display: none;
		}

		.header-actions {
			gap: 0.5rem; // 8px
		}
	}
</style>
