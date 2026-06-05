<template>
	<div>
		<h3 style="margin-bottom: 24px">我的旅程</h3>

		<CardListSkeleton
			v-if="loading"
			:count="8"
		/>

		<el-empty
			v-else-if="trips.length === 0"
			description="还没有旅程，点击上方按钮开始记录吧"
		/>

		<el-row
			v-else
			:gutter="16"
		>
			<el-col
				v-for="trip in trips"
				:key="trip.id"
				:xs="24"
				:sm="12"
				:md="8"
				:lg="6"
				style="margin-bottom: 16px"
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
						style="width: 100%; height: 160px; object-fit: cover"
						fit="cover"
					/>
					<div
						v-else
						style="height: 160px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center"
					>
						<MyTripIcon
							:size="48"
							color="rgba(255,255,255,0.6)"
						/>
					</div>

					<!-- 卡片内容 -->
					<div style="padding: 16px 16px 12px">
						<div style="margin-bottom: 8px">
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
						<div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #666">
							<div>
								<el-icon style="margin-right: 4px"><Location /></el-icon>
								{{ trip.destination }}
							</div>
							<div style="color: #999">
								<el-icon style="margin-right: 4px"><Timer /></el-icon>
								{{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
							</div>
							<div style="display: flex; gap: 12px; color: #999">
								<span>
									<el-icon style="margin-right: 4px"><Money /></el-icon>
									{{ trip.expenseCount }} 笔账单
								</span>
								<span>
									<el-icon style="margin-right: 4px"><Document /></el-icon>
									{{ trip.noteCount }} 篇游记
								</span>
							</div>
						</div>
					</div>

					<!-- 操作按钮区域（底部，与 Ant Design Card actions 一致） -->
					<div style="display: flex; justify-content: flex-end; border-top: 1px solid #f0f0f0; padding: 0 12px; background: #fafafa">
						<el-button
							text
							:icon="Edit"
							size="small"
							@click.stop="router.push(`/trip/${trip.id}/edit`)"
						/>
						<el-popconfirm
							title="确定要删除这个旅程吗？所有账单和游记也会被删除。"
							@confirm="handleDelete(trip.id)"
						>
							<template #reference>
								<el-button
									text
									:icon="Delete"
									size="small"
									type="danger"
									@click.stop
									@mouseenter="
										(e: MouseEvent) => {
											(e.currentTarget as HTMLElement).style.color = '#ff7875';
										}
									"
									@mouseleave="
										(e: MouseEvent) => {
											(e.currentTarget as HTMLElement).style.color = '';
										}
									"
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
			style="text-align: center; margin-top: 16px"
			@current-change="handlePageChange"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { useRouter } from "vue-router";
	import { Edit, Delete, Location, Timer, Money, Document } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { getTrips, deleteTrip } from "../api/trips";
	import MyTripIcon from "../components/MyTripIcon.vue";
	import CardListSkeleton from "../components/CardListSkeleton.vue";
	import type { Trip } from "../types";
	import dayjs from "dayjs";

	const router = useRouter();
	const trips = ref<Trip[]>([]);
	const loading = ref(true);
	const total = ref(0);
	const currentPage = ref(1);
	const pageSize = 50;

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
</script>
