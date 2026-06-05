<template>
	<div>
		<h3 style="margin-bottom: 24px; font-size: 20px; font-weight: 600">微游记</h3>
		<span style="display: block; margin-bottom: 24px; color: rgba(0, 0, 0, 0.45); font-size: 14px"> 发现其他旅行者的精彩分享 </span>

		<CardListSkeleton
			v-if="loading"
			:count="6"
		/>

		<div
			v-else-if="trips.length > 0"
			style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px"
		>
			<el-card
				v-for="trip in trips"
				:key="trip.id"
				:body-style="{ padding: 0 }"
				style="cursor: pointer"
				shadow="hover"
				@click="navigateToTrip(trip)"
			>
				<el-image
					v-if="trip.coverImage"
					:src="trip.coverImage"
					style="width: 100%; height: 160px; object-fit: cover"
					fit="cover"
				/>
				<div
					v-else
					style="width: 100%; height: 160px; background: #f0f2f5; display: flex; align-items: center; justify-content: center"
				>
					<MyTripIcon
						:size="48"
						color="#bfbfbf"
					/>
				</div>
				<div style="padding: 12px 16px">
					<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
						<h4 style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; word-break: break-word; margin: 0">
							{{ trip.title }}
						</h4>
						<el-tag
							v-if="currentUserId && trip.userId === currentUserId"
							type="warning"
							size="small"
							>我的</el-tag
						>
					</div>
					<div style="display: flex; flex-direction: column; gap: 4px; color: rgba(0, 0, 0, 0.45); font-size: 13px">
						<div>
							<el-icon style="margin-right: 4px"><Location /></el-icon>
							{{ trip.destination }}
						</div>
						<div>
							<el-icon style="margin-right: 4px"><Timer /></el-icon>
							{{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
						</div>
						<div>
							<el-icon style="margin-right: 4px"><User /></el-icon>
							{{ trip.User?.username || "匿名用户" }}
						</div>
						<div>
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
			style="text-align: center; margin-top: 24px"
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

	const router = useRouter();
	const authStore = useAuthStore();
	const trips = ref<Trip[]>([]);
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
</script>
