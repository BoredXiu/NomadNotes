<template>
	<div class="search-bar-wrapper">
		<el-autocomplete
			v-model="keyword"
			:fetch-suggestions="fetchSuggestionsDebounced"
			:trigger-on-focus="false"
			:loading="loading"
			:placeholder="isMobile ? '搜索' : '搜索游记、账单...'"
			:prefix-icon="Search"
			clearable
			:style="{ width: isMobile ? '120px' : '200px' }"
			popper-class="search-popper"
			@select="handleSelect"
			@keydown.enter="handleSearch"
		>
			<template #default="{ item }">
				<div class="search-suggestion-item">
					<span>{{ item.value }}</span>
					<span class="search-suggestion-type">
						{{ item.type === "trip" ? "旅程" : "目的地" }}
					</span>
				</div>
			</template>
		</el-autocomplete>
	</div>
</template>

<script setup lang="ts">
	import { ref, onUnmounted } from "vue";
	import { useMediaQuery } from "@vueuse/core";
	import { Search } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";
	import { getSearchSuggestions } from "../api/search";
	import type { SuggestionItem } from "../api/search";

	const keyword = ref("");
	const loading = ref(false);
	const isMobile = useMediaQuery("(max-width: 768px)");
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	const router = useRouter();

	async function fetchSuggestions(queryString: string, cb: (results: { value: string; type: string }[]) => void) {
		if (!queryString || queryString.trim().length < 1) {
			cb([]);
			return;
		}
		loading.value = true;
		try {
			const data = await getSearchSuggestions(queryString);
			cb(
				data.map((item: SuggestionItem) => ({
					value: item.text,
					type: item.type,
				})),
			);
		} catch {
			cb([]);
		} finally {
			loading.value = false;
		}
	}

	function fetchSuggestionsDebounced(queryString: string, cb: (results: { value: string; type: string }[]) => void) {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			fetchSuggestions(queryString, cb);
		}, 300);
	}

	function handleSelect(item: Record<string, any>) {
		keyword.value = String(item.value ?? "");
		router.push(`/search?q=${encodeURIComponent(keyword.value)}`);
	}

	function handleSearch() {
		const trimmed = keyword.value.trim();
		if (!trimmed) return;
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
	}

	onUnmounted(() => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
	});
</script>

<style scoped lang="scss">
	.search-bar-wrapper {
		display: flex;
		justify-content: flex-end;
	}

	/* 搜索框样式 - 与 React 版 variant="filled" 一致，灰色背景 */
	:deep(.el-autocomplete .el-input__wrapper) {
		background-color: #f5f5f5;
		box-shadow: none;
		border: none;
		border-radius: 8px;
	}

	:deep(.el-autocomplete .el-input__wrapper:hover) {
		background-color: #e8e8e8;
	}

	:deep(.el-autocomplete .el-input__wrapper.is-focus) {
		background-color: #fff;
		box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
	}

	/* 搜索图标灰色 */
	:deep(.el-autocomplete .el-input__prefix .el-icon) {
		color: #bfbfbf;
	}

	/* 搜索建议项样式 */
	.search-suggestion-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.search-suggestion-type {
		font-size: 12px;
		color: #999;
		padding: 0 4px;
		background: #f5f5f5;
		border-radius: 2px;
	}
</style>
