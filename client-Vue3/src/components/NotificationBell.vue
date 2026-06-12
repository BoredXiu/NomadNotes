<template>
	<!-- 通知铃铛组件 -->
	<el-popover
		:visible="popoverVisible"
		:width="380"
		trigger="click"
		placement="bottom-end"
		:popper-style="{ padding: 0 }"
		@show="handleOpen"
		@hide="handleClose"
	>
		<template #reference>
			<el-badge
				:value="unreadCount"
				:hidden="unreadCount === 0"
				:max="99"
				class="notification-badge"
			>
				<el-button
					class="icon-btn"
					style="color: #fff; border: none; font-size: 1.125rem; background: transparent"
				>
					<BellIcon :size="20" />
				</el-button>
			</el-badge>
		</template>

		<!-- 消息中心弹窗内容 -->
		<div class="notification-popover">
			<!-- 顶部标题栏 -->
			<div class="notification-header">
				<span class="notification-title">消息中心</span>
				<el-button
					v-if="notifications.some((n) => !n.isRead)"
					type="primary"
					link
					size="small"
					@click="handleMarkAllRead"
				>
					全部已读
				</el-button>
			</div>

			<!-- 通知列表 -->
			<div
				class="notification-list"
				@scroll="handleScroll"
			>
				<template v-if="notifications.length === 0 && !loading">
					<div class="notification-empty">
						<span style="color: #999; font-size: 0.875rem">暂无通知</span>
					</div>
				</template>
				<template v-else>
					<div
						v-for="item in notifications"
						:key="item.id"
						class="notification-item"
						:class="{ 'notification-unread': !item.isRead }"
						@click="handleClickItem(item)"
					>
						<div class="notification-item-top">
							<el-tag
								v-if="item.type === 'audit_approved'"
								type="success"
								size="small"
								effect="plain"
							>
								已通过
							</el-tag>
							<el-tag
								v-else-if="item.type === 'audit_rejected'"
								type="danger"
								size="small"
								effect="plain"
							>
								已驳回
							</el-tag>
							<span class="notification-item-title">{{ item.title }}</span>
						</div>
						<div class="notification-item-content">{{ item.content || "无详细内容" }}</div>
						<div class="notification-item-time">{{ formatTime(item.createdAt) }}</div>
					</div>
				</template>
				<div
					v-if="loading"
					v-loading="loading"
					class="notification-loading"
					element-loading-text="加载中..."
				/>
			</div>
		</div>
	</el-popover>

	<!-- 通知详情对话框 -->
	<el-dialog
		v-model="detailVisible"
		:title="detailTitle"
		:width="520"
		destroy-on-close
	>
		<template v-if="selectedNotification">
			<el-descriptions
				:column="1"
				border
				size="small"
			>
				<el-descriptions-item label="通知类型">
					{{ selectedNotification.type === "audit_approved" ? "审核通过通知" : "审核驳回通知" }}
				</el-descriptions-item>
				<el-descriptions-item label="通知时间">
					{{ new Date(selectedNotification.createdAt).toLocaleString("zh-CN") }}
				</el-descriptions-item>
				<el-descriptions-item label="已读状态">
					<el-tag
						v-if="selectedNotification.isRead"
						type="info"
						size="small"
						>已读</el-tag
					>
					<el-tag
						v-else
						type="warning"
						size="small"
						>未读</el-tag
					>
				</el-descriptions-item>
			</el-descriptions>
			<div class="notification-detail-content">
				<p class="notification-detail-label">详细内容</p>
				<div class="notification-detail-text">
					{{ selectedNotification.content || "无详细内容" }}
				</div>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted } from "vue";
	import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "../api/notifications";
	import type { NotificationItem } from "../api/notifications";
	import BellIcon from "./BellIcon.vue";

	const popoverVisible = ref(false);
	const unreadCount = ref(0);
	const notifications = ref<NotificationItem[]>([]);
	const loading = ref(false);
	const page = ref(1);
	const hasMore = ref(true);
	const detailVisible = ref(false);
	const selectedNotification = ref<NotificationItem | null>(null);

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	/** 计算详情对话框标题 */
	const detailTitle = computed(() => {
		if (!selectedNotification.value) return "";
		const type = selectedNotification.value.type === "audit_approved" ? "审核通过" : "审核驳回";
		return `${type} - ${selectedNotification.value.title}`;
	});

	/** 加载未读数量 */
	async function fetchUnreadCount() {
		try {
			const data = await getUnreadCount();
			unreadCount.value = data.count;
		} catch {
			// 静默失败
		}
	}

	/** 加载通知列表 */
	async function fetchNotifications(p: number, append = false) {
		loading.value = true;
		try {
			const data = await getNotifications(p, 10);
			if (append) {
				notifications.value.push(...data.list);
			} else {
				notifications.value = data.list;
			}
			hasMore.value = p * 10 < data.total;
			page.value = p;
		} catch {
			// 静默失败
		} finally {
			loading.value = false;
		}
	}

	/** 打开弹窗 */
	async function handleOpen() {
		popoverVisible.value = true;
		page.value = 1;
		notifications.value = [];
		await fetchNotifications(1, false);
		// 打开弹窗后 UI 层面将未读数量置 0
		unreadCount.value = 0;
	}

	/** 关闭弹窗 */
	function handleClose() {
		popoverVisible.value = false;
	}

	/** 点击通知项 */
	async function handleClickItem(item: NotificationItem) {
		selectedNotification.value = item;
		detailVisible.value = true;
		if (!item.isRead) {
			try {
				await markAsRead(item.id);
				const found = notifications.value.find((n) => n.id === item.id);
				if (found) found.isRead = 1;
			} catch {
				// 静默失败
			}
		}
	}

	/** 全部已读 */
	async function handleMarkAllRead() {
		try {
			await markAllAsRead();
			notifications.value.forEach((n) => (n.isRead = 1));
			unreadCount.value = 0;
		} catch {
			// 静默失败
		}
	}

	/** 滚动加载更多 */
	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
			if (!loading.value && hasMore.value) {
				fetchNotifications(page.value + 1, true);
			}
		}
	}

	/** 格式化时间 */
	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return "刚刚";
		if (diffMin < 60) return `${diffMin} 分钟前`;
		const diffHour = Math.floor(diffMin / 60);
		if (diffHour < 24) return `${diffHour} 小时前`;
		const diffDay = Math.floor(diffHour / 24);
		if (diffDay < 7) return `${diffDay} 天前`;
		return date.toLocaleDateString("zh-CN");
	}

	onMounted(() => {
		fetchUnreadCount();
		// 每 60 秒轮询
		pollTimer = setInterval(fetchUnreadCount, 60000);
	});

	onUnmounted(() => {
		if (pollTimer) clearInterval(pollTimer);
	});
</script>

<style scoped lang="scss">
	.notification-badge {
		display: flex;
		align-items: center;
	}

	/* 铃铛按钮与导航栏背景色保持一致 */
	.notification-badge :deep(.el-button) {
		background: transparent !important;
	}

	.notification-badge :deep(.el-button:hover) {
		background: rgba(255, 255, 255, 0.1) !important;
	}

	.notification-popover {
		max-height: 480px;
		display: flex;
		flex-direction: column;
	}

	.notification-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 0.0625rem solid #f0f0f0;
	}

	.notification-title {
		font-weight: 600;
		font-size: 1rem;
	}

	.notification-list {
		overflow-y: auto;
		max-height: 400px;
	}

	.notification-empty {
		text-align: center;
		padding: 2rem 0;
	}

	.notification-item {
		cursor: pointer;
		padding: 0.75rem 1rem;
		border-bottom: 0.0625rem solid #f5f5f5;
		transition: background 0.2s ease;
	}

	.notification-item:hover {
		background: #f0f5ff;
	}

	.notification-unread {
		background: #e6f7ff;
	}

	.notification-unread:hover {
		background: #bae7ff;
	}

	.notification-item-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.notification-item-title {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.notification-item-content {
		font-size: 0.75rem;
		color: #666;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-bottom: 0.25rem;
	}

	.notification-item-time {
		font-size: 0.6875rem;
		color: #999;
	}

	.notification-loading {
		min-height: 40px;
	}

	.notification-detail-content {
		margin-top: 1rem;
	}

	.notification-detail-label {
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.notification-detail-text {
		padding: 0.75rem;
		background: #fafafa;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	/* 暗黑主题适配 */
	:global(.dark-theme) .notification-popover {
		background-color: #1f1f1f;
	}

	:global(.dark-theme) .notification-header {
		border-bottom-color: #303030;
		color: #e8e8e8;
	}

	:global(.dark-theme) .notification-title {
		color: #e8e8e8;
	}

	:global(.dark-theme) .notification-item {
		border-bottom-color: #2a2a2a;
		color: #bfbfbf;
	}

	:global(.dark-theme) .notification-item:hover {
		background-color: #2a2a2a;
	}

	:global(.dark-theme) .notification-unread {
		background-color: #111d2c;
	}

	:global(.dark-theme) .notification-unread:hover {
		background-color: #1a2a3e;
	}

	:global(.dark-theme) .notification-item-title {
		color: #e8e8e8;
	}

	:global(.dark-theme) .notification-item-content {
		color: #bfbfbf;
	}

	:global(.dark-theme) .notification-item-time {
		color: #595959;
	}

	:global(.dark-theme) .notification-detail-text {
		background-color: #2a2a2a;
		color: #e8e8e8;
	}

	:global(.dark-theme) .notification-detail-label {
		color: #e8e8e8;
	}

	:global(.dark-theme) .notification-empty {
		color: #595959 !important;
	}

	/* 暗黑主题下 popover 弹出层背景 */
	:global(.dark-theme) .el-popover.el-popper {
		background-color: #1f1f1f !important;
		border-color: #3a3a3a !important;
		color: #e8e8e8 !important;
	}

	/* 暗黑主题下通知详情对话框 */
	:global(.dark-theme) .el-dialog {
		background-color: #1f1f1f !important;
		border-color: #303030 !important;
	}

	:global(.dark-theme) .el-dialog__title {
		color: #e8e8e8 !important;
	}

	:global(.dark-theme) .el-dialog__body {
		color: #e8e8e8 !important;
	}

	/* 暗黑主题下描述列表 */
	:global(.dark-theme) .el-descriptions {
		color: #e8e8e8 !important;
	}

	:global(.dark-theme) .el-descriptions__label {
		color: #bfbfbf !important;
		background-color: #2a2a2a !important;
	}

	:global(.dark-theme) .el-descriptions__content {
		color: #e8e8e8 !important;
		background-color: #1f1f1f !important;
	}

	:global(.dark-theme) .el-descriptions--border .el-descriptions__cell {
		border-color: #303030 !important;
	}
</style>
