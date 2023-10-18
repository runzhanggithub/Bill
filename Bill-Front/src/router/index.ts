import {
  createRouter,
  createWebHashHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router'
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login/index.vue')
  },
  {
    path: '/transaction_record',
    name: 'transactionRecord',
    meta: {
      requiresAuth: true,
    },
    component: () => import('../views/Transaction/transactionRecord.vue'),
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const token: string | null = cookies.get('access_token');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router
