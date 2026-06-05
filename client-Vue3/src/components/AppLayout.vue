<template>
	<el-container style="min-height: 100vh">
		<!-- 顶部导航栏 -->
		<el-header style="display: flex; align-items: center; justify-content: space-between; background: #001529; padding: 0 24px">
			<el-space>
				<NomadLogoIcon
					:size="22"
					color="#fff"
				/>
				<span style="color: #fff; font-size: 18px; font-weight: 600"> NomadNotes </span>
			</el-space>

			<el-space :size="16">
				<el-button
					type="primary"
					@click="router.push('/trip/new')"
				>
					<el-icon><Plus /></el-icon>新建旅程
				</el-button>

				<el-space
					:size="8"
					style="cursor: pointer"
					@click="router.push('/profile')"
				>
					<el-avatar
						v-if="authStore.user?.avatarUrl"
						:src="authStore.user.avatarUrl"
						:size="32"
					/>
					<el-avatar
						v-else
						:size="32"
					>
						{{ authStore.user?.username?.charAt(0).toUpperCase() }}
					</el-avatar>
					<span style="color: #fff">{{ authStore.user?.username }}</span>
				</el-space>

				<el-button
					text
					style="color: #fff"
					@click="themeStore.toggleTheme()"
				>
					<el-icon>
						<Sunny v-if="themeStore.mode === 'dark'" />
						<Moon v-else />
					</el-icon>
				</el-button>

				<el-button
					text
					style="color: #fff"
					@click="handleLogout"
				>
					<el-icon><SwitchButton /></el-icon>退出
				</el-button>
			</el-space>
		</el-header>

		<!-- Tab 导航栏 -->
		<div style="padding: 0 24px; display: flex; align-items: center; justify-content: space-between">
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
		<el-main style="padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%">
			<slot />
		</el-main>
	</el-container>
</template>

<script setup lang="ts">
	import { computed } from "vue";
	import { useRouter, useRoute } from "vue-router";
	import { Plus, Sunny, Moon, SwitchButton, Compass } from "@element-plus/icons-vue";
	import { useAuthStore } from "../stores/authStore";
	import { useThemeStore } from "../stores/themeStore";
	import NomadLogoIcon from "./NomadLogoIcon.vue";
	import MyTripIcon from "./MyTripIcon.vue";
	import SkateboardTabBar from "./SkateboardTabBar.vue";
	import SearchBar from "./SearchBar.vue";

	const authStore = useAuthStore();
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
