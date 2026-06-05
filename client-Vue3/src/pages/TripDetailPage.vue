<template>
	<div style="max-width: 800px; margin: 0 auto">
		<SkateboardNav
			:title="tripTitle"
			show-back
		/>

		<SkateboardTabBar
			:active-key="activeTab"
			:items="tabItems"
			@update:active-key="setActiveTab"
		/>

		<!-- 概览 Tab -->
		<div
			v-if="activeTab === 'overview'"
			v-loading="loading"
		>
			<el-empty
				v-if="!trip"
				description="旅程不存在"
			/>

			<template v-if="trip">
				<el-card style="margin-bottom: 16px">
					<el-descriptions
						:column="2"
						border
					>
						<el-descriptions-item label="目的地">{{ trip.destination }}</el-descriptions-item>
						<el-descriptions-item label="状态">
							<el-tag :type="trip.isEnded ? 'primary' : 'success'">
								{{ trip.isEnded ? "已结束" : "进行中" }}
							</el-tag>
						</el-descriptions-item>
						<el-descriptions-item label="开始">
							{{ formatDate(trip.startDate) }}
						</el-descriptions-item>
						<el-descriptions-item label="结束">
							{{ trip.endDate ? formatDate(trip.endDate) : "未设置" }}
						</el-descriptions-item>
					</el-descriptions>

					<el-button
						type="primary"
						style="margin-top: 12px"
						:icon="Edit"
						@click="router.push(`/trip/${trip.id}/edit`)"
					>
						编辑旅程
					</el-button>
				</el-card>

				<!-- 快速操作卡片 -->
				<el-row
					:gutter="16"
					style="margin-top: 16px"
				>
					<el-col
						:xs="24"
						:sm="8"
						style="margin-bottom: 16px"
					>
						<el-card
							style="cursor: pointer; text-align: center; padding: 8px"
							shadow="hover"
							@click="setActiveTab('expenses')"
						>
							<el-icon
								:size="32"
								color="#52c41a"
								><Money
							/></el-icon>
							<div style="margin-top: 8px; font-weight: 500">消费管理</div>
							<div style="color: #999; font-size: 13px">{{ expenseCount }} 笔账单</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="8"
						style="margin-bottom: 16px"
					>
						<el-card
							style="cursor: pointer; text-align: center; padding: 8px"
							shadow="hover"
							@click="setActiveTab('notes')"
						>
							<el-icon
								:size="32"
								color="#722ed1"
								><Document
							/></el-icon>
							<div style="margin-top: 8px; font-weight: 500">游记编写</div>
							<div style="color: #999; font-size: 13px">{{ noteCount }} 篇游记</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="8"
						style="margin-bottom: 16px"
					>
						<el-card
							style="cursor: pointer; text-align: center; padding: 8px"
							shadow="hover"
							@click="showExportModal = true"
						>
							<el-icon
								:size="32"
								color="#1890ff"
								><Download
							/></el-icon>
							<div style="margin-top: 8px; font-weight: 500">导出报告</div>
							<div style="color: #999; font-size: 13px">HTML / Markdown / PDF</div>
						</el-card>
					</el-col>
				</el-row>

				<!-- 消费统计图 -->
				<el-card
					title="消费统计"
					style="margin-top: 16px"
				>
					<div
						v-if="statsData"
						style="width: 100%; height: 300px"
					>
						<v-chart
							:option="pieChartOption"
							autoresize
						/>
					</div>
					<el-empty
						v-else
						description="暂无消费数据"
					/>
				</el-card>
			</template>
		</div>

		<!-- 账单 Tab -->
		<div v-if="activeTab === 'expenses'">
			<el-button
				type="primary"
				:icon="Plus"
				style="margin-bottom: 16px"
				@click="router.push(`/trip/${tripId}/expense/new`)"
			>
				添加账单
			</el-button>

			<el-empty
				v-if="expenses.length === 0"
				description="暂无账单记录"
			/>

			<el-table
				:data="expenses"
				v-loading="loading"
				style="width: 100%"
				show-summary
				:summary-method="getSummaries"
			>
				<el-table-column
					prop="expenseDate"
					label="日期"
					width="120"
				>
					<template #default="{ row }">
						{{ formatDate(row.expenseDate) }}
					</template>
				</el-table-column>
				<el-table-column
					prop="category"
					label="分类"
					width="100"
				>
					<template #default="{ row }">
						<el-tag>{{ row.category }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column
					prop="amount"
					label="金额"
					width="120"
				>
					<template #default="{ row }">
						{{ currencyStore.getCurrencySymbol() }}{{ currencyStore.convertAmount(row.amount, row.currency || "CNY") }}
						<span
							v-if="currencyStore.currency !== 'CNY'"
							style="font-size: 11px; color: #999"
						>
							(原: ¥{{ row.amount }})
						</span>
					</template>
				</el-table-column>
				<el-table-column
					prop="note"
					label="备注"
					min-width="150"
				>
					<template #default="{ row }">
						{{ row.note || "-" }}
					</template>
				</el-table-column>
				<el-table-column
					label="操作"
					width="100"
				>
					<template #default="{ row }">
						<el-button
							text
							:icon="Edit"
							@click="router.push(`/trip/${tripId}/expense/${row.id}/edit`)"
						/>
						<el-popconfirm
							title="确定删除此账单?"
							@confirm="handleDeleteExpense(row.id)"
						>
							<template #reference>
								<el-button
									text
									:icon="Delete"
									type="danger"
								/>
							</template>
						</el-popconfirm>
					</template>
				</el-table-column>
			</el-table>

			<el-pagination
				v-if="expenseTotal > expensePageSize"
				v-model:current-page="expensePage"
				:total="expenseTotal"
				:page-size="expensePageSize"
				layout="prev, pager, next"
				style="text-align: center; margin-top: 16px"
				@current-change="loadExpenses"
			/>
		</div>

		<!-- 游记 Tab -->
		<div v-if="activeTab === 'notes'">
			<el-button
				type="primary"
				:icon="Plus"
				style="margin-bottom: 16px"
				@click="router.push(`/trip/${tripId}/note/new`)"
			>
				写游记
			</el-button>

			<el-empty
				v-if="notes.length === 0"
				description="暂无游记"
			/>

			<el-table
				v-else
				:data="notes"
				style="width: 100%"
			>
				<el-table-column
					prop="noteDate"
					label="日期"
					width="180"
					align="center"
				>
					<template #default="{ row }">
						{{ formatFullDate(row.noteDate) }}
					</template>
				</el-table-column>
				<el-table-column
					prop="content"
					label="内容"
					align="center"
					min-width="200"
				>
					<template #default="{ row }">
						<div style="white-space: pre-wrap; text-align: center">{{ row.content }}</div>
					</template>
				</el-table-column>
				<el-table-column
					label="图片"
					width="160"
					align="center"
				>
					<template #default="{ row }">
						<el-space
							v-if="row.images && row.images.length > 0"
							:size="4"
						>
							<el-image
								v-for="(img, idx) in (row.images as string[]).slice(0, 3)"
								:key="idx"
								:src="img"
								style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; cursor: pointer"
								:preview-src-list="row.images"
								:initial-index="idx"
								fit="cover"
							/>
						</el-space>
						<span
							v-else
							style="color: #999"
							>-</span
						>
					</template>
				</el-table-column>
				<el-table-column
					label="操作"
					width="160"
					align="center"
				>
					<template #default="{ row }">
						<el-space>
							<el-button
								text
								:icon="Edit"
								@click="router.push(`/trip/${tripId}/note/${row.id}/edit`)"
							/>
							<el-popconfirm
								title="确定删除此游记?"
								@confirm="handleDeleteNote(row.id)"
							>
								<template #reference>
									<el-button
										text
										:icon="Delete"
										type="danger"
									/>
								</template>
							</el-popconfirm>
						</el-space>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- 导出弹窗 -->
		<ExportModal
			:open="showExportModal"
			:trip-id="tripId"
			:trip-title="tripTitle"
			:notes="notes"
			:has-expenses="expenses.length > 0"
			@close="showExportModal = false"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { Plus, Edit, Delete, Money, Document, Download } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { getTripById } from "../api/trips";
	import { getTripExpenses, getExpenseStats, deleteExpense } from "../api/expenses";
	import { getTripNotes, deleteNote } from "../api/notes";
	import { useCurrencyStore } from "../stores/currencyStore";
	import SkateboardNav from "../components/SkateboardNav.vue";
	import SkateboardTabBar from "../components/SkateboardTabBar.vue";
	import ExportModal from "../components/ExportModal.vue";
	import VChart from "vue-echarts";
	import { use } from "echarts/core";
	import { PieChart } from "echarts/charts";
	import { TooltipComponent, LegendComponent } from "echarts/components";
	import { CanvasRenderer } from "echarts/renderers";
	import type { Trip, Expense, ExpenseStats, Note } from "../types";
	import dayjs from "dayjs";

	use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

	const route = useRoute();
	const router = useRouter();
	const currencyStore = useCurrencyStore();

	const tripId = route.params.id as string;
	const loading = ref(true);
	const trip = ref<Trip | null>(null);
	const expenses = ref<Expense[]>([]);
	const notes = ref<Note[]>([]);
	const statsData = ref<ExpenseStats | null>(null);
	const showExportModal = ref(false);

	const activeTab = ref((route.query.tab as string) || "overview");

	const tabItems = [
		{ key: "overview", label: "概览" },
		{ key: "expenses", label: "账单" },
		{ key: "notes", label: "游记" },
	];

	const expensePage = ref(1);
	const expenseTotal = ref(0);
	const expensePageSize = 10;

	const expenseCount = computed(() => expenseTotal.value);
	const noteCount = computed(() => notes.value.length);
	const tripTitle = computed(() => trip.value?.title || "");
	const expenseTotalAmount = computed(() => expenses.value.reduce((sum, e) => sum + Number(e.amount), 0));

	function getSummaries() {
		return ["合计", "", currencyStore.getCurrencySymbol() + currencyStore.convertAmount(expenseTotalAmount.value).toFixed(2), "", ""];
	}

	const COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe", "#43e97b", "#fa709a"];

	const pieChartOption = computed(() => {
		if (!statsData.value) return {};
		return {
			tooltip: { trigger: "item" },
			legend: { bottom: 0 },
			series: [
				{
					name: "消费分类",
					type: "pie",
					radius: ["40%", "70%"],
					data: statsData.value.categories.map((c: { category: string; total: number }) => ({
						name: c.category,
						value: c.total,
					})),
					color: COLORS,
				},
			],
		};
	});

	function formatDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD");
	}

	function formatFullDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
	}

	function setActiveTab(key: string) {
		activeTab.value = key;
	}

	async function loadData() {
		loading.value = true;
		try {
			const [tripData, expenseData, notesData, stats] = await Promise.all([
				getTripById(tripId),
				getTripExpenses(tripId, { page: expensePage.value, pageSize: expensePageSize }),
				getTripNotes(tripId),
				getExpenseStats(tripId).catch(() => null),
			]);
			trip.value = tripData;
			expenses.value = expenseData.list;
			expenseTotal.value = expenseData.total;
			notes.value = notesData;
			statsData.value = stats;
		} catch {
			ElMessage.error("加载旅程详情失败");
		} finally {
			loading.value = false;
		}
	}

	async function loadExpenses(page = 1) {
		expensePage.value = page;
		try {
			const data = await getTripExpenses(tripId, { page, pageSize: expensePageSize });
			expenses.value = data.list;
			expenseTotal.value = data.total;
		} catch {
			ElMessage.error("加载账单失败");
		}
	}

	async function handleDeleteExpense(id: string) {
		try {
			await deleteExpense(id);
			ElMessage.success("删除成功");
			loadExpenses(expensePage.value);
			loadData();
		} catch {
			ElMessage.error("删除失败");
		}
	}

	async function handleDeleteNote(id: string) {
		try {
			await deleteNote(id);
			ElMessage.success("删除成功");
			notes.value = notes.value.filter((n) => n.id !== id);
		} catch {
			ElMessage.error("删除失败");
		}
	}

	onMounted(() => {
		loadData();
	});
</script>
