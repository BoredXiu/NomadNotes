<template>
	<div
		class="trip-detail-page"
		ref="pageRef"
	>
		<!-- 面包屑导航 -->
		<el-breadcrumb
			v-if="trip"
			separator="/"
			class="trip-detail-breadcrumb"
		>
			<el-breadcrumb-item>
				<router-link to="/">我的旅程</router-link>
			</el-breadcrumb-item>
			<el-breadcrumb-item>{{ trip.title }}</el-breadcrumb-item>
		</el-breadcrumb>

		<!-- 顶部信息卡片 -->
		<el-card
			class="trip-detail-header-card"
			v-if="trip"
		>
			<div class="trip-detail-header">
				<div class="trip-detail-header-left">
					<el-button
						text
						@click="router.push('/')"
					>
						<el-icon><ArrowLeft /></el-icon>
					</el-button>
					<h2 class="trip-detail-title">
						{{ trip.title }}
						<el-tag
							:type="trip.isEnded ? 'info' : 'success'"
							:effect="trip.isEnded ? 'plain' : 'light'"
							size="small"
							style="margin-left: 8px"
						>
							{{ trip.isEnded ? "已结束" : "进行中" }}
						</el-tag>
					</h2>
				</div>
				<div class="trip-detail-header-right">
					<el-button
						v-if="!trip.isEnded"
						@click="handleEndTrip"
						size="default"
					>
						结束旅程
					</el-button>
					<el-switch
						v-model="isPublic"
						@update:model-value="handleTogglePublic"
						active-text="公开"
						inactive-text="私密"
						inline-prompt
					/>
					<el-button
						:icon="Edit"
						@click="router.push(`/trip/${trip.id}/edit`)"
					>
						编辑
					</el-button>
				</div>
			</div>
		</el-card>

		<!-- 导航和标签栏 -->
		<SkateboardNav
			v-if="!trip"
			title="旅程详情"
			show-back
		/>

		<!-- 标签栏和导出按钮 -->
		<div class="trip-detail-tab-bar-row">
			<SkateboardTabBar
				:active-key="activeTab"
				:items="tabItems"
				@update:active-key="setActiveTab"
			/>
			<div class="tab-bar-actions">
				<el-button
					v-if="notes.length > 0 || expenses.length > 0"
					:icon="Download"
					@click="showExportModal = true"
					class="export-notes-btn"
				>
					导出游记
				</el-button>
			</div>
		</div>

		<!-- 账单 Tab -->
		<div v-if="activeTab === 'expenses'">
			<div class="trip-detail-tab-header">
				<el-button
					type="primary"
					:icon="Plus"
					@click="router.push(`/trip/${tripId}/expense/new`)"
				>
					记一笔
				</el-button>
			</div>

			<div
				v-if="expenses.length === 0 && !loading"
				class="expenses-empty-container"
			>
				<el-empty description="暂无账单记录" />
			</div>

			<el-table
				v-else
				:data="expenses"
				v-loading="loading"
				style="width: 100%"
				show-summary
				:summary-method="getSummaries"
				:empty-text="''"
			>
				<el-table-column
					prop="expenseDate"
					label="日期"
					width="120"
					align="center"
				>
					<template #default="{ row }">
						<span>{{ formatDate(row.expenseDate) }}</span>
					</template>
				</el-table-column>
				<el-table-column
					prop="category"
					label="分类"
					width="100"
					align="center"
				>
					<template #default="{ row }">
						<el-tag>
							<span>{{ row.category }}</span>
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column
					prop="amount"
					label="金额"
					width="120"
					align="center"
				>
					<template #default="{ row }">
						<span class="expense-amount"> {{ currencyStore.getCurrencySymbol() }}{{ currencyStore.convertAmount(row.amount, row.currency || "CNY") }} </span>
					</template>
				</el-table-column>
				<el-table-column
					prop="note"
					label="备注"
					min-width="120"
					align="center"
				>
					<template #default="{ row }">
						<span>{{ row.note || "-" }}</span>
					</template>
				</el-table-column>
				<el-table-column
					label="小票"
					width="100"
					align="center"
				>
					<template #default="{ row }">
						<el-space
							v-if="row.receiptImages && row.receiptImages.length > 0"
							wrap
							:size="4"
						>
							<el-image
								v-for="(img, i) in row.receiptImages"
								:key="i"
								:src="img"
								style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer"
								fit="cover"
								:preview-src-list="row.receiptImages"
								:initial-index="Number(i)"
								preview-teleported
							/>
						</el-space>
						<span
							v-else
							class="table-no-data"
							>-</span
						>
					</template>
				</el-table-column>
				<el-table-column
					label="操作"
					width="140"
					align="center"
				>
					<template #default="{ row }">
						<el-space>
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
						</el-space>
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
			<div class="trip-detail-tab-header">
				<el-button
					type="primary"
					:icon="Plus"
					@click="router.push(`/trip/${tripId}/note/new`)"
				>
					写游记
				</el-button>
			</div>

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
						<span>{{ formatFullDate(row.noteDate) }}</span>
					</template>
				</el-table-column>
				<el-table-column
					prop="content"
					label="内容"
					align="center"
					min-width="200"
				>
					<template #default="{ row }">
						<div
							class="note-content-cell"
							style="white-space: pre-wrap; text-align: center"
							v-html="row.content"
						/>
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
								preview-teleported
								fit="cover"
							/>
						</el-space>
						<span
							v-else
							class="table-no-data"
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

		<!-- 统计 Tab -->
		<div v-if="activeTab === 'stats'">
			<div class="trip-detail-tab-header">
				<CurrencySwitcher />
			</div>

			<el-empty
				v-if="expenses.length === 0 && notes.length === 0"
				description="暂无消费数据与游记数据"
			/>

			<template v-if="expenses.length > 0 || notes.length > 0">
				<!-- 统计卡片 -->
				<el-row
					:gutter="16"
					style="margin-bottom: 24px"
				>
					<el-col
						:xs="24"
						:sm="12"
						:lg="6"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">总支出</div>
								<div class="stat-card-value stat-card-value-red">
									{{ currencyStore.getCurrencySymbol() }}{{ currencyStore.convertAmount(statsSummary.total).toFixed(currencyStore.currency === "JPY" ? 0 : 2) }}
								</div>
							</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="12"
						:lg="6"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">日均支出</div>
								<div class="stat-card-value stat-card-value-blue">
									{{ currencyStore.getCurrencySymbol()
									}}{{ currencyStore.convertAmount(statsSummary.avgPerDay).toFixed(currencyStore.currency === "JPY" ? 0 : 2) }}
								</div>
							</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="12"
						:lg="6"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">消费笔数</div>
								<div class="stat-card-value stat-card-value-purple">{{ statsSummary.count }} 笔</div>
							</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="12"
						:lg="6"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">最高消费类别</div>
								<div class="stat-card-value stat-card-value-orange">
									{{ statsSummary.maxCategory || "暂无" }}
								</div>
							</div>
						</el-card>
					</el-col>
				</el-row>

				<!-- 游记统计卡片 -->
				<el-row
					:gutter="16"
					style="margin-bottom: 24px"
				>
					<el-col
						:xs="24"
						:sm="12"
						:lg="8"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">游记篇数</div>
								<div class="stat-card-value stat-card-value-green">{{ statsSummary.noteCount }} 篇</div>
							</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="12"
						:lg="8"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">游记图片数</div>
								<div class="stat-card-value stat-card-value-cyan">{{ statsSummary.totalImages }} 张</div>
							</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:sm="12"
						:lg="8"
					>
						<el-card>
							<div class="stat-card">
								<div class="stat-card-title">游记配图率</div>
								<div class="stat-card-value stat-card-value-pink">
									{{ statsSummary.noteCount > 0 ? (statsSummary.totalImages / statsSummary.noteCount).toFixed(1) : "0.0" }} 张/篇
								</div>
							</div>
						</el-card>
					</el-col>
				</el-row>

				<!-- 消费分类分布饼图 -->
				<el-row
					:gutter="16"
					v-if="statsData && statsData.categories.length > 0"
				>
					<el-col
						:xs="24"
						:lg="12"
					>
						<el-card
							title="消费分类分布"
							style="margin-bottom: 16px"
						>
							<div style="width: 100%; height: 350px">
								<v-chart
									:option="pieChartOption"
									autoresize
								/>
							</div>
						</el-card>
					</el-col>
					<el-col
						:xs="24"
						:lg="12"
					>
						<el-card
							title="每日消费趋势"
							style="margin-bottom: 16px"
						>
							<div style="width: 100%; height: 350px">
								<v-chart
									:option="barChartOption"
									autoresize
								/>
							</div>
						</el-card>
					</el-col>
				</el-row>

				<!-- 分类明细表格 -->
				<el-card
					v-if="statsData && statsData.categories.length > 0"
					title="分类明细"
					size="small"
					style="margin-top: 16px"
				>
					<el-table
						:data="statsData.categories"
						row-key="category"
					>
						<el-table-column
							prop="category"
							label="分类"
							align="center"
						>
							<template #default="{ row }">
								<el-tag>{{ row.category }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column
							prop="count"
							label="笔数"
							align="center"
						/>
						<el-table-column
							prop="total"
							label="金额"
							align="center"
						>
							<template #default="{ row }">
								<span class="expense-amount">
									{{ currencyStore.getCurrencySymbol() }}{{ currencyStore.convertAmount(row.total).toFixed(currencyStore.currency === "JPY" ? 0 : 2) }}
								</span>
							</template>
						</el-table-column>
						<el-table-column
							label="占比"
							align="right"
						>
							<template #default="{ row }"> {{ statsData.total > 0 ? ((row.total / statsData.total) * 100).toFixed(1) : "0.0" }}% </template>
						</el-table-column>
					</el-table>
				</el-card>
			</template>
		</div>

		<!-- 概览 Tab -->
		<div v-if="activeTab === 'overview'">
			<el-descriptions
				v-if="trip"
				:column="3"
				border
				class="overview-descriptions"
			>
				<el-descriptions-item label="目的地">
					{{ trip.destination || "-" }}
				</el-descriptions-item>
				<el-descriptions-item label="开始日期">
					{{ formatDate(trip.startDate) }}
				</el-descriptions-item>
				<el-descriptions-item label="结束日期">
					{{ trip.endDate ? formatDate(trip.endDate) : "-" }}
				</el-descriptions-item>
				<el-descriptions-item label="状态">
					<el-tag
						:type="trip.isEnded ? 'info' : 'success'"
						effect="plain"
					>
						{{ trip.isEnded ? "已结束" : "进行中" }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="消费笔数"> {{ expenseCount }} 笔 </el-descriptions-item>
				<el-descriptions-item label="游记篇数"> {{ noteCount }} 篇 </el-descriptions-item>
				<el-descriptions-item label="创建时间">
					{{ formatDate(trip.createdAt) }}
				</el-descriptions-item>
			</el-descriptions>
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
	import { Plus, Edit, Delete, ArrowLeft, Download } from "@element-plus/icons-vue";
	import { ElMessage, ElMessageBox } from "element-plus";
	import { getTripById, updateTrip } from "../api/trips";
	import { getTripExpenses, getExpenseStats, deleteExpense } from "../api/expenses";
	import { getTripNotes, deleteNote } from "../api/notes";
	import { submitAudit } from "../api/admin";
	import { useCurrencyStore } from "../stores/currencyStore";
	import SkateboardNav from "../components/SkateboardNav.vue";
	import SkateboardTabBar from "../components/SkateboardTabBar.vue";
	import ExportModal from "../components/ExportModal.vue";
	import CurrencySwitcher from "../components/CurrencySwitcher.vue";
	import VChart from "vue-echarts";
	import { use } from "echarts/core";
	import { PieChart, BarChart } from "echarts/charts";
	import { TooltipComponent, LegendComponent, GridComponent } from "echarts/components";
	import { CanvasRenderer } from "echarts/renderers";
	import type { Trip, Expense, ExpenseStats, Note } from "../types";
	import dayjs from "dayjs";
	import { usePageEnter } from "../composables/useGsapAnimations";

	use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

	const route = useRoute();
	const router = useRouter();
	const currencyStore = useCurrencyStore();

	// GSAP 页面入场动画
	const pageRef = usePageEnter(0);

	const tripId = route.params.id as string;
	const loading = ref(true);
	const trip = ref<Trip | null>(null);
	const expenses = ref<Expense[]>([]);
	const notes = ref<Note[]>([]);
	const statsData = ref<ExpenseStats | null>(null);
	const showExportModal = ref(false);
	const isPublic = ref(false);

	const activeTab = ref((route.query.tab as string) || "expenses");

	const tabItems = [
		{ key: "expenses", label: "账单" },
		{ key: "notes", label: "游记" },
		{ key: "stats", label: "统计" },
		{ key: "overview", label: "概览" },
	];

	const expensePage = ref(1);
	const expenseTotal = ref(0);
	const expensePageSize = 10;

	const expenseCount = computed(() => expenseTotal.value);
	const noteCount = computed(() => notes.value.length);
	const tripTitle = computed(() => trip.value?.title || "");
	const expenseTotalAmount = computed(() => expenses.value.reduce((sum, e) => sum + Number(e.amount), 0));

	// 计算统计数据摘要
	const statsSummary = computed(() => {
		const total = expenses.value.reduce((sum, e) => sum + Number(e.amount), 0);
		if (expenses.value.length === 0) {
			return { total: 0, avgPerDay: 0, maxCategory: null, count: 0, noteCount: 0, totalImages: 0 };
		}

		const categoryTotals: Record<string, number> = {};
		const dates = new Set<string>();
		for (const e of expenses.value) {
			categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
			dates.add(dayjs(e.expenseDate).format("YYYY-MM-DD"));
		}

		let maxCategory = "";
		let maxAmount = 0;
		for (const [cat, amt] of Object.entries(categoryTotals)) {
			if (amt > maxAmount) {
				maxAmount = amt;
				maxCategory = cat;
			}
		}

		let totalImages = 0;
		for (const n of notes.value) {
			totalImages += n.images?.length || 0;
		}

		const currencySymbol = currencyStore.getCurrencySymbol();
		const convertedMaxAmount = currencyStore.convertAmount(maxAmount);

		return {
			total: Math.round(total * 100) / 100,
			avgPerDay: dates.size > 0 ? Math.round((total / dates.size) * 100) / 100 : 0,
			maxCategory: maxCategory ? `${maxCategory} (${currencySymbol}${convertedMaxAmount.toFixed(currencyStore.currency === "JPY" ? 0 : 2)})` : null,
			count: expenses.value.length,
			noteCount: notes.value.length,
			totalImages,
		};
	});

	// 每日消费数据
	const dailyExpenseData = computed(() => {
		const map: Record<string, number> = {};
		for (const e of expenses.value) {
			const date = dayjs(e.expenseDate).format("YYYY-MM-DD");
			map[date] = (map[date] || 0) + Number(e.amount);
		}
		return Object.entries(map)
			.map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
			.sort((a, b) => a.date.localeCompare(b.date));
	});

	// 饼图配置
	const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

	const pieChartOption = computed(() => {
		if (!statsData.value || statsData.value.categories.length === 0) return {};
		const currencySymbol = currencyStore.getCurrencySymbol();
		const formatAmount = (amount: number) => {
			const converted = currencyStore.convertAmount(amount);
			return `${currencySymbol}${converted.toFixed(currencyStore.currency === "JPY" ? 0 : 2)}`;
		};
		return {
			tooltip: {
				trigger: "item",
				formatter: (params: any) => `${params.name}: ${formatAmount(params.value)}`,
			},
			legend: {
				bottom: 0,
				formatter: (name: string) => {
					const item = statsData.value?.categories.find((c) => c.category === name);
					return item ? `${name} ${formatAmount(item.total)}` : name;
				},
			},
			series: [
				{
					name: "消费分类",
					type: "pie",
					radius: [0, "70%"],
					data: statsData.value.categories.map((c: { category: string; total: number }) => ({
						name: c.category,
						value: c.total,
					})),
					color: COLORS,
					label: {
						show: true,
						formatter: (params: any) => `${params.name} ${formatAmount(params.value)}`,
					},
					labelLine: { show: false },
				},
			],
		};
	});

	// 柱状图配置
	const barChartOption = computed(() => {
		if (dailyExpenseData.value.length === 0) return {};
		const currencySymbol = currencyStore.getCurrencySymbol();
		const formatAmount = (amount: number) => {
			const converted = currencyStore.convertAmount(amount);
			return `${currencySymbol}${converted.toFixed(currencyStore.currency === "JPY" ? 0 : 2)}`;
		};
		return {
			tooltip: {
				trigger: "axis",
				formatter: (params: any) => {
					const data = params[0];
					return `${data.name}<br/>金额: ${formatAmount(data.value)}`;
				},
			},
			grid: { top: 20, right: 20, bottom: 40, left: 60 },
			xAxis: {
				type: "category",
				data: dailyExpenseData.value.map((d) => d.date),
			},
			yAxis: {
				type: "value",
				axisLabel: {
					formatter: (value: number) => formatAmount(value),
				},
			},
			series: [
				{
					name: "金额",
					type: "bar",
					data: dailyExpenseData.value.map((d) => d.amount),
					itemStyle: { color: "#1890ff" },
					barMaxWidth: 40,
				},
			],
		};
	});

	function getSummaries(param: { columns: { property: string }[]; data: Expense[] }) {
		const { columns } = param;
		const sums: string[] = [];
		const currencySymbol = currencyStore.getCurrencySymbol();
		// 使用当前账单数据计算合计
		const total = currencyStore.convertAmount(expenseTotalAmount.value).toFixed(currencyStore.currency === "JPY" ? 0 : 2);

		columns.forEach((_column, index) => {
			if (index === 0) {
				sums[index] = "合计";
			} else if (index === 2) {
				sums[index] = `${currencySymbol}${total}`;
			} else {
				sums[index] = "";
			}
		});

		return sums;
	}

	function formatDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD");
	}

	function formatFullDate(dateStr: string) {
		return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
	}

	function setActiveTab(key: string) {
		activeTab.value = key;
		router.replace({ query: { ...route.query, tab: key } });
	}

	async function handleEndTrip() {
		if (!trip.value) return;
		try {
			await ElMessageBox.confirm("确定要结束这次旅程吗？结束后将无法再添加账单和游记。", "提示", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning",
			});
			await updateTrip(trip.value.id, { isEnded: 1 });
			ElMessage.success("旅程已标记为结束");
			loadData();
		} catch {
			// 用户取消操作
		}
	}

	async function handleTogglePublic(val: string | number | boolean) {
		if (!trip.value) return;
		const checked = val === true;
		// 前端校验：公开旅程需要至少有一条账单或一篇游记
		if (checked && expenseCount.value === 0 && noteCount.value === 0) {
			ElMessage.warning("请先添加账单或游记后再申请公开");
			isPublic.value = false;
			return;
		}
		try {
			if (checked) {
				// 提交公开审核申请（不再直接设为公开）
				await submitAudit(trip.value.id);
				ElMessage.success("已提交到管理员审核");
				// 恢复开关状态为私密，直到审核通过
				isPublic.value = false;
			} else {
				// 乐观更新：立即更新本地状态，避免界面延迟
				isPublic.value = false;
				if (trip.value) trip.value.isPublic = 0;
				await updateTrip(trip.value.id, { isPublic: 0 });
				ElMessage.success("已设为私密");
				loadData();
			}
		} catch (error: any) {
			// 失败时恢复原始状态
			isPublic.value = !checked;
			loadData();
			ElMessage.error(error?.response?.data?.message || "操作失败");
		}
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
			isPublic.value = tripData.isPublic === 1;
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

<style scoped lang="scss">
	.trip-detail-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* 面包屑导航 */
	.trip-detail-breadcrumb {
		margin-bottom: 16px;
	}

	/* 顶部信息卡片 */
	.trip-detail-header-card {
		margin-bottom: 16px;
	}

	.trip-detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.trip-detail-header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.trip-detail-title {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		display: flex;
		align-items: center;
	}

	.trip-detail-header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	/* Tab 头部操作区 */
	.trip-detail-tab-header {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-bottom: 16px;
	}

	/* 标签栏和导出按钮行 */
	.trip-detail-tab-bar-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.tab-bar-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
		margin-bottom: 16px;
	}

	.export-notes-btn {
		flex-shrink: 0;
		margin-bottom: 0;
	}

	/* 概览 Descriptions 样式 */
	.overview-descriptions {
		border-radius: 8px;
		overflow: hidden;
	}

	.overview-descriptions :deep(.el-descriptions__label) {
		width: 120px;
		font-weight: 500;
	}

	/* 金额样式 */
	.expense-amount {
		color: #ff4d4f;
		font-weight: 600;
	}

	/* 合计行上边框直角 */
	:deep(.el-table__footer-wrapper .el-table__footer .el-table__cell) {
		border-top: 1px solid #ebeef5;
		border-radius: 0;
	}

	/* 暗色主题合计行上边框 */
	.dark-theme :deep(.el-table__footer-wrapper .el-table__footer .el-table__cell) {
		border-top-color: #4c4d4f;
	}

	/* 统计卡片 */
	.stat-card {
		text-align: center;
		padding: 8px 0;
	}

	.stat-card-title {
		font-size: 14px;
		color: #666;
		margin-bottom: 8px;
	}

	.stat-card-value {
		font-size: 24px;
		font-weight: 600;
	}

	.stat-card-value-red {
		color: #cf1322;
	}

	.stat-card-value-blue {
		color: #1890ff;
	}

	.stat-card-value-purple {
		color: #722ed1;
	}

	.stat-card-value-orange {
		color: #fa8c16;
		font-size: 16px;
	}

	.stat-card-value-green {
		color: #52c41a;
	}

	.stat-card-value-cyan {
		color: #13c2c2;
	}

	.stat-card-value-pink {
		color: #eb2f96;
	}

	/* 暗黑主题支持 */
	.table-no-data {
		color: #999;
	}

	.dark-theme .table-no-data {
		color: #595959 !important;
	}

	.dark-theme .trip-detail-header-card {
		background-color: #1f1f1f !important;
		border-color: #303030 !important;
	}

	.dark-theme .trip-detail-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .stat-card-title {
		color: #bfbfbf !important;
	}

	.dark-theme .expense-amount {
		color: #ff7875 !important;
	}

	/* 暗黑主题游记文本单元格 - 确保 v-html 内容可见 */
	.dark-theme :deep(.note-content-cell) {
		color: #e8e8e8 !important;
	}

	/* 暗黑主题游记文本单元格内的所有子元素继承颜色 */
	.dark-theme :deep(.note-content-cell *) {
		color: #e8e8e8 !important;
	}

	/* 暗黑主题表格单元默认文本 */
	.dark-theme :deep(.el-table__cell) {
		color: #e8e8e8 !important;
	}

	.dark-theme .trip-detail-breadcrumb :deep(.el-breadcrumb__inner) {
		color: #bfbfbf !important;
	}

	.dark-theme .trip-detail-breadcrumb :deep(.el-breadcrumb__inner a) {
		color: #bfbfbf !important;
	}

	.dark-theme .trip-detail-breadcrumb :deep(.el-breadcrumb__separator) {
		color: #595959 !important;
	}

	/* 暗黑主题概览描述 */
	.dark-theme :deep(.overview-descriptions .el-descriptions__label) {
		background-color: #2a2a2a !important;
		color: #bfbfbf !important;
	}

	.dark-theme :deep(.overview-descriptions .el-descriptions__content) {
		background-color: #1f1f1f !important;
		color: #e8e8e8 !important;
	}

	/* 暗黑主题导出按钮 */
	.dark-theme .export-notes-btn {
		background-color: #2a2a2a !important;
		border-color: #3a3a3a !important;
		color: #e8e8e8 !important;
	}

	.dark-theme .export-notes-btn:hover {
		background-color: #3a3a3a !important;
		border-color: #505050 !important;
		color: #fff !important;
	}

	/* 暗黑主题 Tab 标签栏 */
	.dark-theme .trip-detail-tab-bar-row {
		border-color: #303030 !important;
	}

	/* 暗黑主题开关文字 */
	.dark-theme :deep(.el-switch__label) {
		color: #bfbfbf !important;
	}

	.dark-theme :deep(.el-switch__label.is-active) {
		color: #667eea !important;
	}

	/* 暗黑主题结束旅程按钮 */
	.dark-theme :deep(.trip-detail-header-right .el-button--default) {
		background-color: #2a2a2a !important;
		border-color: #3a3a3a !important;
		color: #e8e8e8 !important;
	}

	.dark-theme :deep(.trip-detail-header-right .el-button--default:hover) {
		background-color: #3a3a3a !important;
		border-color: #505050 !important;
		color: #fff !important;
	}

	/* 暗黑主题编辑按钮（非 default 类型） */
	.dark-theme :deep(.trip-detail-header-right .el-button:not(.el-button--default):not(.el-button--primary)) {
		background-color: #2a2a2a !important;
		border-color: #3a3a3a !important;
		color: #e8e8e8 !important;
	}

	.dark-theme :deep(.trip-detail-header-right .el-button:not(.el-button--default):not(.el-button--primary):hover) {
		background-color: #3a3a3a !important;
		border-color: #505050 !important;
		color: #fff !important;
	}

	/* 暗黑主题 Switch 开关 */
	.dark-theme :deep(.el-switch) {
		--el-switch-off-color: #4a4a4a;
	}

	/* 暗黑主题概览描述列表 - 完整覆盖所有单元格 */
	.dark-theme :deep(.overview-descriptions.el-descriptions--border) {
		background-color: #1f1f1f !important;
	}

	.dark-theme :deep(.overview-descriptions .el-descriptions__body) {
		background-color: #1f1f1f !important;
	}

	.dark-theme :deep(.overview-descriptions .el-descriptions__table) {
		background-color: #1f1f1f !important;
	}

	.dark-theme :deep(.overview-descriptions .el-descriptions__cell) {
		background-color: #1f1f1f !important;
		border-color: #303030 !important;
		color: #e8e8e8 !important;
	}

	/* 暗黑主题统计卡片 */
	.dark-theme :deep(.stat-card .el-card) {
		background-color: #1f1f1f !important;
		border-color: #303030 !important;
	}

	/* 暗黑主题账单/游记表格内 text 按钮 hover */
	.dark-theme :deep(.el-table .el-button--text:hover) {
		background-color: rgba(102, 126, 234, 0.1) !important;
	}

	.dark-theme :deep(.el-table .el-button--text.el-button--danger:hover) {
		background-color: rgba(255, 120, 117, 0.1) !important;
	}

	/* 暗黑主题 Popconfirm 弹出层 */
	.dark-theme :deep(.el-popconfirm) {
		background-color: #2a2a2a !important;
		border-color: #3a3a3a !important;
		color: #e8e8e8 !important;
	}

	/* 暗黑主题标签页头部区域 */
	.dark-theme .trip-detail-tab-header {
		background-color: transparent;
	}

	/* 空状态容器 - 增加纵向空间 */
	.expenses-empty-container {
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
