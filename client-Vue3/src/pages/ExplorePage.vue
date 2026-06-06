<template>
	<div ref="pageRef">
		<h3 class="explore-title">微游记</h3>
		<span class="explore-subtitle"> 发现其他旅行者的精彩分享 </span>

		<CardListSkeleton
			v-if="loading"
			:count="6"
		/>

		<div
			v-else-if="trips.length > 0"
			ref="listRef"
			class="explore-grid"
		>
			<el-card
				v-for="trip in trips"
				:key="trip.id"
				:body-style="{ padding: 0 }"
				class="explore-card"
				style="cursor: pointer"
				shadow="hover"
				@click="navigateToTrip(trip)"
			>
				<el-image
					v-if="trip.coverImage"
					:src="trip.coverImage"
					class="explore-card-image"
					fit="cover"
				/>
				<div
					v-else
					class="explore-card-cover"
				>
					<MyTripIcon
						:size="48"
						color="#bfbfbf"
					/>
				</div>
				<div class="explore-card-content">
					<div class="explore-card-header">
						<h4 class="explore-card-title">
							{{ trip.title }}
						</h4>
						<el-tag
							v-if="currentUserId && trip.userId === currentUserId"
							type="warning"
							size="small"
							>我的</el-tag
						>
					</div>
					<div class="explore-card-info">
						<div class="explore-card-info-item">
							<el-icon class="explore-card-icon"><Location /></el-icon>
							{{ trip.destination }}
						</div>
						<div class="explore-card-info-item">
							<el-icon class="explore-card-icon"><Timer /></el-icon>
							{{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
						</div>
						<div class="explore-card-info-item">
							<el-icon class="explore-card-icon"><User /></el-icon>
							{{ trip.User?.username || "匿名用户" }}
						</div>
						<div class="explore-card-status">
							<el-tag
								v-if="trip.isEnded"
								type="primary"
								size="small"
								>已结束</el-tag
							>
							<el-tag
								v-else
								type="success"
								size="small"
								>进行中</el-tag
							>
						</div>
					</div>
				</div>
			</el-card>
		</div>

		<el-empty
			v-else
			description="暂无公开游记"
		/>

		<el-pagination
			v-if="total > pageSize"
			v-model:current-page="currentPage"
			:total="total"
			:page-size="pageSize"
			layout="prev, pager, next"
			class="explore-pagination"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted, watch } from "vue";
	import { useRouter } from "vue-router";
	import { User, Location, Timer } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { getPublicTrips } from "../api/trips";
	import MyTripIcon from "../components/MyTripIcon.vue";
	import CardListSkeleton from "../components/CardListSkeleton.vue";
	import { useAuthStore } from "../stores/authStore";
	import type { Trip } from "../types";
	import dayjs from "dayjs";
	import { usePageEnter, useStaggerList } from "../composables/useGsapAnimations";

	const router = useRouter();
	const authStore = useAuthStore();
	const trips = ref<Trip[]>([]);

	// GSAP 动画
	const pageRef = usePageEnter(0);
	const { containerRef: listRef, animate: animateList } = useStaggerList(0.06, 0.2);
	const loading = ref(true);
	const total = ref(0);
	const currentPage = ref(1);
	const pageSize = 9;

	const currentUserId = authStore.user?.id;

	function formatDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
	}

	async function loadTrips() {
		loading.value = true;
		try {
			const data = await getPublicTrips({ page: currentPage.value, pageSize });
			trips.value = data.list;
			total.value = data.total;
		} catch {
			ElMessage.error("加载公开游记失败");
		} finally {
			loading.value = false;
		}
	}

	function navigateToTrip(trip: Trip) {
		router.push(`/explore/${trip.id}`);
	}

	watch(currentPage, () => {
		loadTrips();
	});

	onMounted(() => {
		loadTrips();
	});

	// trips 数据变化后重新触发交错动画
	watch(trips, () => {
		animateList();
	});
</script>

<style scoped lang="scss">
	.explore-title {
		margin-bottom: 24px;
		font-size: 20px;
		font-weight: 600;
	}

	.explore-subtitle {
		display: block;
		margin-bottom: 24px;
		color: rgba(0, 0, 0, 0.45);
		font-size: 14px;
	}

	.explore-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.explore-card {
		cursor: pointer;
	}

	.explore-card-image {
		width: 100%;
		height: 160px;
		object-fit: cover;
	}

	.explore-card-cover {
		width: 100%;
		height: 160px;
		background: #f0f2f5;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.explore-card-content {
		padding: 12px 16px;
	}

	.explore-card-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.explore-card-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		word-break: break-word;
		margin: 0;
	}

	.explore-card-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		color: rgba(0, 0, 0, 0.45);
		font-size: 13px;
	}

	.explore-card-info-item {
		display: flex;
		align-items: center;
	}

	.explore-card-icon {
		margin-right: 4px;
	}

	.explore-card-status {
		margin-top: 4px;
	}

	.explore-pagination {
		text-align: center;
		margin-top: 24px;
	}

	/* 暗黑主题支持 */
	.dark-theme .explore-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .explore-subtitle {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .explore-card-cover {
		background: #2a2a2a !important;
	}

	.dark-theme .explore-card-cover .el-icon {
		color: #5a5a5a !important;
	}

	.dark-theme .explore-card-info {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .explore-card-icon {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .explore-card-title {
		color: #e8e8e8 !important;
	}
</style>
