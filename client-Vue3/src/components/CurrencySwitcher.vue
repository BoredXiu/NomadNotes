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
