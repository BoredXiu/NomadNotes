<template>
	<div class="trip-tab">
		<div class="tab-header">
			<h3>旅程管理</h3>
			<div class="filter-bar">
				<el-select
					v-model="isPublicFilter"
					size="small"
					placeholder="公开状态"
					clearable
					style="width: 120px"
					@change="handleFilterChange"
				>
					<el-option
						label="所有状态"
						value=""
					/>
					<el-option
						label="已公开"
						:value="1"
					/>
					<el-option
						label="未公开"
						:value="0"
					/>
				</el-select>
			</div>
		</div>

		<div
			v-if="loading"
			class="loading-state"
		>
			<span>加载旅程列表...</span>
		</div>

		<div
			v-else-if="list.length === 0"
			class="empty-state"
		>
			<el-empty description="暂无旅程记录" />
		</div>

		<div
			v-else
			class="trip-list"
		>
			<div
				v-for="item in list"
				:key="item.id"
				class="trip-card"
			>
				<div class="trip-card-header">
					<div class="trip-info">
						<el-tag
							:type="item.isPublic === 1 ? 'success' : 'info'"
							size="small"
						>
							{{ item.isPublic === 1 ? "已公开" : "未公开" }}
						</el-tag>
						<span class="trip-title">{{ item.title }}</span>
						<span class="trip-destination">
							<el-icon><Location /></el-icon>
							{{ item.destination }}
						</span>
					</div>
					<div class="user-info">
						<span>作者：{{ item.User?.username || "未知" }}</span>
						<span class="trip-time">创建时间：{{ formatTime(item.createdAt) }}</span>
					</div>
				</div>

				<div class="trip-date">{{ item.startDate?.slice(0, 10) }} ~ {{ item.endDate?.slice(0, 10) }}</div>

				<div class="trip-actions">
					<el-button
						:type="item.isPublic === 1 ? 'warning' : 'primary'"
						size="small"
						:loading="takedownId === item.id"
						@click="handleTakedown(item)"
					>
						{{ item.isPublic === 1 ? "下架" : "恢复" }}
					</el-button>
					<el-button
						type="danger"
						size="small"
						:loading="deleteId === item.id"
						@click="confirmDeleteTrip(item)"
					>
						删除
					</el-button>
					<el-button
						size="small"
						@click="previewTrip(item)"
					>
						预览
					</el-button>
				</div>
			</div>
		</div>

		<div
			v-if="total > pageSize"
			class="trip-pagination"
		>
			<el-pagination
				v-model:current-page="currentPage"
				:page-size="pageSize"
				:total="total"
				layout="prev, pager, next"
				@current-change="fetchTripList"
			/>
		</div>

		<!-- 删除旅程二次确认弹窗 -->
		<el-dialog
			v-model="deleteDialogVisible"
			title="确认删除旅程"
			width="450px"
		>
			<p>
				确认删除旅程"<strong>{{ deleteTripItem?.title }}</strong
				>"及其所有关联数据（游记、账单、审核记录）？此操作不可撤销。
			</p>
			<template #footer>
				<el-button @click="deleteDialogVisible = false">取消</el-button>
				<el-button
					type="danger"
					:loading="deleteId !== null"
					@click="handleDeleteTrip"
				>
					确认删除
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { useRouter } from "vue-router";
	import { ElMessage } from "element-plus";
	import { Location } from "@element-plus/icons-vue";
	import { getAdminTripList, takedownTrip, forceDeleteTrip, type AdminTrip } from "../../api/admin";

	const router = useRouter();

	const list = ref<AdminTrip[]>([]);
	const loading = ref(false);
	const currentPage = ref(1);
	const total = ref(0);
	const pageSize = 10;
	const isPublicFilter = ref<number | "">("");
	const takedownId = ref<string | null>(null);
	const deleteId = ref<string | null>(null);

	// 删除二次确认
	const deleteDialogVisible = ref(false);
	const deleteTripItem = ref<AdminTrip | null>(null);

	function handleFilterChange() {
		currentPage.value = 1;
		fetchTripList();
	}

	async function fetchTripList() {
		loading.value = true;
		try {
			const params: Record<string, any> = {
				page: currentPage.value,
				pageSize,
			};
			if (isPublicFilter.value !== "") {
				params.isPublic = isPublicFilter.value;
			}

			const res = await getAdminTripList(params);
			if (res.success) {
				list.value = res.data.list;
				total.value = res.data.total;
			}
		} catch {
			ElMessage.error("获取旅程列表失败");
		} finally {
			loading.value = false;
		}
	}

	async function handleTakedown(item: AdminTrip) {
		takedownId.value = item.id;
		// 乐观更新：立即切换 UI 状态，提升响应速度
		const newStatus = item.isPublic === 1 ? 0 : 1;
		list.value = list.value.map((t) =>
			t.id === item.id ? { ...t, isPublic: newStatus } : t,
		);
		try {
			const res = await takedownTrip(item.id);
			if (res.success) {
				ElMessage.success(res.message);
			}
			// 仍重新加载列表以确保数据一致性
			fetchTripList();
		} catch {
			// 失败时恢复原始状态
			list.value = list.value.map((t) =>
				t.id === item.id ? { ...t, isPublic: item.isPublic } : t,
			);
			ElMessage.error("操作失败");
		} finally {
			takedownId.value = null;
		}
	}

	function confirmDeleteTrip(item: AdminTrip) {
		deleteTripItem.value = item;
		deleteDialogVisible.value = true;
	}

	async function handleDeleteTrip() {
		if (!deleteTripItem.value) return;

		deleteId.value = deleteTripItem.value.id;
		try {
			const res = await forceDeleteTrip(deleteTripItem.value.id);
			if (res.success) {
				ElMessage.success("旅程已彻底删除");
				deleteDialogVisible.value = false;
				fetchTripList();
			}
		} catch {
			ElMessage.error("删除失败");
		} finally {
			deleteId.value = null;
		}
	}

	function previewTrip(item: AdminTrip) {
		router.push(`/trip/${item.id}`);
	}

	function formatTime(dateStr: string) {
		if (!dateStr) return "";
		const d = new Date(dateStr);
		return d.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	onMounted(() => {
		fetchTripList();
	});
</script>

<style scoped lang="scss">
	.trip-tab {
		.tab-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;

			h3 {
				margin: 0;
				font-size: 18px;
				font-weight: 600;
			}

			.filter-bar {
				display: flex;
				gap: 8px;
			}
		}

		.loading-state {
			text-align: center;
			padding: 60px 0;
			color: #999;
		}

		.empty-state {
			padding: 40px 0;
		}

		.trip-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.trip-card {
			background: var(--el-bg-color);
			border: 1px solid var(--el-border-color-light);
			border-radius: 8px;
			padding: 16px;
		}

		.trip-card-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 8px;
		}

		.trip-info {
			display: flex;
			align-items: center;
			gap: 10px;

			.trip-title {
				font-weight: 600;
				font-size: 15px;
			}

			.trip-destination {
				color: #999;
				font-size: 13px;
				display: flex;
				align-items: center;
				gap: 2px;
			}
		}

		.user-info {
			font-size: 12px;
			color: #999;
			text-align: right;

			.trip-time {
				display: block;
				margin-top: 4px;
			}
		}

		.trip-date {
			font-size: 13px;
			color: #666;
			margin-bottom: 12px;
		}

		.trip-actions {
			display: flex;
			gap: 8px;
		}

		.trip-pagination {
			display: flex;
			justify-content: center;
			margin-top: 24px;
		}
	}
</style>
