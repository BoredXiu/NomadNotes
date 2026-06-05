<template>
	<div>
		<!-- 面包屑导航 -->
		<el-breadcrumb style="margin-bottom: 16px">
			<el-breadcrumb-item :to="{ path: '/explore' }">微游记</el-breadcrumb-item>
			<el-breadcrumb-item>{{ tripData?.title || "" }}</el-breadcrumb-item>
		</el-breadcrumb>

		<!-- 标题区域 -->
		<div style="margin-bottom: 24px">
			<h3 style="margin-bottom: 4px; font-size: 20px; font-weight: 600">{{ tripData?.title }}</h3>
			<el-space>
				<el-tag type="primary">{{ tripData?.destination }}</el-tag>
				<span style="color: rgba(0, 0, 0, 0.45); font-size: 14px">
					<el-icon style="margin-right: 4px"><Calendar /></el-icon>
					{{ formatDateTime(tripData?.startDate) }} ~ {{ formatDateTime(tripData?.endDate) }}
				</span>
			</el-space>
		</div>

		<el-skeleton
			v-if="loading"
			:rows="8"
			animated
		/>

		<template v-if="!loading && tripData">
			<!-- 自定义 TabBar -->
			<SkateboardTabBar
				:active-key="activeTab"
				:items="tabItems"
				@update:active-key="(key: string) => setActiveTab(key)"
			/>

			<!-- Tabs 内容区（隐藏 el-tabs 自带 header） -->
			<el-tabs
				v-model="activeTab"
				class="hidden-tabs-header"
			>
				<!-- 概览 Tab -->
				<el-tab-pane name="overview">
					<!-- 封面图 -->
					<div
						v-if="tripData.coverImage"
						style="margin-bottom: 24px"
					>
						<el-image
							:src="tripData.coverImage"
							style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 12px; cursor: pointer"
							fit="cover"
							:preview-src-list="[tripData.coverImage]"
							:preview-teleported="true"
						/>
					</div>

					<el-descriptions
						bordered
						:column="2"
					>
						<el-descriptions-item label="目的地">
							{{ tripData.destination }}
						</el-descriptions-item>
						<el-descriptions-item label="作者">
							<el-space>
								<el-avatar
									:size="22"
									:src="tripData.User?.avatarUrl ?? undefined"
									:icon="User"
								/>
								<span>{{ tripData.User?.username || "匿名用户" }}</span>
							</el-space>
						</el-descriptions-item>
						<el-descriptions-item label="开始日期">
							{{ formatDateTime(tripData.startDate) }}
						</el-descriptions-item>
						<el-descriptions-item label="结束日期">
							{{ tripData.endDate ? formatDateTime(tripData.endDate) : "-" }}
						</el-descriptions-item>
						<el-descriptions-item label="状态">
							<el-tag :type="tripData.isEnded ? 'primary' : 'success'">
								{{ tripData.isEnded ? "已结束" : "进行中" }}
							</el-tag>
						</el-descriptions-item>
						<el-descriptions-item label="消费笔数"> {{ tripData.expenseCount || 0 }} 笔 </el-descriptions-item>
						<el-descriptions-item label="游记篇数"> {{ tripData.noteCount || 0 }} 篇 </el-descriptions-item>
						<el-descriptions-item label="创建时间">
							{{ formatDateTime(tripData.createdAt) }}
						</el-descriptions-item>
					</el-descriptions>
				</el-tab-pane>

				<!-- 账单 Tab -->
				<el-tab-pane
					v-if="expenses.length > 0"
					name="expenses"
				>
					<el-table
						:data="expenses"
						row-key="id"
						style="width: 100%"
						:pagination="{ pageSize: 10, size: 'small' }"
						size="default"
					>
						<el-table-column
							prop="expenseDate"
							label="日期"
							width="180"
							align="center"
						>
							<template #default="{ row }">
								{{ formatDateTime(row.expenseDate) }}
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
									{{ row.category }}
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
								<span style="color: #ff4d4f; font-weight: 700"> ¥{{ Number(row.amount).toFixed(2) }} </span>
							</template>
						</el-table-column>
						<el-table-column
							prop="note"
							label="备注"
							min-width="150"
							align="center"
						>
							<template #default="{ row }">
								{{ row.note || "-" }}
							</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>

				<!-- 游记 Tab -->
				<el-tab-pane
					v-if="notes.length > 0"
					name="notes"
				>
					<el-timeline>
						<el-timeline-item
							v-for="note in notes"
							:key="note.id"
							:timestamp="formatDateTime(note.noteDate)"
							placement="top"
						>
							<el-card
								shadow="hover"
								size="small"
								style="margin-bottom: 12px"
							>
								<p style="white-space: pre-wrap; margin-bottom: 12px; line-height: 1.8; font-size: 15px">
									{{ note.content }}
								</p>
								<div v-if="note.images && note.images.length > 0">
									<el-space
										wrap
										:size="[12, 12]"
									>
										<el-image
											v-for="(img, i) in note.images"
											:key="i"
											:src="img"
											style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid #f0f0f0"
											fit="cover"
											:preview-src-list="note.images"
											:initial-index="i"
											preview-teleported
										/>
									</el-space>
								</div>
							</el-card>
						</el-timeline-item>
					</el-timeline>
				</el-tab-pane>

				<!-- 统计 Tab -->
				<el-tab-pane
					v-if="expenses.length > 0"
					name="stats"
				>
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
							<el-card shadow="hover">
								<el-statistic
									title="总支出"
									:value="statsSummary.total"
									:precision="2"
									prefix="¥"
									value-style="color: #cf1322"
								/>
							</el-card>
						</el-col>
						<el-col
							:xs="24"
							:sm="12"
							:lg="6"
						>
							<el-card shadow="hover">
								<el-statistic
									title="日均支出"
									:value="statsSummary.avgPerDay"
									:precision="2"
									prefix="¥"
									value-style="color: #1890ff"
								/>
							</el-card>
						</el-col>
						<el-col
							:xs="24"
							:sm="12"
							:lg="6"
						>
							<el-card shadow="hover">
								<el-statistic
									title="消费笔数"
									:value="statsSummary.count"
									suffix="笔"
									value-style="color: #722ed1"
								/>
							</el-card>
						</el-col>
						<el-col
							:xs="24"
							:sm="12"
							:lg="6"
						>
							<el-card shadow="hover">
								<div style="text-align: center">
									<div style="font-size: 14px; color: rgba(0, 0, 0, 0.45); margin-bottom: 4px">最高消费类别</div>
									<div style="font-size: 16px; font-weight: 600; color: #fa8c16">
										{{ statsSummary.maxCategory || "-" }}
									</div>
								</div>
							</el-card>
						</el-col>
					</el-row>

					<!-- 分类图表 -->
					<el-row
						v-if="categoryStats.categories.length > 0"
						:gutter="16"
					>
						<el-col
							:xs="24"
							:lg="12"
						>
							<el-card
								shadow="hover"
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
								shadow="hover"
								title="每日消费趋势"
								style="margin-bottom: 16px"
							>
								<div
									v-if="dailyExpenseData.length > 0"
									style="width: 100%; height: 350px"
								>
									<v-chart
										:option="barChartOption"
										autoresize
									/>
								</div>
								<el-empty
									v-else
									description="暂无日消费数据"
								/>
							</el-card>
						</el-col>
					</el-row>

					<!-- 分类明细表 -->
					<el-card
						v-if="categoryStats.categories.length > 0"
						shadow="hover"
						size="small"
						style="margin-top: 16px"
					>
						<template #header>
							<span>分类明细</span>
						</template>
						<el-table
							:data="categoryStats.categories"
							row-key="category"
							style="width: 100%"
						>
							<el-table-column
								prop="category"
								label="分类"
							>
								<template #default="{ row }">
									<el-tag>{{ row.category }}</el-tag>
								</template>
							</el-table-column>
							<el-table-column
								prop="count"
								label="笔数"
								align="right"
							/>
							<el-table-column
								prop="total"
								label="金额"
								align="right"
							>
								<template #default="{ row }">
									<span style="color: #ff4d4f; font-weight: 700"> ¥{{ row.total.toFixed(2) }} </span>
								</template>
							</el-table-column>
							<el-table-column
								label="占比"
								align="right"
							>
								<template #default="{ row }">
									{{ categoryStats.total > 0 ? ((row.total / categoryStats.total) * 100).toFixed(1) + "%" : "0.0%" }}
								</template>
							</el-table-column>
						</el-table>
					</el-card>
				</el-tab-pane>
			</el-tabs>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { User, Calendar } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { getPublicTripById } from "../api/trips";
	import SkateboardTabBar from "../components/SkateboardTabBar.vue";
	import VChart from "vue-echarts";
	import { use } from "echarts/core";
	import { PieChart } from "echarts/charts";
	import { BarChart } from "echarts/charts";
	import { TooltipComponent, LegendComponent, GridComponent } from "echarts/components";
	import { CanvasRenderer } from "echarts/renderers";
	import type { Trip, Expense, Note } from "../types";
	import dayjs from "dayjs";

	use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

	const route = useRoute();
	const router = useRouter();

	const loading = ref(true);
	const activeTab = ref("overview");
	const tripData = ref<(Trip & { expenses?: Expense[]; notes?: Note[] }) | null>(null);

	const COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe", "#43e97b", "#fa709a", "#a18cd1", "#fccb90"];

	const expenses = computed<Expense[]>(() => tripData.value?.expenses || []);
	const notes = computed<Note[]>(() => tripData.value?.notes || []);

	// Tab 配置项
	const tabItems = computed(() => {
		const items: { key: string; label: string }[] = [{ key: "overview", label: "概览" }];
		if (expenses.value.length > 0) {
			items.push({
				key: "expenses",
				label: `账单 (${expenses.value.length})`,
			});
		}
		if (notes.value.length > 0) {
			items.push({ key: "notes", label: `游记 (${notes.value.length})` });
		}
		if (expenses.value.length > 0) {
			items.push({ key: "stats", label: "统计" });
		}
		return items;
	});

	// 每日消费数据
	const dailyExpenseData = computed(() => {
		const map: Record<string, number> = {};
		for (const e of expenses.value) {
			const date = dayjs(e.expenseDate).format("YYYY-MM-DD");
			map[date] = (map[date] || 0) + Number(e.amount);
		}
		return Object.entries(map)
			.map(([date, amount]) => ({
				date,
				amount: Math.round(amount * 100) / 100,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	});

	// 分类统计
	const categoryStats = computed(() => {
		const map: Record<string, { total: number; count: number }> = {};
		let total = 0;
		for (const e of expenses.value) {
			const amount = Number(e.amount);
			total += amount;
			if (!map[e.category]) {
				map[e.category] = { total: 0, count: 0 };
			}
			map[e.category].total += amount;
			map[e.category].count += 1;
		}
		const categories = Object.entries(map).map(([cat, data]) => ({
			category: cat,
			total: Math.round(data.total * 100) / 100,
			count: data.count,
		}));
		categories.sort((a, b) => b.total - a.total);
		return { total: Math.round(total * 100) / 100, categories };
	});

	// 统计摘要
	const statsSummary = computed(() => {
		const total = expenses.value.reduce((sum, e) => sum + Number(e.amount), 0);
		if (expenses.value.length === 0) {
			return { total: 0, avgPerDay: 0, maxCategory: null, count: 0 };
		}

		const catTotals: Record<string, number> = {};
		const dates = new Set<string>();
		for (const e of expenses.value) {
			catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
			dates.add(dayjs(e.expenseDate).format("YYYY-MM-DD"));
		}

		let maxCat = "";
		let maxAmt = 0;
		for (const [cat, amt] of Object.entries(catTotals)) {
			if (amt > maxAmt) {
				maxAmt = amt;
				maxCat = cat;
			}
		}

		return {
			total: Math.round(total * 100) / 100,
			avgPerDay: dates.size > 0 ? Math.round((total / dates.size) * 100) / 100 : 0,
			maxCategory: maxCat ? `${maxCat} (¥${Math.round(maxAmt * 100) / 100})` : null,
			count: expenses.value.length,
		};
	});

	// 饼图配置
	const pieChartOption = computed(() => {
		if (categoryStats.value.categories.length === 0) return {};
		return {
			tooltip: {
				trigger: "item",
				formatter: (params: { data: { value: number } }) => `¥${params.data.value.toFixed(2)}`,
			},
			legend: { bottom: 0 },
			series: [
				{
					name: "消费分类",
					type: "pie",
					radius: ["40%", "70%"],
					center: ["50%", "45%"],
					data: categoryStats.value.categories.map((c) => ({
						name: c.category,
						value: c.total,
					})),
					color: COLORS,
					label: {
						formatter: (params: { name: string; value: number }) => `${params.name} ¥${params.value.toFixed(2)}`,
					},
				},
			],
		};
	});

	// 柱状图配置
	const barChartOption = computed(() => {
		if (dailyExpenseData.value.length === 0) return {};
		return {
			tooltip: {
				trigger: "axis",
				formatter: (params: { value: number }[]) => `¥${params[0].value.toFixed(2)}`,
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true,
			},
			xAxis: {
				type: "category",
				data: dailyExpenseData.value.map((d) => d.date),
			},
			yAxis: { type: "value" },
			series: [
				{
					data: dailyExpenseData.value.map((d) => d.amount),
					type: "bar",
					itemStyle: {
						color: "#1890ff",
						borderRadius: [4, 4, 0, 0],
					},
				},
			],
		};
	});

	function formatDateTime(dateStr: string | null | undefined) {
		return dateStr ? dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss") : "";
	}

	function setActiveTab(key: string) {
		activeTab.value = key;
	}

	onMounted(async () => {
		const tripId = route.params.id as string;
		try {
			tripData.value = (await getPublicTripById(tripId)) as Trip & {
				expenses?: Expense[];
				notes?: Note[];
			};
		} catch {
			ElMessage.error("该游记不存在或已设为私密");
			router.replace("/explore");
		} finally {
			loading.value = false;
		}
	});
</script>

<style scoped>
	/* 隐藏 el-tabs 自带的 tab header，使用自定义 SkateboardTabBar 替代 */
	.hidden-tabs-header :deep(.el-tabs__header) {
		display: none;
	}
</style>
