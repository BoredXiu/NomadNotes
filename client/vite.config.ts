import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			filename: "sw.js",
			includeAssets: ["favicon.svg", "nomadnotes.svg", "icons/*.svg", "icons/*.png"],
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
			workbox: {
				navigationPreload: true,
				globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot,json}"],
				runtimeCaching: [
					{
						// API 请求：NetworkFirst
						urlPattern: /^\/api\//,
						handler: "NetworkFirst",
						options: {
							cacheName: "api-cache",
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24, // 24 小时
							},
							networkTimeoutSeconds: 10,
							backgroundSync: {
								name: "api-sync-queue",
								options: {
									maxRetentionTime: 24 * 60,
								},
							},
						},
					},
					{
						// 上传资源：CacheFirst
						urlPattern: /^\/uploads\//,
						handler: "CacheFirst",
						options: {
							cacheName: "uploads-cache",
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
						},
					},
					{
						// 字体：CacheFirst 长期缓存
						urlPattern: /\.(?:woff2?|ttf|eot)$/,
						handler: "CacheFirst",
						options: {
							cacheName: "font-cache",
							expiration: {
								maxAgeSeconds: 60 * 60 * 24 * 365,
								maxEntries: 20,
							},
						},
					},
					{
						// 图片：StaleWhileRevalidate
						urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp)$/,
						handler: "StaleWhileRevalidate",
						options: {
							cacheName: "image-cache",
							expiration: {
								maxEntries: 150,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
						},
					},
				],
			},
			devOptions: {
				enabled: true,
				type: "module",
				navigateFallback: "/",
			},
		}),
	],
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
	build: {
		assetsInlineLimit: 4096,
		cssCodeSplit: true,
		sourcemap: false,
		rollupOptions: {
			output: {
				assetFileNames: "assets/[name]-[hash][extname]",
				manualChunks: {
					"vendor-react": ["react", "react-dom", "react-router-dom"],
					"vendor-ui": ["antd", "@ant-design/icons"],
					"vendor-utils": ["axios", "dayjs", "gsap", "zustand"],
				},
			},
		},
	},
});
