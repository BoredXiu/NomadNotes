<template>
	<div ref="pageRef">
		<h2 class="home-page-title">我的旅程</h2>

		<CardListSkeleton
			v-if="loading"
			:count="8"
		/>

		<el-empty
			v-else-if="trips.length === 0"
			description="还没有旅程，点击上方按钮开始记录吧"
		/>

		<el-empty
			v-else-if="filteredTrips.length === 0"
			description="没有匹配的旅程"
		/>

		<el-row
			v-else
			ref="listRef"
			:gutter="16"
		>
			<el-col
				v-for="trip in filteredTrips"
				:key="trip.id"
				:xs="24"
				:sm="12"
				:md="8"
				:lg="6"
				style="margin-bottom: 1rem"
			>
				<el-card
					:body-style="{ padding: 0 }"
					shadow="hover"
					style="cursor: pointer"
					@click="router.push(`/trip/${trip.id}`)"
				>
					<!-- 封面图 -->
					<el-image
						v-if="trip.coverImage"
						:src="trip.coverImage"
						style="width: 100%; height: 10rem; object-fit: cover"
						fit="cover"
					/>
					<div
						v-else
						style="height: 10rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center"
					>
						<MyTripIcon
							:size="48"
							color="rgba(255,255,255,0.6)"
						/>
					</div>

					<!-- 卡片内容 -->
					<div style="padding: 1rem 1rem 0.75rem">
						<!-- 16px 16px 12px -->
						<div style="margin-bottom: 0.5rem">
							<!-- 8px -->
							<el-space :size="4">
								<el-tag
									v-if="trip.isPublic === 1"
									type="success"
									size="small"
									>公开</el-tag
								>
								<span style="font-weight: 600">{{ trip.title }}</span>
								<el-tag
									v-if="trip.isEnded === 1"
									type="primary"
									size="small"
									>已结束</el-tag
								>
							</el-space>
						</div>
						<div
							class="trip-card-info"
							style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem"
						>
							<div>
								<el-icon style="margin-right: 0.25rem"><Location /></el-icon>
								<!-- 4px -->
								{{ trip.destination }}
							</div>
							<div class="trip-card-info-secondary">
								<el-icon style="margin-right: 0.25rem"><Timer /></el-icon>
								<!-- 4px -->
								{{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
							</div>
							<div
								class="trip-card-info-secondary"
								style="display: flex; gap: 0.75rem"
							>
								<span>
									<el-icon style="margin-right: 0.25rem"><Money /></el-icon>
									<!-- 4px -->
									{{ trip.expenseCount }} 笔账单
								</span>
								<span>
									<el-icon style="margin-right: 0.25rem"><Document /></el-icon>
									<!-- 4px -->
									{{ trip.noteCount }} 篇游记
								</span>
							</div>
						</div>
					</div>

					<!-- 操作按钮区域（底部，与 Ant Design Card actions 一致） -->
					<div class="trip-card-actions">
						<el-button
							class="trip-card-action-btn"
							text
							:icon="Edit"
							size="small"
							@click.stop="router.push(`/trip/${trip.id}/edit`)"
						/>
						<div class="trip-card-action-divider" />
						<el-popconfirm
							title="确定要删除这个旅程吗？所有账单和游记也会被删除。"
							@confirm="handleDelete(trip.id)"
						>
							<template #reference>
								<el-button
									class="trip-card-action-btn trip-card-action-btn-delete"
									text
									:icon="Delete"
									size="small"
									@click.stop
								/>
							</template>
						</el-popconfirm>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-pagination
			v-if="total > pageSize"
			v-model:current-page="currentPage"
			:total="total"
			:page-size="pageSize"
			layout="prev, pager, next"
			style="text-align: center; margin-top: 1rem"
			@current-change="handlePageChange"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted, watch, computed, inject, type Ref } from "vue";
	import { useRouter } from "vue-router";
	import { Edit, Delete, Location, Timer, Money, Document } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { getTrips, deleteTrip } from "../api/trips";
	import MyTripIcon from "../components/MyTripIcon.vue";
	import CardListSkeleton from "../components/CardListSkeleton.vue";
	import type { Trip } from "../types";
	import dayjs from "dayjs";
	import { usePageEnter, useStaggerList } from "../composables/useGsapAnimations";

	const router = useRouter();
	const trips = ref<Trip[]>([]);
	const loading = ref(true);
	const total = ref(0);
	const currentPage = ref(1);
	const pageSize = 50;

	// 注入搜索关键词，用于客户端过滤（仅当前页面数据范围内搜索）
	const searchKeyword = inject<Ref<string>>("searchKeyword", ref(""));

	// 根据搜索关键词过滤旅程列表（标题、目的地匹配）
	const filteredTrips = computed(() => {
		const keyword = searchKeyword.value.trim().toLowerCase();
		if (!keyword) return trips.value;
		return trips.value.filter((trip) => trip.title.toLowerCase().includes(keyword) || trip.destination.toLowerCase().includes(keyword));
	});

	// GSAP 动画
	const pageRef = usePageEnter(0);
	const { containerRef: listRef, animate: animateList } = useStaggerList(0.06, 0.2);

	function formatDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
	}

	async function loadTrips(page = 1) {
		loading.value = true;
		try {
			const data = await getTrips({ page, pageSize });
			trips.value = data.list;
			total.value = data.total;
		} catch {
			ElMessage.error("加载旅程失败");
		} finally {
			loading.value = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			await deleteTrip(id);
			ElMessage.success("旅程已删除");
			loadTrips(currentPage.value);
		} catch {
			ElMessage.error("删除失败");
		}
	}

	function handlePageChange(page: number) {
		currentPage.value = page;
		loadTrips(page);
	}

	onMounted(() => {
		loadTrips();
	});

	// trips 数据变化后重新触发交错动画
	watch(trips, () => {
		animateList();
	});
</script>

<style scoped lang="scss">
	.home-page-title {
		margin-bottom: 1.5rem; // 24px
		font-size: 1.5rem; // 24px
		font-weight: 600;
	}

	.trip-card-actions {
		display: flex;
		justify-content: center;
		align-items: center;
		border-top: 0.0625rem solid #f0f0f0; // 1px
		padding: 0;
		background: #fafafa;
	}

	.trip-card-action-btn {
		flex: 1;
		height: 2.875rem; // 46px
		color: rgba(0, 0, 0, 0.45);
		transition: color 0.3s;
	}

	.trip-card-action-btn:hover {
		color: #1890ff;
	}

	.trip-card-action-btn-delete:hover {
		color: #ff7875;
	}

	.trip-card-action-divider {
		width: 0.0625rem; // 1px
		height: 1.5rem; // 24px
		background: #f0f0f0;
	}

	.trip-card-info {
		color: #666;
	}

	.trip-card-info-secondary {
		color: #999;
	}
	/* 暗黑主题支持 */
	.dark-theme .home-page-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .trip-card-actions {
		border-top-color: #303030 !important;
		background: #1a1a1a !important;
	}

	.dark-theme .trip-card-action-btn {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .trip-card-action-btn:hover {
		color: #667eea !important;
	}

	.dark-theme .trip-card-action-btn-delete:hover {
		color: #ff7875 !important;
	}

	.dark-theme .trip-card-action-divider {
		background: #303030 !important;
	}

	.dark-theme .trip-card-info {
		color: #bfbfbf !important;
	}

	.dark-theme .trip-card-info-secondary {
		color: #8c8c8c !important;
	}
</style>
