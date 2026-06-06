<template>
	<div
		class="search-results-page"
		ref="pageRef"
	>
		<!-- 搜索标题 -->
		<div class="search-results-header">
			<span class="search-results-title"> 搜索结果: "{{ query }}" </span>
			<span class="search-results-count"> 共找到 {{ total }} 条结果 </span>
		</div>

		<!-- 筛选和排序 -->
		<el-card
			size="small"
			shadow="hover"
			class="search-results-filters"
		>
			<el-space wrap>
				<span class="search-results-filter-label">范围:</span>
				<el-select
					v-model="scope"
					size="small"
					class="search-results-filter-select"
					@change="handleScopeChange"
				>
					<el-option
						v-for="opt in SCOPE_OPTIONS"
						:key="opt.value"
						:value="opt.value"
						:label="opt.label"
					/>
				</el-select>
				<span class="search-results-filter-label">排序:</span>
				<el-select
					v-model="sortBy"
					size="small"
					class="search-results-filter-select-sort"
					@change="handleSortChange"
				>
					<el-option
						v-for="opt in SORT_OPTIONS"
						:key="opt.value"
						:value="opt.value"
						:label="opt.label"
					/>
				</el-select>
			</el-space>
		</el-card>

		<!-- 搜索结果列表 -->
		<el-skeleton
			v-if="loading"
			:rows="8"
			animated
		/>

		<el-empty
			v-if="!loading && results.length === 0 && query"
			description="未找到匹配结果"
			class="search-results-empty"
		/>

		<el-empty
			v-if="!loading && !query"
			description="请输入搜索关键词"
			class="search-results-empty"
		/>

		<div v-if="results.length > 0">
			<div
				v-for="item in results"
				:key="item.id"
				class="search-result-item"
				@click="handleItemClick(item)"
			>
				<!-- 类型图标 -->
				<span class="search-result-icon">
					<el-icon
						v-if="item.type === 'trip'"
						:size="16"
						color="#1890ff"
					>
						<Location />
					</el-icon>
					<el-icon
						v-else-if="item.type === 'note'"
						:size="16"
						color="#722ed1"
					>
						<Document />
					</el-icon>
					<el-icon
						v-else-if="item.type === 'expense'"
						:size="16"
						color="#52c41a"
					>
						<Money />
					</el-icon>
				</span>

				<!-- 内容区 -->
				<div class="search-result-content">
					<!-- 旅程结果 -->
					<template v-if="item.type === 'trip'">
						<div class="search-result-row">
							<el-tag
								type="primary"
								size="small"
								class="search-result-tag"
							>
								旅程
							</el-tag>
							<span class="search-result-title">
								<HighlightText
									:text="item.title || ''"
									:keyword="query"
								/>
							</span>
						</div>
						<div class="search-result-secondary">
							<el-icon :size="12"><Location /></el-icon>
							<HighlightText
								:text="item.destination || ''"
								:keyword="query"
							/>
						</div>
						<div
							v-if="item.username"
							class="search-result-tertiary"
						>
							作者: {{ item.username }}
						</div>
					</template>

					<!-- 游记结果 -->
					<template v-else-if="item.type === 'note'">
						<div class="search-result-row">
							<el-tag
								color="#f9f0ff"
								size="small"
								class="search-result-tag-note"
							>
								游记
							</el-tag>
							<span class="search-result-title">{{ item.tripTitle }}</span>
						</div>
						<div class="search-result-content-text">
							<HighlightText
								:text="item.content || ''"
								:keyword="query"
							/>
						</div>
						<div
							v-if="item.noteDate"
							class="search-result-tertiary"
						>
							<el-icon :size="12"><Clock /></el-icon>
							{{ formatDate(item.noteDate) }}
						</div>
					</template>

					<!-- 账单结果 -->
					<template v-else-if="item.type === 'expense'">
						<div class="search-result-row">
							<el-tag
								type="success"
								size="small"
								class="search-result-tag"
							>
								账单
							</el-tag>
							<span class="search-result-title">{{ item.tripTitle }}</span>
						</div>
						<div class="search-result-row">
							<el-tag
								size="small"
								type="danger"
								>{{ item.category }}</el-tag
							>
							<span class="search-result-amount"> ¥{{ item.amount }} </span>
						</div>
						<div
							v-if="item.note"
							class="search-result-tertiary"
						>
							<HighlightText
								:text="item.note"
								:keyword="query"
							/>
						</div>
					</template>
				</div>
			</div>

			<!-- 分页 -->
			<div
				v-if="total > PAGE_SIZE"
				class="search-results-pagination"
			>
				<el-pagination
					v-model:current-page="page"
					:total="total"
					:page-size="PAGE_SIZE"
					layout="prev, pager, next"
					@current-change="doSearch"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { Location, Document, Money, Clock } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { search } from "../api/search";
	import HighlightText from "../components/HighlightText.vue";
	import type { SearchResultItem } from "../types";
	import dayjs from "dayjs";
	import { useFadeIn, useStaggerList } from "../composables/useGsapAnimations";

	const route = useRoute();
	const router = useRouter();

	// GSAP 动画
	const pageRef = useFadeIn(0);
	const { containerRef: listRef, animate: animateList } = useStaggerList(0.05, 0.2);

	const query = ref((route.query.q as string) || "");
	const scope = ref<string>("all");
	const sortBy = ref<string>("relevance");
	const page = ref(1);
	const total = ref(0);
	const results = ref<SearchResultItem[]>([]);
	const loading = ref(false);

	const PAGE_SIZE = 10;

	const SCOPE_OPTIONS = [
		{ value: "all", label: "全部" },
		{ value: "trips", label: "旅程" },
		{ value: "notes", label: "游记" },
		{ value: "expenses", label: "账单" },
	];

	const SORT_OPTIONS = [
		{ value: "relevance", label: "按相关性" },
		{ value: "date", label: "按时间" },
		{ value: "popularity", label: "按热度" },
	];

	function formatDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
	}

	function handleItemClick(item: SearchResultItem) {
		if (item.type === "trip") {
			router.push(`/trip/${item.id}`);
		} else if (item.type === "note" && item.tripId) {
			router.push(`/trip/${item.tripId}?tab=notes`);
		} else if (item.type === "expense" && item.tripId) {
			router.push(`/trip/${item.tripId}?tab=expenses`);
		}
	}

	function handleScopeChange(value: string) {
		scope.value = value;
		page.value = 1;
		doSearch();
	}

	function handleSortChange(value: string) {
		sortBy.value = value;
		page.value = 1;
		doSearch();
	}

	async function doSearch() {
		if (!query.value.trim()) {
			results.value = [];
			total.value = 0;
			return;
		}
		loading.value = true;
		try {
			const data = await search({
				q: query.value,
				scope: scope.value as "all" | "trips" | "notes" | "expenses",
				sortBy: sortBy.value as "relevance" | "date" | "popularity",
				page: page.value,
				pageSize: PAGE_SIZE,
			});
			results.value = data.list as SearchResultItem[];
			total.value = data.total;
		} catch {
			ElMessage.error("搜索失败");
			results.value = [];
			total.value = 0;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		doSearch();
	});
</script>

<style scoped lang="scss">
	.search-results-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 16px;
	}

	.search-results-header {
		margin-bottom: 24px;
	}

	.search-results-title {
		font-size: 20px;
		font-weight: 600;
		display: block;
		margin-bottom: 4px;
	}

	.search-results-count {
		color: rgba(0, 0, 0, 0.45);
		font-size: 14px;
	}

	.search-results-filters {
		margin-bottom: 16px;
	}

	.search-results-filter-label {
		color: rgba(0, 0, 0, 0.45);
		font-size: 14px;
	}

	.search-results-filter-select {
		width: 100px;
	}

	.search-results-filter-select-sort {
		width: 120px;
	}

	.search-results-empty {
		margin-top: 60px;
	}

	.search-result-item {
		padding: 12px 0;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.search-result-item:hover {
		background-color: #fafafa;
	}

	.search-result-icon {
		margin-top: 2px;
		flex-shrink: 0;
	}

	.search-result-content {
		flex: 1;
		min-width: 0;
	}

	.search-result-row {
		margin-bottom: 4px;
	}

	.search-result-tag {
		font-size: 11px;
		margin-right: 6px;
	}

	.search-result-tag-note {
		font-size: 11px;
		margin-right: 6px;
		color: #722ed1;
		border-color: #d3adf7;
	}

	.search-result-title {
		font-weight: 500;
	}

	.search-result-secondary {
		color: rgba(0, 0, 0, 0.45);
		font-size: 13px;
	}

	.search-result-tertiary {
		color: rgba(0, 0, 0, 0.45);
		font-size: 12px;
	}

	.search-result-content-text {
		color: #666;
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		margin-bottom: 2px;
	}

	.search-result-amount {
		color: #ff4d4f;
		font-weight: 600;
		margin-left: 6px;
	}

	.search-results-pagination {
		text-align: center;
		margin-top: 24px;
	}

	/* 暗黑主题支持 */
	.dark-theme .search-results-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .search-results-count {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .search-results-filter-label {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .search-result-item {
		border-bottom-color: #303030 !important;
	}

	.dark-theme .search-result-item:hover {
		background-color: #1a1a1a !important;
	}

	.dark-theme .search-result-secondary {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .search-result-tertiary {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .search-result-content-text {
		color: #bfbfbf !important;
	}

	.dark-theme .search-result-tag-note {
		background-color: #2a2a2a !important;
		border-color: #5a3e7a !important;
	}
</style>
