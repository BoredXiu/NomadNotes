export interface User {
	id: string;
	username: string;
	email: string;
	avatarUrl: string | null;
	bio: string | null;
	address: string | null;
	gender: string | null;
}

export interface Trip {
	id: string;
	userId: string;
	title: string;
	destination: string;
	startDate: string;
	endDate: string;
	coverImage: string | null;
	isEnded: number;
	isPublic: number;
	createdAt: string;
	expenseCount?: number;
	noteCount?: number;
	isOwner?: boolean;
	User?: { id: string; username: string; avatarUrl: string | null };
}

export interface Expense {
	id: string;
	tripId: string;
	category: string;
	amount: number;
	note: string | null;
	receiptImage: string | null;
	expenseDate: string;
	createdAt: string;
}

export interface ExpenseStats {
	total: number;
	categories: { category: string; total: number; count: number }[];
}

export interface Note {
	id: string;
	tripId: string;
	content: string;
	images: string[] | null;
	vectorImages: string[] | null;
	noteDate: string;
	createdAt: string;
}

export interface PaginatedData<T> {
	list: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

export interface AuthData extends TokenPair {
	user: User;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message: string;
}

export const EXPENSE_CATEGORIES = [
	{ value: "餐饮", label: "餐饮" },
	{ value: "交通", label: "交通" },
	{ value: "住宿", label: "住宿" },
	{ value: "门票", label: "门票" },
	{ value: "购物", label: "购物" },
	{ value: "其他", label: "其他" },
] as const;
