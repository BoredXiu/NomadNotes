import React from "react";

/**
 * AppFooter - 全局面应用页脚组件
 *
 * 功能：在应用所有页面底部固定显示 ICP 备案信息
 * 用法：直接在页面/布局组件底部引入 <AppFooter /> 即可
 *
 * 适配说明：
 * - 使用 flex-shrink: 0 确保不会挤压主体内容区域
 * - 移动端和桌面端统一展示，响应式适配 padding
 */
const AppFooter: React.FC = () => {
	return (
		<footer
			style={{
				textAlign: "center",
				padding: "16px 24px",
				fontSize: 12,
				color: "#999",
				flexShrink: 0,
				background: "transparent",
			}}
		>
			<a
				href="https://beian.miit.gov.cn/"
				target="_blank"
				rel="noopener noreferrer"
				style={{
					color: "#000",
					textDecoration: "none",
					fontSize: 16,
					fontWeight: "bold",
					transition: "color 0.2s",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.color = "#667eea";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.color = "#000";
				}}
			>
				ICP备案号：赣ICP备2026011485号
			</a>
			<style>{`
				@media (max-width: 768px) {
					footer { padding: 12px 16px; font-size: 11px; }
				}
			`}</style>
		</footer>
	);
};

export default AppFooter;