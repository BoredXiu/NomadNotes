/// <reference types="vite/client" />
/// <reference types="element-plus/global" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<object, object, unknown>;
	export default component;
}

declare module "china-area-data" {
	const data: Record<string, Record<string, string>>;
	export default data;
}

// PWA 安装提示事件类型
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// 为缺少类型导出的图标提供声明
declare module "@element-plus/icons-vue" {
	import type { DefineComponent } from "vue";
	const Icon: DefineComponent<object, object, unknown>;
	export const Aim: typeof Icon;
	export const ArrowLeft: typeof Icon;
	export const ArrowRight: typeof Icon;
	export const Calendar: typeof Icon;
	export const Camera: typeof Icon;
	export const Check: typeof Icon;
	export const CircleCloseFilled: typeof Icon;
	export const Clock: typeof Icon;
	export const Close: typeof Icon;
	export const Compass: typeof Icon;
	export const Delete: typeof Icon;
	export const Document: typeof Icon;
	export const Download: typeof Icon;
	export const Edit: typeof Icon;
	export const InfoFilled: typeof Icon;
	export const Key: typeof Icon;
	export const Location: typeof Icon;
	export const Lock: typeof Icon;
	export const Menu: typeof Icon;
	export const Message: typeof Icon;
	export const Money: typeof Icon;
	export const Moon: typeof Icon;
	export const More: typeof Icon;
	export const Picture: typeof Icon;
	export const Plus: typeof Icon;
	export const Search: typeof Icon;
	export const Setting: typeof Icon;
	export const Share: typeof Icon;
	export const SuccessFilled: typeof Icon;
	export const Sunny: typeof Icon;
	export const Switch: typeof Icon;
	export const SwitchButton: typeof Icon;
	export const Timer: typeof Icon;
	export const Upload: typeof Icon;
	export const User: typeof Icon;
	export const View: typeof Icon;
	export const WarningFilled: typeof Icon;
}
