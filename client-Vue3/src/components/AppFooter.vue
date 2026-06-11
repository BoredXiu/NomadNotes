<template>
	<!--
        AppFooter - 全局面应用页脚组件

        功能：在应用所有页面底部固定显示 ICP 备案信息
        用法：直接在页面/布局组件底部引入 <AppFooter /> 即可

        适配说明：
        - 使用 flex-shrink: 0 确保不会挤压主体内容区域
        - 移动端和桌面端统一展示，响应式适配 padding
    -->
	<footer class="app-footer">
		<a
			href="https://beian.miit.gov.cn/"
			target="_blank"
			rel="noopener noreferrer"
			class="app-footer__link"
		>
			ICP备案号：赣ICP备2026011485号
		</a>
	</footer>
</template>

<script setup lang="ts">
	/**
	 * AppFooter 组件
	 * 无需 props，直接使用即可
	 */
</script>

<style scoped lang="scss">
	.app-footer {
		text-align: center;
		padding: 16px 24px;
		font-size: 16px;
		font-weight: bold;
		color: #000;
		flex-shrink: 0;
		background: transparent;

		&__link {
			color: #000;
			text-decoration: none;
			transition: color 0.2s;

			&:hover {
				color: #667eea;
			}
		}
	}

	@media (max-width: 768px) {
		.app-footer {
			padding: 12px 16px;
			font-size: 11px;
		}
	}
</style>
