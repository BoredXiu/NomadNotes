/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** API 基础地址，开发环境使用 /api（走 Vite 代理），生产环境填写完整 URL */
    readonly VITE_API_BASE_URL: string;
    /** 应用标题，显示在浏览器标签页和导航栏 */
    readonly VITE_APP_TITLE: string;
}

// PWA 安装提示事件类型
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare module "china-area-data" {
	const data: Record<string, Record<string, string>>;
	export default data;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
