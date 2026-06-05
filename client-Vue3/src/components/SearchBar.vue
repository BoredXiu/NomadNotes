<template>
	<div style="display: flex; justify-content: flex-end">
		<el-autocomplete
			v-model="keyword"
			:fetch-suggestions="fetchSuggestionsDebounced"
			:trigger-on-focus="false"
			:loading="loading"
			placeholder="搜索旅程、游记、账单..."
			:prefix-icon="Search"
			clearable
			style="max-width: 280px"
			@select="handleSelect"
			@keydown.enter="handleSearch"
		>
			<template #default="{ item }">
				<div style="display: flex; justify-content: space-between; align-items: center">
					<span>{{ item.value }}</span>
					<span style="font-size: 12px; color: #999; padding: 0 4px; background: #f5f5f5; border-radius: 2px">
						{{ item.type === "trip" ? "旅程" : "目的地" }}
					</span>
				</div>
			</template>
		</el-autocomplete>
	</div>
</template>

<script setup lang="ts">
	import { ref, onUnmounted } from "vue";
	import { Search } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";
	import { getSearchSuggestions } from "../api/search";
	import type { SuggestionItem } from "../api/search";

	const keyword = ref("");
	const loading = ref(false);
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
