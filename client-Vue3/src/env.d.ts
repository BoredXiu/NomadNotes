/// <reference types="vite/client" />

// Vite 环境变量类型声明
// 为 import.meta.env 提供 TypeScript 类型提示
interface ImportMetaEnv {
    /** API 基础地址，开发环境使用 /api（走 Vite 代理），生产环境填写完整 URL */
    readonly VITE_API_BASE_URL: string;
    /** 应用标题，显示在浏览器标签页和导航栏 */
    readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}