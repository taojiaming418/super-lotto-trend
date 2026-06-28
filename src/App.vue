<template>
  <div class="app-container">
    <!-- 移动端菜单遮罩 -->
    <div class="mobile-overlay" v-if="mobileMenuOpen" @click="mobileMenuOpen = false"></div>
    
    <!-- 侧边导航 -->
    <aside class="sidebar" :class="{ 'sidebar-open': mobileMenuOpen }">
      <!-- 关闭按钮（移动端） -->
      <button class="sidebar-close" @click="mobileMenuOpen = false">✕</button>
      
      <div class="sidebar-header">
        <div class="logo">🎰</div>
        <span class="logo-text">大乐透走势</span>
      </div>
      
      <nav class="nav-menu">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
          @click="mobileMenuOpen = false"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- 移动端顶部栏 -->
    <header class="mobile-header">
      <button class="hamburger" @click="mobileMenuOpen = !mobileMenuOpen">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <span class="mobile-title">{{ currentTitle }}</span>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 加载进度条 -->
      <div class="route-loading-bar" v-if="loading" :key="loadingKey"></div>
      
      <!-- 页面切换动画 -->
      <router-view v-slot="{ Component, route }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)
const loading = ref(false)
let loadingKey = ref(0)

const navItems = ref([
  { path: '/dashboard', title: '仪表盘', icon: '📊' },
  { path: '/history', title: '开奖历史', icon: '📜' },
  { path: '/trend', title: '走势分析', icon: '📈' },
  { path: '/prediction', title: '预测号码', icon: '🎯' },
  { path: '/omission', title: '冷热遗漏', icon: '🔥' },
  { path: '/structure', title: '结构特征', icon: '🔲' },
])

const currentTitle = computed(() => {
  const item = navItems.value.find(n => n.path === route.path)
  return item ? item.title : '大乐透走势'
})

// 路由加载 - 短闪烁提示
watch(() => route.path, () => {
  loading.value = true
  loadingKey.value++
  setTimeout(() => { loading.value = false }, 400)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f0f2f5;
  color: #333;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

/* ====== 侧边栏 ====== */
.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  padding: 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.logo { font-size: 24px; }
.logo-text { font-size: 16px; font-weight: 700; color: #1a1a2e; }

.sidebar-close { display: none; }

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  color: #666;
  text-decoration: none;
  transition: all 0.2s;
  border-radius: 8px;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.nav-item.active {
  background: #e6f7ff;
  color: #1890ff;
  font-weight: 600;
}

.nav-icon { font-size: 18px; width: 24px; text-align: center; }
.nav-text { font-size: 14px; }

/* ====== 移动端顶部栏 ====== */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 99;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}

.hamburger {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  border-radius: 6px;
}

.hamburger:hover { background: #f5f5f5; }

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: #333;
  border-radius: 2px;
  transition: all 0.3s;
}

.mobile-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

/* ====== 主内容区 ====== */
.main-content {
  flex: 1;
  margin-left: 200px;
  padding: 24px;
  min-height: 100vh;
  position: relative;
}

/* 加载进度条 */
.route-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #1890ff, #52c41a, #fa8c16);
  z-index: 9999;
  animation: loadingBar 0.4s ease;
}

@keyframes loadingBar {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* ====== 页面切换动画 ====== */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ====== 通用组件样式 ====== */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

/* 号码球 */
.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0 4px;
  flex-shrink: 0;
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  box-shadow: 0 2px 4px rgba(207, 19, 34, 0.25);
}

.ball-back {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.25);
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:hover { border-color: #1890ff; color: #1890ff; }

.btn-primary {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

.btn-primary:hover {
  background: #cf1322;
  border-color: #cf1322;
  color: #fff;
}

.btn-success {
  background: #52c41a;
  border-color: #52c41a;
  color: #fff;
}

/* 表格 */
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 600px; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
th { background: #fafafa; font-weight: 600; color: #666; font-size: 13px; white-space: nowrap; }
td { font-size: 14px; color: #333; }
tr:hover td { background: #fafafa; }

/* 统计卡片 */
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-label { font-size: 13px; color: #888; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 600; color: #333; }
.stat-unit { font-size: 13px; color: #888; margin-left: 4px; }

/* 页面通用 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left { flex: 1; }
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px 0; }
.page-subtitle { font-size: 14px; color: #888; margin: 0; }

/* 滚动条美化 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #bbb; }

/* ====== 移动端响应式 ====== */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  }
  
  .sidebar.sidebar-open { transform: translateX(0); }
  
  .sidebar-close {
    display: flex;
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    font-size: 12px;
    color: #999;
    cursor: pointer;
  }
  
  .mobile-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.3);
    z-index: 99;
  }
  
  .mobile-header { display: flex; }
  
  .main-content {
    margin-left: 0;
    padding: 64px 12px 16px;
  }
  
  .page-title { font-size: 20px; }
  .page-header { gap: 12px; }
  .stat-value { font-size: 20px; }
  .ball { width: 30px; height: 30px; font-size: 12px; }
}
</style>
