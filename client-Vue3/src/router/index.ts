import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		// 认证路由（不包含导航栏）
		{
			path: "/login",
			name: "Login",
			component: () => import("../pages/LoginPage.vue"),
			meta: { guest: true },
		},
		{
			path: "/register",
			name: "Register",
			component: () => import("../pages/RegisterPage.vue"),
			meta: { guest: true },
		},
		// 公开路由（不包含导航栏，但登录用户会看到导航栏）
		{
			path: "/explore/:id",
			name: "PublicTripDetail",
			component: () => import("../components/PublicTripRoute.vue"),
		},
		// 受保护路由（包含导航栏），使用 ProtectedLayout 作为父组件
		{
			path: "/",
			component: () => import("../components/ProtectedLayout.vue"),
			meta: { requiresAuth: true },
			children: [
				{
					path: "",
					name: "Home",
					component: () => import("../pages/HomePage.vue"),
				},
				{
					path: "trip/new",
					name: "TripNew",
					component: () => import("../pages/TripFormPage.vue"),
				},
				{
					path: "trip/:id/edit",
					name: "TripEdit",
					component: () => import("../pages/TripFormPage.vue"),
				},
				{
					path: "trip/:id",
					name: "TripDetail",
					component: () => import("../pages/TripDetailPage.vue"),
				},
				{
					path: "trip/:tripId/expense/new",
					name: "ExpenseNew",
					component: () => import("../pages/ExpenseFormPage.vue"),
				},
				{
					path: "trip/:tripId/expense/:expenseId/edit",
					name: "ExpenseEdit",
					component: () => import("../pages/ExpenseFormPage.vue"),
				},
				{
					path: "trip/:tripId/note/new",
					name: "NoteNew",
					component: () => import("../pages/NoteFormPage.vue"),
				},
				{
					path: "note/:id",
					name: "NoteDetail",
					component: () => import("../pages/NoteDetailPage.vue"),
				},
				{
					path: "note/:noteId/edit",
					name: "NoteEdit",
					component: () => import("../pages/NoteFormPage.vue"),
				},
				{
					path: "profile",
					name: "Profile",
					component: () => import("../pages/ProfileEditPage.vue"),
				},
				{
					path: "search",
					name: "Search",
					component: () => import("../pages/SearchResultsPage.vue"),
				},
				{
					path: "explore",
					name: "Explore",
					component: () => import("../pages/ExplorePage.vue"),
				},
			],
		},
		// 404 重定向
		{
			path: "/:pathMatch(.*)*",
			redirect: "/",
		},
	],
});

// 路由守卫
router.beforeEach((to, _from, next) => {
	const token = localStorage.getItem("accessToken");

	if (to.meta.requiresAuth && !token) {
		next("/login");
	} else if (to.meta.guest && token) {
		next("/");
	} else {
		next();
	}
});

export default router;
