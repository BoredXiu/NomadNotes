<template>
	<div class="expense-form-page">
		<el-card
			class="expense-form-card"
			v-loading="loading"
		>
			<el-space class="expense-form-header">
				<el-space>
					<el-button
						text
						:icon="ArrowLeft"
						@click="router.back()"
					/>
					<h4 style="margin: 0">{{ isEditing ? "编辑账单" : "记一笔" }}</h4>
				</el-space>
				<CurrencySwitcher />
			</el-space>

			<el-form
				ref="formRef"
				:model="formData"
				:rules="rules"
				label-position="top"
				@submit.prevent="handleSubmit"
			>
				<el-form-item
					prop="category"
					label="分类"
				>
					<el-select
						v-model="formData.category"
						style="width: 100%"
						:teleported="false"
					>
						<el-option
							v-for="cat in categories"
							:key="cat.value"
							:value="cat.value"
							:label="cat.label"
						/>
					</el-select>
				</el-form-item>

				<el-form-item
					prop="amount"
					:label="'金额 (' + currencyStore.currency + ')'"
				>
					<el-input
						v-model="formData.amountStr"
						:placeholder="'0.00'"
						style="width: 100%"
					/>
				</el-form-item>
				<!-- 货币转换提示 -->
				<div
					v-if="formData.amountStr && currencyStore.currency !== 'CNY'"
					style="margin-top: -8px; margin-bottom: 16px; font-size: 12px; color: #888"
				>
					约 {{ currencyStore.getCurrencySymbol()
					}}{{ currencyStore.convertAmount(Number(formData.amountStr)).toFixed(currencyStore.currency === "JPY" ? 0 : 2) }}（按当前汇率自动转换）
				</div>

				<el-form-item
					prop="expenseDate"
					label="消费日期"
				>
					<el-date-picker
						v-model="formData.expenseDate"
						type="datetime"
						placeholder="选择日期"
						style="width: 100%"
						format="YYYY-MM-DD HH:mm:ss"
						value-format="YYYY-MM-DD HH:mm:ss"
					/>
				</el-form-item>

				<el-form-item
					prop="note"
					label="备注"
				>
					<el-input
						v-model="formData.note"
						type="textarea"
						:rows="3"
						placeholder="可选备注"
					/>
				</el-form-item>

				<!-- 小票照片 -->
				<el-form-item label="小票照片">
					<el-space
						direction="vertical"
						style="width: 100%"
					>
						<el-space
							v-if="existingImages.length > 0 || tempFiles.length > 0"
							wrap
						>
							<div
								v-for="(img, idx) in existingImages"
								:key="'existing-' + idx"
								style="position: relative; display: inline-block"
							>
								<el-image
									:src="img"
									:alt="'小票 ' + (idx + 1)"
									style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px"
								/>
							</div>
							<div
								v-for="(file, idx) in tempFiles"
								:key="'new-' + idx"
								style="position: relative; display: inline-block"
							>
								<el-image
									:src="file.previewUrl"
									:alt="'小票 ' + (idx + 1)"
									style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px"
								/>
								<el-button
									:icon="Delete"
									size="small"
									type="danger"
									text
									class="receipt-delete-btn"
									@click="handleRemoveReceipt(idx)"
								/>
							</div>
						</el-space>
						<el-upload
							:before-upload="handleBeforeUpload"
							accept="image/jpeg,image/png,image/webp"
							:show-file-list="false"
						>
							<el-button
								:icon="Upload"
								:loading="uploading"
							>
								{{ tempFiles.length > 0 || existingImages.length > 0 ? "添加更多图片" : "上传小票" }}
							</el-button>
						</el-upload>
					</el-space>
				</el-form-item>

				<el-form-item>
					<el-button
						type="primary"
						:loading="submitting"
						native-type="submit"
						style="width: 100%"
					>
						{{ isEditing ? "更新账单" : "保存账单" }}
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { ArrowLeft, Delete, Upload } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules } from "element-plus";
	import { createExpense, getExpenseById, updateExpense, uploadFileToTemp, persistMultiple } from "../api/expenses";
	import { compressImage } from "../utils/compress";
	import { useCurrencyStore } from "../stores/currencyStore";
	import CurrencySwitcher from "../components/CurrencySwitcher.vue";
	import type { Expense } from "../types";
	import dayjs from "dayjs";

	const route = useRoute();
	const router = useRouter();
	const currencyStore = useCurrencyStore();
	const formRef = ref<FormInstance>();
	const submitting = ref(false);
	const loading = ref(false);
	const uploading = ref(false);

	const tripId = route.params.tripId as string;
	const expenseId = route.params.expenseId as string | undefined;
	const isEditing = !!expenseId;

	interface TempFile {
		fileId: string;
		ext: string;
		previewUrl: string;
	}

	const tempFiles = ref<TempFile[]>([]);
	const existingImages = ref<string[]>([]);

	const categories = [
		{ value: "餐饮", label: "餐饮" },
		{ value: "交通", label: "交通" },
		{ value: "住宿", label: "住宿" },
		{ value: "门票", label: "门票" },
		{ value: "购物", label: "购物" },
		{ value: "其他", label: "其他" },
	];

	const formData = reactive({
		category: "餐饮",
		amountStr: "",
		amount: 0,
		expenseDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
		note: "",
	});

	const rules: FormRules = {
		category: [{ required: true, message: "请选择分类", trigger: "change" }],
		amountStr: [{ required: true, message: "请输入金额", trigger: "blur" }],
		expenseDate: [{ required: true, message: "请选择日期", trigger: "change" }],
	};

	async function handleBeforeUpload(file: File): Promise<boolean> {
		uploading.value = true;
		try {
			const compressed = await compressImage(file, 750, 0.8);
			const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
			const result = await uploadFileToTemp(compressedFile);
			const previewUrl = URL.createObjectURL(compressedFile);
			tempFiles.value.push({ fileId: result.fileId, ext: result.ext, previewUrl });
			ElMessage.success("图片已暂存");
		} catch {
			ElMessage.error("图片上传失败");
		} finally {
			uploading.value = false;
		}
		return false;
	}

	function handleRemoveReceipt(index: number) {
		const file = tempFiles.value[index];
		if (file) {
			URL.revokeObjectURL(file.previewUrl);
		}
		tempFiles.value.splice(index, 1);
	}

	async function handleSubmit() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		submitting.value = true;
		try {
			let receiptImages: string[] | null = null;

			if (tempFiles.value.length > 0) {
				const results = await persistMultiple(tempFiles.value.map((f) => ({ fileId: f.fileId, ext: f.ext })));
				receiptImages = results.map((r) => r.imageUrl);
			} else if (isEditing && existingImages.value.length > 0) {
				receiptImages = existingImages.value;
			}

			const payload: Record<string, unknown> = {
				category: formData.category,
				amount: String(formData.amountStr),
				expenseDate: formData.expenseDate,
			};
			if (formData.note) payload.note = formData.note;
			if (receiptImages) payload.receiptImages = receiptImages;

			if (isEditing && expenseId) {
				await updateExpense(expenseId, payload);
				ElMessage.success("账单更新成功");
				router.push(`/trip/${tripId}?tab=expenses`);
			} else {
				await createExpense(tripId, payload);
				ElMessage.success("记账成功");
				router.push(`/trip/${tripId}?tab=expenses`);
			}
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err?.response?.data?.message || "操作失败");
		} finally {
			submitting.value = false;
		}
	}

	onMounted(async () => {
		if (isEditing && expenseId) {
			loading.value = true;
			try {
				const expense = await getExpenseById(expenseId);
				formData.category = expense.category;
				formData.amountStr = String(expense.amount);
				formData.expenseDate = expense.expenseDate;
				formData.note = expense.note || "";
				if (expense.receiptImages) {
					existingImages.value = expense.receiptImages;
				}
			} catch {
				ElMessage.error("加载账单失败");
				router.back();
			} finally {
				loading.value = false;
			}
		}
	});
</script>

<style scoped lang="scss">
	.expense-form-page {
		max-width: 500px;
		margin: 0 auto;
	}

	.expense-form-header {
		margin-bottom: 24px;
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	/* 暗黑主题支持 */
	.receipt-delete-btn {
		position: absolute;
		top: -8px;
		right: -8px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
	}

	.dark-theme .receipt-delete-btn {
		background: #2a2a2a !important;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4) !important;
	}

	.dark-theme .expense-form-page h4 {
		color: #e8e8e8 !important;
	}

	.dark-theme .expense-form-page .el-button--text {
		color: #bfbfbf !important;
	}

	.dark-theme .expense-form-page .el-button--text:hover {
		color: #e8e8e8 !important;
		background-color: rgba(255, 255, 255, 0.08) !important;
	}

	.dark-theme .expense-form-page :deep(.el-select .el-input__wrapper) {
		background-color: #2a2a2a !important;
	}

	.dark-theme .expense-form-page :deep(.el-textarea__inner) {
		background-color: #2a2a2a !important;
		color: #e8e8e8 !important;
	}

	/* 暗黑主题输入框适配 */
	.dark-theme .expense-form-page :deep(.el-input__wrapper) {
		background-color: #2a2a2a !important;
		box-shadow: 0 0 0 1px #3a3a3a inset !important;
	}

	.dark-theme .expense-form-page :deep(.el-input__inner) {
		color: #e8e8e8 !important;
	}

	/* 暗黑主题日期选择器 */
	.dark-theme .expense-form-page :deep(.el-date-editor .el-input__wrapper) {
		background-color: #2a2a2a !important;
		box-shadow: 0 0 0 1px #3a3a3a inset !important;
	}

	/* 暗黑主题上传区域 */
	.dark-theme .expense-form-page :deep(.el-upload-dragger) {
		background-color: #1f1f1f !important;
		border-color: #303030 !important;
	}

	/* 暗黑主题表单标签 */
	.dark-theme .expense-form-page :deep(.el-form-item__label) {
		color: #bfbfbf !important;
	}
</style>
