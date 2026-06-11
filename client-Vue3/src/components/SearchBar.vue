<template>
	<div class="search-bar-wrapper">
		<!-- 搜索输入框 + 搜索按钮，用户主动触发搜索（点击或 Enter），无自动补全 -->
		<div
			class="search-input-group"
			:class="{ 'is-mobile': isMobile }"
		>
			<el-input
				v-model="keyword"
				:placeholder="isMobile ? '搜索' : '搜索游记、账单...'"
				:prefix-icon="Search"
				clearable
				size="default"
				@keydown.enter="handleSearch"
				@clear="handleClear"
			/>
			<el-button
				type="primary"
				:icon="Search"
				:loading="searching"
				:disabled="!keyword.trim()"
				@click="handleSearch"
				class="search-btn"
			>
				<template v-if="!isMobile">搜索</template>
			</el-button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, inject, type Ref } from "vue";
	import { useMediaQuery } from "@vueuse/core";
	import { Search } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";

	const props = defineProps<{
		/** 内联搜索模式：只在当前页面内过滤，不跳转到搜索结果页 */
		inline?: boolean;
	}>();

	const keyword = ref("");
	const searching = ref(false);
	const isMobile = useMediaQuery("(max-width: 768px)");
	const router = useRouter();

	// 从父组件注入共享搜索关键词（内联搜索模式下使用）
	const sharedKeyword = inject<Ref<string> | undefined>("searchKeyword", undefined);

	// 搜索去抖定时器
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * 触发搜索
	 * - 内联模式：更新共享关键词，由当前页面组件消费
	 * - 导航模式：去抖后跳转到搜索结果页
	 */
	function handleSearch() {
		const trimmed = keyword.value.trim();
		if (!trimmed || searching.value) return;

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		if (props.inline && sharedKeyword) {
			// 内联搜索：直接更新共享关键词，立即生效
			sharedKeyword.value = trimmed;
			searching.value = false;
			return;
		}

		searching.value = true;
		debounceTimer = setTimeout(() => {
			router.push(`/search?q=${encodeURIComponent(trimmed)}`);
			// 延迟重置状态，等待路由跳转完成
			setTimeout(() => {
				searching.value = false;
			}, 600);
		}, 400);
	}

	// 清空输入时重置搜索状态
	function handleClear() {
		keyword.value = "";
		searching.value = false;
		if (props.inline && sharedKeyword) {
			sharedKeyword.value = "";
		}
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}
</script>

<style scoped lang="scss">
	.search-bar-wrapper {
		display: flex;
		justify-content: flex-end;
	}

	.search-input-group {
		display: flex;
		align-items: center;
		gap: 0;
		border-radius: 0.5rem; // 8px
		overflow: hidden;
		border: 0.0625rem solid #d9d9d9; // 1px
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;

		&:focus-within {
			border-color: #667eea;
			box-shadow: 0 0 0 0.125rem rgba(102, 126, 234, 0.2); // 2px
		}

		&.is-mobile {
			max-width: 10rem; // 160px
		}
	}

	// 覆盖搜索输入框内部样式，移除 Element Plus 默认边框
	:deep(.el-input__wrapper) {
		background-color: #f5f5f5;
		box-shadow: none;
		border: none;
		border-radius: 0.5rem 0 0 0.5rem; // 8px 0 0 8px
		padding-left: 0.75rem; // 12px
		padding-right: 0.75rem;
	}

	:deep(.el-input__wrapper:hover) {
		background-color: #e8e8e8;
	}

	:deep(.el-input__wrapper.is-focus) {
		background-color: #fff;
		box-shadow: none;
	}

	// 搜索图标颜色
	:deep(.el-input__prefix .el-icon) {
		color: #bfbfbf;
	}

	// 搜索按钮
	.search-btn {
		border-radius: 0 0.5rem 0.5rem 0; // 0 8px 8px 0
		border: none;
		height: 2rem; // 32px
		padding: 0 1rem; // 16px
		background-color: #667eea;
		color: #fff;
		flex-shrink: 0;
		white-space: nowrap;

		&:hover {
			background-color: #5a6fd6;
		}

		&:disabled {
			background-color: #d9d9d9;
			color: #bfbfbf;
		}

		&.is-mobile {
			padding: 0 0.625rem; // 10px
		}
	}

	// 暗黑主题适配
	.dark-theme .search-input-group {
		border-color: #434343;
	}

	.dark-theme :deep(.el-input__wrapper) {
		background-color: #1f1f1f;
	}

	.dark-theme :deep(.el-input__wrapper:hover) {
		background-color: #2a2a2a;
	}

	.dark-theme :deep(.el-input__wrapper.is-focus) {
		background-color: #141414;
	}

	.dark-theme :deep(.el-input__inner) {
		color: #e8e8e8;
	}

	.dark-theme :deep(.el-input__inner::placeholder) {
		color: #595959;
	}

	.dark-theme .search-btn:disabled {
		background-color: #2a2a2a;
		color: #595959;
	}
</style>
