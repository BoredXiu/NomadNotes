<template>
	<div
		ref="containerRef"
		style="position: relative; display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 16px"
	>
		<div
			v-for="item in items"
			:key="item.key"
			:data-tab-key="item.key"
			@click="handleClick(item.key)"
			style="padding: 12px 24px; cursor: pointer; font-size: 16px; position: relative; user-select: none; transition: color 0.3s ease"
			:style="{
				color: item.key === activeKey ? '#1890ff' : '#666',
				fontWeight: item.key === activeKey ? 600 : 400,
			}"
		>
			<slot
				:name="'label-' + item.key"
				v-bind="{ item }"
			>
				{{ item.label }}
			</slot>
		</div>

		<!-- 滑板指示器 -->
		<div
			ref="indicatorRef"
			style="
				position: absolute;
				bottom: -2px;
				height: 18px;
				transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
				display: flex;
				align-items: flex-end;
				justify-content: center;
				pointer-events: none;
				opacity: 0;
			"
		>
			<!-- 翘头动画包装层 -->
			<div
				:style="{
					transform: animating
						? tiltDir === 'right'
							? 'rotate(-12deg) translateY(-3px) scale(1.05)'
							: 'rotate(12deg) translateY(-3px) scale(1.05)'
						: 'rotate(0deg) translateY(0) scale(1)',
					transformOrigin: 'bottom center',
					transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
				}"
			>
				<svg
					width="60"
					height="22"
					viewBox="0 0 60 22"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					style="display: block"
				>
					<!-- 板面主体 - 微翘两端 -->
					<path
						d="M6 7 C6 9, 10 10, 30 10 C50 10, 54 9, 54 7 L52 5 C52 7, 48 8, 30 8 C12 8, 8 7, 8 5 Z"
						fill="#1890ff"
						stroke="#096dd9"
						stroke-width="0.5"
					/>
					<!-- 板面高光 -->
					<path
						d="M10 7 C10 8, 14 9, 30 9 C46 9, 50 8, 50 7"
						stroke="rgba(255,255,255,0.3)"
						stroke-width="1"
						fill="none"
						stroke-linecap="round"
					/>
					<!-- 左支架 -->
					<rect
						x="16"
						y="12"
						width="10"
						height="2"
						rx="0.5"
						fill="#8c8c8c"
					/>
					<!-- 右支架 -->
					<rect
						x="34"
						y="12"
						width="10"
						height="2"
						rx="0.5"
						fill="#8c8c8c"
					/>
					<!-- 左轮 -->
					<circle
						cx="21"
						cy="17"
						r="3.5"
						fill="#434343"
					/>
					<circle
						cx="21"
						cy="17"
						r="1.5"
						fill="#8c8c8c"
					/>
					<!-- 右轮 -->
					<circle
						cx="39"
						cy="17"
						r="3.5"
						fill="#434343"
					/>
					<circle
						cx="39"
						cy="17"
						r="1.5"
						fill="#8c8c8c"
					/>
				</svg>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch, nextTick } from "vue";

	interface TabItem {
		key: string;
		label: string;
	}

	const props = defineProps<{
		activeKey: string;
		items: TabItem[];
	}>();

	const emit = defineEmits<{
		(e: "update:activeKey", key: string): void;
	}>();

	const containerRef = ref<HTMLDivElement>();
	const indicatorRef = ref<HTMLDivElement>();
	const animating = ref(false);
	const tiltDir = ref<"left" | "right" | null>(null);
	const prevIndexRef = ref(0);

	// 计算指示器位置 - 使用 imperative DOM 操作，与 React 版本一致
	function updateIndicatorPosition() {
		if (!containerRef.value || !indicatorRef.value) return;
		const tabs = containerRef.value.querySelectorAll("[data-tab-key]");
		if (props.activeKey) {
			tabs.forEach((tab) => {
				const key = tab.getAttribute("data-tab-key");
				if (key === props.activeKey) {
					const tabRect = tab.getBoundingClientRect();
					const containerRect = containerRef.value!.getBoundingClientRect();
					indicatorRef.value!.style.transform = `translateX(${tabRect.left - containerRect.left}px)`;
					indicatorRef.value!.style.width = `${tabRect.width}px`;
					indicatorRef.value!.style.opacity = "1";
				}
			});
		} else {
			indicatorRef.value.style.opacity = "0";
		}
	}

	function handleClick(key: string) {
		if (key === props.activeKey) return;
		const newIndex = props.items.findIndex((item) => item.key === key);
		// 判断滑动方向：索引变大 = 向右滑，索引变小 = 向左滑
		tiltDir.value = newIndex > prevIndexRef.value ? "right" : "left";
		prevIndexRef.value = newIndex;
		animating.value = true;
		emit("update:activeKey", key);
		// 动画结束后复位
		setTimeout(() => {
			animating.value = false;
			tiltDir.value = null;
		}, 400);
	}

	// 监听 activeKey 变化，移动指示器
	watch(
		() => props.activeKey,
		() => {
			nextTick(() => {
				updateIndicatorPosition();
			});
		},
		{ immediate: true },
	);

	// 监听 items 变化（例如首次加载时 items 可能异步填充）
	watch(
		() => props.items,
		() => {
			nextTick(() => {
				updateIndicatorPosition();
			});
		},
		{ deep: true },
	);
</script>