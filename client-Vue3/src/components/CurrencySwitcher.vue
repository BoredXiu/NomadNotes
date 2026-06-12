<template>
	<el-space
		:size="4"
		:style="style"
	>
		<el-icon
			style="color: #52c41a"
			:size="size === 'large' ? 18 : 14"
		>
			<Money />
		</el-icon>
		<el-select
			:model-value="currencyStore.currency"
			@update:model-value="currencyStore.setCurrency"
			:loading="currencyStore.loading"
			:size="size"
			style="min-width: 130px"
			:teleported="false"
		>
			<el-option
				v-for="c in currencies"
				:key="c.code"
				:value="c.code"
				:label="`${c.symbol} ${c.code} - ${c.name}`"
			/>
		</el-select>
	</el-space>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { Money } from "@element-plus/icons-vue";
	import { getCurrencyRates } from "../api/currency";
	import { useCurrencyStore } from "../stores/currencyStore";
	import type { CurrencyInfo } from "../types";

	const props = withDefaults(
		defineProps<{
			size?: "small" | "default" | "large";
			style?: Record<string, string | number>;
		}>(),
		{
			size: "small",
		},
	);

	const currencyStore = useCurrencyStore();
	const currencies = ref<CurrencyInfo[]>([]);

	async function loadRates() {
		currencyStore.setLoading(true);
		try {
			const data = await getCurrencyRates();
			currencyStore.setRates(data.rates);
			currencies.value = data.currencies;
		} catch (error: unknown) {
			console.error("获取汇率失败:", error);
		} finally {
			currencyStore.setLoading(false);
		}
	}

	onMounted(() => {
		loadRates();
	});
</script>

<style scoped lang="scss">
	/* 暗黑主题货币切换选择器适配 */
	:deep(.dark-theme .el-select .el-input__wrapper) {
		background-color: #2a2a2a !important;
		box-shadow: 0 0 0 1px #3a3a3a inset !important;
	}

	:deep(.dark-theme .el-select .el-input__inner) {
		color: #e8e8e8 !important;
	}

	:deep(.dark-theme .el-select-dropdown__item) {
		color: #e8e8e8 !important;
	}

	:deep(.dark-theme .el-select-dropdown__item:hover) {
		background-color: #3a3a3a !important;
	}

	:deep(.dark-theme .el-select-dropdown__item.is-selected) {
		color: #667eea !important;
		background-color: #1f1f1f !important;
	}
</style>
