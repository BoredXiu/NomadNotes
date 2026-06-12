<template>
	<div class="log-tab">
		<div class="tab-header">
			<h3>操作日志</h3>
			<el-select
				v-model="operationTypeFilter"
				size="small"
				placeholder="操作类型"
				clearable
				style="width: 140px"
				:teleported="false"
				@change="handleFilterChange"
			>
				<el-option
					label="全部操作"
					value=""
				/>
				<el-option
					label="禁用用户"
					value="user_disable"
				/>
				<el-option
					label="启用用户"
					value="user_enable"
				/>
				<el-option
					label="下架旅程"
					value="trip_takedown"
				/>
				<el-option
					label="恢复旅程"
					value="trip_restore"
				/>
				<el-option
					label="删除旅程"
					value="trip_delete"
				/>
				<el-option
					label="删除游记"
					value="note_delete"
				/>
			</el-select>
		</div>

		<div
			v-if="loading"
			class="loading-state"
		>
			<span>加载操作日志...</span>
		</div>

		<el-empty
			v-else-if="list.length === 0"
			description="暂无操作日志"
		/>

		<el-table
			v-else
			:data="list"
			stripe
			size="small"
			style="width: 100%"
		>
			<el-table-column
				label="操作人"
				width="100"
			>
				<template #default="{ row }">
					{{ row.adminName }}
				</template>
			</el-table-column>
			<el-table-column
				label="操作类型"
				width="100"
			>
				<template #default="{ row }">
					<el-tag
						size="small"
						:type="logTypeTag(row.operationType)"
					>
						{{ logTypeLabel(row.operationType) }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column
				label="操作描述"
				min-width="300"
			>
				<template #default="{ row }">
					{{ row.description }}
				</template>
			</el-table-column>
			<el-table-column
				label="操作时间"
				width="160"
			>
				<template #default="{ row }">
					{{ formatTime(row.createdAt) }}
				</template>
			</el-table-column>
		</el-table>

		<div
			v-if="total > pageSize"
			class="log-pagination"
		>
			<el-pagination
				v-model:current-page="currentPage"
				:page-size="pageSize"
				:total="total"
				layout="prev, pager, next"
				@current-change="fetchLogs"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { ElMessage } from "element-plus";
	import { getOperationLogs, type AdminOperationLog } from "../../api/admin";

	const list = ref<AdminOperationLog[]>([]);
	const loading = ref(false);
	const currentPage = ref(1);
	const total = ref(0);
	const pageSize = 20;
	const operationTypeFilter = ref("");

	function handleFilterChange() {
		currentPage.value = 1;
		fetchLogs();
	}

	async function fetchLogs() {
		loading.value = true;
		try {
			const res = await getOperationLogs({
				page: currentPage.value,
				pageSize,
				operationType: operationTypeFilter.value || undefined,
			});
			if (res.success) {
				list.value = res.data.list;
				total.value = res.data.total;
			}
		} catch {
			ElMessage.error("获取操作日志失败");
		} finally {
			loading.value = false;
		}
	}

	function logTypeTag(type: string) {
		const map: Record<string, "danger" | "success" | "warning" | "info"> = {
			user_disable: "danger",
			user_enable: "success",
			trip_takedown: "warning",
			trip_restore: "success",
			trip_delete: "danger",
			note_delete: "danger",
		};
		return map[type] || "info";
	}

	function logTypeLabel(type: string) {
		const map: Record<string, string> = {
			user_disable: "禁用用户",
			user_enable: "启用用户",
			trip_takedown: "下架旅程",
			trip_restore: "恢复旅程",
			trip_delete: "删除旅程",
			note_delete: "删除游记",
		};
		return map[type] || type;
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
		fetchLogs();
	});
</script>

<style scoped lang="scss">
	.log-tab {
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
		}

		.loading-state {
			text-align: center;
			padding: 60px 0;
			color: #999;
		}

		.log-pagination {
			display: flex;
			justify-content: center;
			margin-top: 24px;
		}
	}

	/* 暗黑主题支持 */
	.dark-theme .log-tab .tab-header h3 {
		color: #e8e8e8 !important;
	}

	.dark-theme .log-tab .loading-state {
		color: #bfbfbf !important;
	}
</style>
