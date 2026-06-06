<template>
	<div
		class="note-detail-page"
		ref="pageRef"
	>
		<!-- 面包屑导航 -->
		<el-breadcrumb class="note-detail-breadcrumb">
			<el-breadcrumb-item :to="{ path: '/' }">我的旅程</el-breadcrumb-item>
			<el-breadcrumb-item :to="{ path: `/trip/${note?.tripId}` }">
				{{ tripTitle || "旅程" }}
			</el-breadcrumb-item>
			<el-breadcrumb-item> {{ formatDate(note?.noteDate) }} 游记 </el-breadcrumb-item>
		</el-breadcrumb>

		<el-space class="note-detail-back">
			<el-button
				:icon="ArrowLeft"
				type="text"
				@click="router.back()"
			/>
		</el-space>

		<el-empty
			v-if="!loading && !note"
			description="游记不存在"
		/>

		<el-card v-if="note">
			<h4 class="note-detail-title">游记 - {{ formatDate(note.noteDate) }}</h4>
			<span class="note-detail-date"> 创建于 {{ formatDate(note.createdAt) }} </span>

			<!-- 游记内容 -->
			<div class="note-detail-content">
				{{ note.content }}
			</div>

			<!-- 图片展示 -->
			<div v-if="note.images && note.images.length > 0">
				<el-space
					wrap
					:size="[12, 12]"
				>
					<el-image
						v-for="(img, i) in note.images"
						:key="i"
						:src="img"
						:preview-src-list="note.images"
						:initial-index="i"
						preview-teleported
						class="note-detail-image"
						fit="cover"
					/>
				</el-space>
			</div>

			<!-- 操作按钮 -->
			<div class="note-detail-actions">
				<el-space>
					<el-button
						:icon="Edit"
						@click="router.push(`/note/${note.id}/edit`)"
					>
						编辑
					</el-button>
					<el-popconfirm
						title="确定删除此游记?"
						@confirm="handleDelete"
					>
						<template #reference>
							<el-button
								:icon="Delete"
								type="danger"
								>删除</el-button
							>
						</template>
					</el-popconfirm>
				</el-space>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { Edit, Delete, ArrowLeft } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import { getNoteById, deleteNote } from "../api/notes";
	import { getTripById } from "../api/trips";
	import type { Note } from "../types";
	import dayjs from "dayjs";
	import { useFadeIn } from "../composables/useGsapAnimations";

	const route = useRoute();
	const router = useRouter();
	const note = ref<Note | null>(null);
	const loading = ref(true);

	// GSAP 动画
	const pageRef = useFadeIn(0);
	const tripTitle = ref("");

	function formatDate(dateStr: string | undefined) {
		return dateStr ? dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss") : "";
	}

	async function handleDelete() {
		if (!note.value) return;
		try {
			await deleteNote(note.value.id);
			ElMessage.success("删除成功");
			router.push(`/trip/${note.value.tripId}?tab=notes`);
		} catch {
			ElMessage.error("删除失败");
		}
	}

	onMounted(async () => {
		const noteId = route.params.id as string;
		try {
			const data = await getNoteById(noteId);
			note.value = data;
			try {
				const trip = await getTripById(data.tripId);
				tripTitle.value = trip.title;
			} catch {
				tripTitle.value = "未知旅程";
			}
		} catch {
			ElMessage.error("加载游记失败");
		} finally {
			loading.value = false;
		}
	});
</script>

<style scoped lang="scss">
	.note-detail-page {
		max-width: 800px;
		margin: 0 auto;
	}

	.note-detail-breadcrumb {
		margin-bottom: 16px;
	}

	.note-detail-back {
		margin-bottom: 16px;
	}

	.note-detail-title {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.note-detail-date {
		color: rgba(0, 0, 0, 0.45);
		font-size: 14px;
	}

	.note-detail-content {
		margin: 24px 0;
		white-space: pre-wrap;
		line-height: 1.8;
		font-size: 16px;
	}

	.note-detail-image {
		width: 200px;
		border-radius: 8px;
		cursor: pointer;
	}

	.note-detail-actions {
		margin-top: 24px;
		text-align: right;
	}

	/* 暗黑主题支持 */
	.dark-theme .note-detail-page {
		background-color: #141414 !important;
	}

	.dark-theme .note-detail-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .note-detail-date {
		color: rgba(255, 255, 255, 0.45) !important;
	}

	.dark-theme .note-detail-content {
		color: #e8e8e8 !important;
	}

	.dark-theme .note-detail-image {
		border-color: #303030 !important;
	}

	.dark-theme .note-detail-breadcrumb :deep(.el-breadcrumb__inner) {
		color: #bfbfbf !important;
	}

	.dark-theme .note-detail-breadcrumb :deep(.el-breadcrumb__inner a) {
		color: #bfbfbf !important;
	}

	.dark-theme .note-detail-breadcrumb :deep(.el-breadcrumb__separator) {
		color: #595959 !important;
	}

	.dark-theme .note-detail-actions {
		border-top-color: #303030 !important;
	}
</style>
