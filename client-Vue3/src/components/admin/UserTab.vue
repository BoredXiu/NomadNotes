<template>
	<div class="user-tab">
		<div class="tab-header">
			<h3>用户管理</h3>
			<el-input
				v-model="keyword"
				placeholder="搜索用户名或邮箱..."
				clearable
				size="small"
				class="search-input"
				@input="handleSearch"
			/>
		</div>

		<div
			v-if="loading"
			class="loading-state"
		>
			<span>加载用户列表...</span>
		</div>

		<el-table
			v-else
			:data="list"
			stripe
			size="small"
			style="width: 100%"
		>
			<el-table-column
				prop="username"
				label="用户名"
				min-width="120"
			/>
			<el-table-column
				prop="email"
				label="邮箱"
				min-width="180"
			/>
			<el-table-column
				label="角色"
				width="80"
			>
				<template #default="{ row }">
					<el-tag
						:type="row.role === 'admin' ? 'danger' : 'info'"
						size="small"
					>
						{{ row.role === "admin" ? "管理员" : "用户" }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column
				label="状态"
				width="80"
			>
				<template #default="{ row }">
					<el-tag
						:type="row.isDisabled === 1 ? 'danger' : 'success'"
						size="small"
					>
						{{ row.isDisabled === 1 ? "已禁用" : "正常" }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column
				label="注册时间"
				width="160"
			>
				<template #default="{ row }">
					{{ formatTime(row.createdAt) }}
				</template>
			</el-table-column>
			<el-table-column
				label="操作"
				width="120"
			>
				<template #default="{ row }">
					<el-button
						v-if="row.role !== 'admin'"
						:type="row.isDisabled === 1 ? 'success' : 'danger'"
						size="small"
						:loading="operatingId === row.id"
						@click="confirmToggleStatus(row)"
					>
						{{ row.isDisabled === 1 ? "启用" : "禁用" }}
					</el-button>
					<el-tag
						v-else
						size="small"
						type="info"
					>
						不可操作
					</el-tag>
				</template>
			</el-table-column>
		</el-table>

		<div
			v-if="total > pageSize"
			class="user-pagination"
		>
			<el-pagination
				v-model:current-page="currentPage"
				:page-size="pageSize"
				:total="total"
				layout="prev, pager, next"
				@current-change="fetchUserList"
			/>
		</div>

		<!-- 禁用的二次确认弹窗 -->
		<el-dialog
			v-model="confirmDialogVisible"
			:title="dialogTitle"
			width="400px"
		>
			<p>{{ dialogContent }}</p>
			<template #footer>
				<el-button @click="confirmDialogVisible = false">取消</el-button>
				<el-button
					:type="dialogType"
					:loading="operatingId !== null"
					@click="handleToggleStatus"
				>
					确认{{ dialogAction }}
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted, computed } from "vue";
	import { ElMessage } from "element-plus";
	import { getAdminUserList, toggleUserStatus, type AdminUser } from "../../api/admin";

	const list = ref<AdminUser[]>([]);
	const loading = ref(false);
	const currentPage = ref(1);
	const total = ref(0);
	const pageSize = 20;
	const keyword = ref("");

	const operatingId = ref<string | null>(null);

	// 二次确认弹窗
	const confirmDialogVisible = ref(false);
	const currentUser = ref<AdminUser | null>(null);
	const dialogTitle = computed(() => {
		if (!currentUser.value) return "";
		return currentUser.value.isDisabled === 1 ? `启用用户"${currentUser.value.username}"` : `禁用用户"${currentUser.value.username}"`;
	});
	const dialogContent = computed(() => {
		if (!currentUser.value) return "";
		return currentUser.value.isDisabled === 1
			? `确认启用用户"${currentUser.value.username}"？启用后该用户可以正常登录和发布内容。`
			: `确认禁用用户"${currentUser.value.username}"？禁用后该用户无法登录，其公开内容也将不再展示。`;
	});
	const dialogType = computed(() => {
		return currentUser.value?.isDisabled === 1 ? "success" : "danger";
	});
	const dialogAction = computed(() => {
		return currentUser.value?.isDisabled === 1 ? "启用" : "禁用";
	});

	let searchTimer: ReturnType<typeof setTimeout>;

	function handleSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			currentPage.value = 1;
			fetchUserList();
		}, 300);
	}

	async function fetchUserList() {
		loading.value = true;
		try {
			const res = await getAdminUserList({
				page: currentPage.value,
				pageSize,
				keyword: keyword.value || undefined,
			});
			if (res.success) {
				list.value = res.data.list;
				total.value = res.data.total;
			}
		} catch {
			ElMessage.error("获取用户列表失败");
		} finally {
			loading.value = false;
		}
	}

	function confirmToggleStatus(user: any) {
		currentUser.value = user as AdminUser;
		confirmDialogVisible.value = true;
	}

	async function handleToggleStatus() {
		if (!currentUser.value) return;

		operatingId.value = currentUser.value.id;
		try {
			const res = await toggleUserStatus(currentUser.value.id);
			if (res.success) {
				ElMessage.success(res.message);
				confirmDialogVisible.value = false;
				fetchUserList();
			}
		} catch {
			ElMessage.error("操作失败");
		} finally {
			operatingId.value = null;
		}
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
		fetchUserList();
	});
</script>

<style scoped lang="scss">
	.user-tab {
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

			.search-input {
				width: 240px;
			}
		}

		.loading-state {
			text-align: center;
			padding: 60px 0;
			color: #999;
		}

		.user-pagination {
			display: flex;
			justify-content: center;
			margin-top: 24px;
		}
	}
</style>
