import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '仪表盘', icon: 'dashboard' }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: { title: '开奖历史', icon: 'history' }
  },
  {
    path: '/trend',
    name: 'Trend',
    component: () => import('../views/Trend.vue'),
    meta: { title: '走势分析', icon: 'trend' }
  },
  {
    path: '/prediction',
    name: 'Prediction',
    component: () => import('../views/Prediction.vue'),
    meta: { title: '预测号码', icon: 'prediction' }
  },
  {
    path: '/omission',
    name: 'Omission',
    component: () => import('../views/Omission.vue'),
    meta: { title: '冷热遗漏', icon: 'omission' }
  },
  {
    path: '/structure',
    name: 'Structure',
    component: () => import('../views/Structure.vue'),
    meta: { title: '结构特征', icon: 'structure' }
  },

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
