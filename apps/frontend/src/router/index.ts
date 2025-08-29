import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const Login = () => import("@/pages/Auth/Login.vue");
const AdminStorages = () => import("@/pages/Admin/Storages.vue");
const AdminRoutes = () => import("@/pages/Admin/Routes.vue");
const AdminUsers = () => import("@/pages/Admin/Users.vue");

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/admin/storages", component: AdminStorages },
  { path: "/admin/routes", component: AdminRoutes },
  { path: "/admin/users", component: AdminUsers },
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
