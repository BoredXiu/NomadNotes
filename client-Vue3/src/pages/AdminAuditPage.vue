<template>
	<div class="audit-page">
		<div class="audit-header">
			<h2>内容审核</h2>
			<el-radio-group
				v-model="statusFilter"
				@change="handleFilterChange"
			>
				<el-radio-button value="pending">
					待审核
					<el-badge
						v-if="statusFilter !== 'pending' && pendingCount > 0"
						:value="pendingCount"
						class="filter-badge"
					/>
				</el-radio-button>
				<el-radio-button value="approved">已通过</el-radio-button>
				<el-radio-button value="rejected">已驳回</el-radio-button>
			</el-radio-group>
		</div>

		<!-- 加载状态 -->
		<div
			v-if="loading"
			class="loading-state"
		>
			<el-icon class="is-loading">
				<svg
					viewBox="0 0 24 24"
					width="16"
					height="16"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle
						cx="12"
						cy="12"
						r="10"
						stroke-dasharray="31.4 31.4"
						stroke-linecap="round"
					/>
				</svg>
			</el-icon>
			<span>加载审核列表...</span>
		</div>

		<!-- 空状态 -->
		<el-empty
			v-else-if="list.length === 0"
			description="暂无审核记录"
		/>

		<!-- 审核列表 -->
		<div
			v-else
			class="audit-list"
		>
			<div
				v-for="item in list"
				:key="item.id"
				class="audit-card"
			>
				<div class="audit-card-header">
					<div class="trip-info">
						<el-tag
							:type="statusTagType(item.status)"
							size="small"
						>
							{{ statusLabel(item.status) }}
						</el-tag>
						<span class="trip-title">{{ item.Trip?.title || "未知旅程" }}</span>
						<span class="trip-destination">
							<el-icon><Location /></el-icon>
							{{ item.Trip?.destination || "未知目的地" }}
						</span>
					</div>
					<div class="user-info">
						<span>申请人：{{ item.User?.username || "未知" }}</span>
						<span class="apply-time">申请时间：{{ formatTime(item.createdAt) }}</span>
					</div>
				</div>

				<!-- 审核结果信息 -->
				<div
					v-if="item.status !== 'pending'"
					class="audit-result"
				>
					<span> 审核人：{{ item.reviewedByName || "未知" }} </span>
					<span> 审核时间：{{ item.reviewedAt ? formatTime(item.reviewedAt) : "未知" }} </span>
					<span
						v-if="item.reason"
						class="reject-reason"
					>
						驳回理由：{{ item.reason }}
					</span>
				</div>

				<!-- 操作按钮（仅待审核状态） -->
				<div
					v-if="item.status === 'pending'"
					class="audit-actions"
				>
					<el-button
						type="primary"
						size="small"
						:loading="approvingId === item.id"
						@click="handleApprove(item)"
					>
						通过
					</el-button>
					<el-button
						type="danger"
						size="small"
						:loading="rejectingId === item.id"
						@click="showRejectDialog(item)"
					>
						驳回
					</el-button>
					<el-button
						size="small"
						@click="previewTrip(item)"
					>
						预览旅程
					</el-button>
				</div>
			</div>
		</div>

		<!-- 分页 -->
		<div
			v-if="total > pageSize"
			class="audit-pagination"
		>
			<el-pagination
				v-model:current-page="currentPage"
				:page-size="pageSize"
				:total="total"
				layout="prev, pager, next"
				@current-change="fetchAuditList"
			/>
		</div>

		<!-- 驳回理由弹窗 -->
		<el-dialog
			v-model="rejectDialogVisible"
			title="驳回审核"
			width="450px"
		>
			<el-input
				v-model="rejectReason"
				type="textarea"
				:rows="3"
				placeholder="请填写驳回理由..."
			/>
			<template #footer>
				<el-button @click="rejectDialogVisible = false">取消</el-button>
				<el-button
					type="danger"
					:loading="rejectingId !== null"
					@click="handleReject"
				>
					确认驳回
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
	import { getAuditList, approveAudit, rejectAudit, type AuditRecord } from "../api/admin";
	import { useAuthStore } from "../stores/authStore";

	const router = useRouter();
	const authStore = useAuthStore();

	// 列表数据
	const list = ref<AuditRecord[]>([]);
	const loading = ref(false);
	const currentPage = ref(1);
	const total = ref(0);
	const pageSize = 10;

	// 筛选状态
	const statusFilter = ref<"pending" | "approved" | "rejected">("pending");
	const pendingCount = ref(0);

	// 操作加载状态
	const approvingId = ref<string | null>(null);
	const rejectingId = ref<string | null>(null);

	// 驳回弹窗
	const rejectDialogVisible = ref(false);
	const rejectReason = ref("");
	const currentRejectItem = ref<AuditRecord | null>(null);

	// 权限检查
	if (!authStore.isAdmin) {
		router.replace("/");
	}

	// 获取审核列表
	async function fetchAuditList() {
		loading.value = true;
		try {
			const res = await getAuditList({
				status: statusFilter.value,
				page: currentPage.value,
				pageSize,
			});
			if (res.success) {
				list.value = res.data.list;
				total.value = res.data.total;
				// 待审核数量（API 返回在顶层而非 data 中）
				const resp = res as typeof res & { pendingCount?: number };
				if (resp.pendingCount !== undefined) {
					pendingCount.value = resp.pendingCount;
				}
			}
		} catch {
			ElMessage.error("获取审核列表失败");
		} finally {
			loading.value = false;
		}
	}

	// 筛选切换
	function handleFilterChange() {
		currentPage.value = 1;
		fetchAuditList();
	}

	// 审批通过
	async function handleApprove(item: AuditRecord) {
		approvingId.value = item.id;
		try {
			const res = await approveAudit(item.id);
			if (res.success) {
				ElMessage.success("审核已通过，旅程已设为公开");
				fetchAuditList();
			}
		} catch {
			ElMessage.error("审核操作失败");
		} finally {
			approvingId.value = null;
		}
	}

	// 显示驳回弹窗
	function showRejectDialog(item: AuditRecord) {
		currentRejectItem.value = item;
		rejectReason.value = "";
		rejectDialogVisible.value = true;
	}

	// 执行驳回
	async function handleReject() {
		if (!currentRejectItem.value) return;
		if (!rejectReason.value.trim()) {
			ElMessage.warning("请填写驳回理由");
			return;
		}

		rejectingId.value = currentRejectItem.value.id;
		try {
			const res = await rejectAudit(currentRejectItem.value.id, rejectReason.value.trim());
			if (res.success) {
				ElMessage.success("审核已驳回");
				rejectDialogVisible.value = false;
				fetchAuditList();
			}
		} catch {
			ElMessage.error("驳回操作失败");
		} finally {
			rejectingId.value = null;
		}
	}

	// 预览旅程
	function previewTrip(item: AuditRecord) {
		router.push(`/trip/${item.tripId}`);
	}

	// 状态标签样式
	function statusTagType(status: string) {
		const map: Record<string, "warning" | "success" | "danger"> = {
			pending: "warning",
			approved: "success",
			rejected: "danger",
		};
		return map[status] || "info";
	}

	// 状态标签文字
	function statusLabel(status: string) {
		const map: Record<string, string> = {
			pending: "待审核",
			approved: "已通过",
			rejected: "已驳回",
		};
		return map[status] || status;
	}

	// 格式化时间
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
		fetchAuditList();
	});
</script>

<style scoped lang="scss">
	.audit-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 24px 16px;
	}

	.audit-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;

		h2 {
			margin: 0;
			font-size: 20px;
			font-weight: 600;
		}
	}

	.filter-badge {
		margin-left: 4px;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 60px 0;
		color: #999;
		font-size: 14px;
	}

	.audit-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.audit-card {
		background: var(--el-bg-color);
		border: 1px solid var(--el-border-color-light);
		border-radius: 8px;
		padding: 16px;
	}

	.audit-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
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

		.apply-time {
			display: block;
			margin-top: 4px;
		}
	}

	.audit-result {
		font-size: 13px;
		color: #666;
		display: flex;
		gap: 18px;
		margin-bottom: 12px;

		.reject-reason {
			color: #e6a23c;
			flex: 1;
		}
	}

	.audit-actions {
		display: flex;
		gap: 8px;
	}

	.audit-pagination {
		display: flex;
		justify-content: center;
		margin-top: 24px;
	}

	/* 暗黑主题支持 */
	.dark-theme .audit-header h2 {
		color: #e8e8e8 !important;
	}

	.dark-theme .loading-state {
		color: #bfbfbf !important;
	}

	.dark-theme .audit-card {
		background-color: #1f1f1f !important;
		border-color: #303030 !important;
	}

	.dark-theme .trip-info .trip-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .trip-info .trip-destination {
		color: #bfbfbf !important;
	}

	.dark-theme .user-info {
		color: #bfbfbf !important;
	}

	.dark-theme .audit-result {
		color: #bfbfbf !important;
	}
</style>
