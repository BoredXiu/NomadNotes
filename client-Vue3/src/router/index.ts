import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
    {
      path: "/",
      name: "Home",
      component: () => import("../pages/HomePage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trip/new",
      name: "TripNew",
      component: () => import("../pages/TripFormPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trip/:id/edit",
      name: "TripEdit",
      component: () => import("../pages/TripFormPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trip/:id",
      name: "TripDetail",
      component: () => import("../pages/TripDetailPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trip/:tripId/expense/new",
      name: "ExpenseNew",
      component: () => import("../pages/ExpenseFormPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trip/:tripId/expense/:expenseId/edit",
      name: "ExpenseEdit",
      component: () => import("../pages/ExpenseFormPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trip/:tripId/note/new",
      name: "NoteNew",
      component: () => import("../pages/NoteFormPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/note/:id",
      name: "NoteDetail",
      component: () => import("../pages/NoteDetailPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/note/:noteId/edit",
      name: "NoteEdit",
      component: () => import("../pages/NoteFormPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/profile",
      name: "Profile",
      component: () => import("../pages/ProfileEditPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/search",
      name: "Search",
      component: () => import("../pages/SearchResultsPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/explore",
      name: "Explore",
      component: () => import("../pages/ExplorePage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/explore/:id",
      name: "PublicTripDetail",
      component: () => import("../pages/PublicTripDetailPage.vue"),
    },
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