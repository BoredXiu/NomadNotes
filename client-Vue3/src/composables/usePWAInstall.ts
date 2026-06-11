import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

/**
 * 浏览器类型枚举
 */
type BrowserType = "chrome" | "edge" | "safari" | "firefox" | "samsung" | "opera" | "other";

/**
 * 检测当前浏览器类型
 * 通过 navigator.userAgent 识别浏览器品牌
 */
function detectBrowser(): { browser: BrowserType; isMobile: boolean; isStandalone: boolean } {
	const ua = navigator.userAgent.toLowerCase();
	const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
	const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

	if (ua.includes("edg")) {
		return { browser: "edge", isMobile, isStandalone };
	}
	if (ua.includes("chrome") || ua.includes("chromium")) {
		return { browser: "chrome", isMobile, isStandalone };
	}
	if (ua.includes("safari") && !ua.includes("chrome")) {
		return { browser: "safari", isMobile, isStandalone };
	}
	if (ua.includes("firefox") || ua.includes("fxios")) {
		return { browser: "firefox", isMobile, isStandalone };
	}
	if (ua.includes("samsung")) {
		return { browser: "samsung", isMobile, isStandalone };
	}
	if (ua.includes("opr") || ua.includes("opera")) {
		return { browser: "opera", isMobile, isStandalone };
	}
	return { browser: "other", isMobile, isStandalone };
}

/**
 * 根据浏览器类型返回友好的安装引导消息
 */
function getInstallGuide(browser: BrowserType, isMobile: boolean): string {
	const guides: Record<BrowserType, string> = {
		chrome: isMobile
			? "Chrome 移动版支持 PWA 安装。请在 Chrome 菜单中点击「添加到主屏幕」。"
			: "请在 Chrome 浏览器地址栏右侧点击安装图标，或使用菜单「安装 NomadNotes」。",
		edge: isMobile
			? "Edge 移动版支持 PWA 安装。请在 Edge 菜单中点击「添加到手机」。"
			: "请在 Edge 浏览器地址栏右侧点击安装图标，或使用菜单「应用 > 将此站点安装为应用」。",
		safari: isMobile
			? "Safari 移动版支持添加到主屏幕。请点击底部分享按钮，选择「添加到主屏幕」。"
			: "Safari 桌面版不支持 PWA 安装，请使用 Chrome 或 Edge 浏览器。",
		firefox: isMobile ? "Firefox 移动版暂不支持 PWA 安装，请使用 Chrome 或 Edge。" : "Firefox 桌面版不支持 PWA 安装，请使用 Chrome 或 Edge 浏览器。",
		samsung: "三星浏览器支持 PWA 安装。请在浏览器菜单中点击「添加页面到 > 主屏幕」。",
		opera: "Opera 浏览器支持 PWA 安装。请在地址栏右侧点击安装图标。",
		other: "当前浏览器不支持 PWA 添加到桌面功能，请使用 Chrome 或 Edge 浏览器。",
	};
	return guides[browser];
}

/**
 * 诊断 PWA 安装条件是否满足
 * 返回未满足的条件列表
 */
async function diagnosePWA(): Promise<string[]> {
	const issues: string[] = [];
	const { browser } = detectBrowser();

	if (!("serviceWorker" in navigator)) {
		issues.push("当前浏览器不支持 Service Worker，无法使用 PWA 功能。");
		return issues; // 无需进一步检查
	}

	// 检查 Service Worker 是否已注册
	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		if (registrations.length === 0) {
			issues.push("Service Worker 尚未注册，应用可能未完成加载，请刷新页面后重试。");
		} else {
			// 检查 SW 是否有活跃的 worker
			const hasActive = registrations.some((r) => r.active);
			if (!hasActive) {
				issues.push("Service Worker 已注册但尚未激活，请稍候或刷新页面。");
			}
		}
	} catch {
		issues.push("无法检测 Service Worker 状态。");
	}

	// 获取 manifest 是否可访问
	try {
		const res = await fetch("/manifest.webmanifest", { method: "HEAD" });
		if (!res.ok) {
			issues.push("manifest.webmanifest 无法访问（HTTP " + res.status + "），请检查构建配置。");
		}
	} catch {
		issues.push("无法获取 manifest.webmanifest，请确认应用已正确构建。");
	}

	// 检查图标文件是否可访问
	for (const iconSize of ["192", "512"]) {
		try {
			const res = await fetch("/icons/icon-" + iconSize + "x" + iconSize + ".png", { method: "HEAD" });
			if (!res.ok) {
				issues.push("图标文件 /icons/icon-" + iconSize + "x" + iconSize + ".png 不可访问。");
			}
		} catch {
			issues.push("图标文件 /icons/icon-" + iconSize + "x" + iconSize + ".png 无法获取。");
		}
	}

	if (browser === "firefox" || (browser === "safari" && !/mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent))) {
		issues.push("当前浏览器不支持 PWA 安装（" + browser + " 桌面版无此功能）。");
	}

	return issues;
}

/**
 * PWA 安装功能的组合式函数
 * - 监听 beforeinstallprompt 事件触发浏览器原生安装弹窗
 * - 自动检测浏览器类型，提供针对性引导
 * - 识别 PWA 独立窗口模式，避免已安装时重复提示
 * - 自带诊断功能，当安装提示未触发时自动排查原因
 */
export function usePWAInstall() {
	const canInstall = ref(false);
	const checkingInstall = ref(true); // 初始化检测完成前为 true
	let deferredPrompt: any = null;

	onMounted(async () => {
		const { isStandalone } = detectBrowser();

		// 情况 1: 已经以 PWA 独立窗口模式运行 → 无需显示安装按钮
		if (isStandalone) {
			canInstall.value = false;
			checkingInstall.value = false;
			return;
		}

		// 情况 2: 使用 getInstalledRelatedApps 检测是否已安装到系统（Chrome 80+）
		try {
			if ("getInstalledRelatedApps" in navigator) {
				const relatedApps = await (navigator as any).getInstalledRelatedApps();
				if (relatedApps.some((app: any) => app.platform === "webapp")) {
					canInstall.value = false;
					checkingInstall.value = false;
					return;
				}
			}
		} catch {
			// getInstalledRelatedApps 可能因权限等问题失败，忽略
		}

		// 情况 3: 监听浏览器安装提示事件（Chrome/Edge/Samsung 等支持）
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
			canInstall.value = true;
		};

		// PWA 已安装后的回调 → 隐藏按钮
		const handleAppInstalled = () => {
			canInstall.value = false;
			deferredPrompt = null;
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		checkingInstall.value = false;
	});

	/**
	 * 触发浏览器安装弹窗
	 * 根据浏览器支持情况提供不同引导信息
	 */
	async function install(): Promise<void> {
		const { browser, isMobile, isStandalone } = detectBrowser();

		// 如果已处于 PWA 独立窗口，提示已安装
		if (isStandalone) {
			ElMessage.info("应用已安装到桌面，无需重复添加");
			return;
		}

		if (deferredPrompt) {
			// Chrome/Edge 等支持 beforeinstallprompt 的浏览器
			deferredPrompt.prompt();
			const result = await deferredPrompt.userChoice;
			if (result.outcome === "accepted") {
				canInstall.value = false;
				deferredPrompt = null;
				ElMessage.success("应用已成功添加到桌面");
			} else {
				ElMessage.info("已取消安装");
			}
		} else {
			// 先检查是否已通过 PWA 独立窗口运行
			try {
				// 使用 getInstalledRelatedApps 检测是否已安装（Chrome 80+）
				if ("getInstalledRelatedApps" in navigator) {
					const relatedApps = await (navigator as any).getInstalledRelatedApps();
					if (relatedApps.some((app: any) => app.platform === "webapp")) {
						canInstall.value = false;
						ElMessage.info("应用已安装到设备上，请在已安装的应用中打开");
						return;
					}
				}
			} catch {
				// getInstalledRelatedApps 可能因权限等问题失败，忽略
			}

			// 运行诊断，判断安装提示未触发的原因
			const issues = await diagnosePWA();

			if (issues.length > 0) {
				// 有明确的诊断结果，展示给用户
				const diagnosis = issues.map((msg, i) => i + 1 + ". " + msg).join("\n");
				const guide = getInstallGuide(browser, isMobile);
				ElMessageBox.alert(diagnosis + "\n\n手动安装指引：\n" + guide, "安装条件未满足", {
					confirmButtonText: "知道了",
					type: "warning",
					dangerouslyUseHTMLString: false,
				});
			} else {
				// 未检测到明显问题，给出常规引导
				const guide = getInstallGuide(browser, isMobile);
				ElMessage.info(guide);
			}
		}
	}

	return { canInstall, checkingInstall, install };
}
