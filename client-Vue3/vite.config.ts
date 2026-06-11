import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			// 自动注册 Service Worker
			registerType: "autoUpdate",
			// Service Worker 文件名
			filename: "sw.js",
			// 包含在 SW 预缓存中的额外静态资源
			includeAssets: ["favicon.svg", "nomadnotes.svg", "icons/*.svg", "icons/*.png"],
			// Manifest 配置
			manifest: {
				name: "NomadNotes",
				short_name: "NomadNotes",
				description: "极简旅行记录应用，支持旅程管理、消费记账、游记编写",
				theme_color: "#001529",
				background_color: "#f5f5f5",
				display: "standalone",
				display_override: ["window-controls-overlay", "standalone"],
				orientation: "portrait-primary",
				start_url: "/",
				scope: "/",
				lang: "zh-CN",
				dir: "ltr",
				categories: ["travel", "lifestyle", "productivity"],
				// PWA 图标（PNG 格式是 Chrome 安装要求，SVG 用于现代浏览器）
				icons: [
					// PNG 图标（Chrome 要求至少有一个 PNG 才能触发 beforeinstallprompt）
					{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
					{ src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
					// SVG 图标（现代浏览器支持）
					{ src: "/icons/icon-48x48.svg", sizes: "48x48", type: "image/svg+xml" },
					{ src: "/icons/icon-72x72.svg", sizes: "72x72", type: "image/svg+xml" },
					{ src: "/icons/icon-96x96.svg", sizes: "96x96", type: "image/svg+xml" },
					{ src: "/icons/icon-128x128.svg", sizes: "128x128", type: "image/svg+xml" },
					{ src: "/icons/icon-144x144.svg", sizes: "144x144", type: "image/svg+xml" },
					{ src: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" },
					{ src: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
					{ src: "/icons/icon-256x256.svg", sizes: "256x256", type: "image/svg+xml" },
					{ src: "/icons/icon-384x384.svg", sizes: "384x384", type: "image/svg+xml" },
					{ src: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
				],
				// 截图（用于 PWA 安装描述）
				screenshots: [],
				// 快捷方式
				shortcuts: [
					{
						name: "新建旅程",
						short_name: "新建",
						description: "创建新的旅行记录",
						url: "/trip/new",
						icons: [{ src: "/icons/icon-96x96.svg", sizes: "96x96", type: "image/svg+xml" }],
					},
				],
			},
			// Workbox 缓存策略
			workbox: {
				// 导航请求使用 NetworkFirst，带离线回退
				navigationPreload: true,
				globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot,json}"],
				// 运行时缓存策略
				runtimeCaching: [
					{
						// API 请求：NetworkFirst，网络优先，失败时使用缓存
						urlPattern: /^\/api\//,
						handler: "NetworkFirst",
						options: {
							cacheName: "api-cache",
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24, // 24 小时
							},
							networkTimeoutSeconds: 10,
							// 后台同步：离线时的请求在恢复网络后重试
							backgroundSync: {
								name: "api-sync-queue",
								options: {
									maxRetentionTime: 24 * 60, // 保留 24 小时
								},
							},
						},
					},
					{
						// 上传资源（图片等）：CacheFirst，缓存优先
						urlPattern: /^\/uploads\//,
						handler: "CacheFirst",
						options: {
							cacheName: "uploads-cache",
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
							},
						},
					},
					{
						// 字体资源：CacheFirst + 长期缓存
						urlPattern: /\.(?:woff2?|ttf|eot)$/,
						handler: "CacheFirst",
						options: {
							cacheName: "font-cache",
							expiration: {
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
								maxEntries: 20,
							},
						},
					},
					{
						// 图片资源：StaleWhileRevalidate
						urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp)$/,
						handler: "StaleWhileRevalidate",
						options: {
							cacheName: "image-cache",
							expiration: {
								maxEntries: 150,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
							},
						},
					},
				],
			},
			// 是否在开发模式下启用
			devOptions: {
				enabled: true,
				type: "module",
				navigateFallback: "/",
			},
		}),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: "http://localhost:3434",
				changeOrigin: true,
			},
			"/uploads": {
				target: "http://localhost:3434",
				changeOrigin: true,
			},
		},
	},
	// 使用 Sass modern compiler API 消除 legacy JS API 弃用警告
	css: {
		preprocessorOptions: {
			scss: {
				api: "modern-compiler",
			},
		},
	},
	build: {
		// 资源内联阈值（小于此大小的图片转 base64）
		assetsInlineLimit: 4096, // 4KB
		// 启用 CSS 代码分割
		cssCodeSplit: true,
		// 生成 sourcemap 用于调试
		sourcemap: false,
		// Rollup 打包选项
		rollupOptions: {
			output: {
				// 静态资源分目录存放
				assetFileNames: "assets/[name]-[hash][extname]",
				// 代码拆分配置：将第三方库分离
				manualChunks: {
					"vendor-vue": ["vue", "vue-router", "pinia"],
					"vendor-ui": ["element-plus", "@element-plus/icons-vue"],
					"vendor-utils": ["axios", "dayjs", "gsap"],
				},
			},
		},
	},
});
