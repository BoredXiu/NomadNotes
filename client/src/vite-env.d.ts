/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
}

declare module "china-area-data" {
	const data: Record<string, Record<string, string>>;
	export default data;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
