<template>
  <div class="app-container">
    <!-- 侧边导航 -->
    <aside class="sidebar">
      <nav class="nav-menu">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const navItems = ref([
  { path: '/dashboard', title: '仪表盘', icon: '📊' },
  { path: '/history', title: '开奖历史', icon: '🕐' },
  { path: '/trend', title: '走势分析', icon: '📈' },
  { path: '/prediction', title: '预测号码', icon: '🎯' },
  { path: '/omission', title: '冷热遗漏', icon: '🔥' },
  { path: '/structure', title: '结构特征', icon: '🔲' },
])
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
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  padding: 20px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.nav-item.active {
  background: #e6f7ff;
  color: #1890ff;
  border-left-color: #1890ff;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

.main-content {
  flex: 1;
  margin-left: 200px;
  padding: 24px;
  min-height: 100vh;
}

/* 通用卡片样式 */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

/* 号码球样式 */
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
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
}

.ball-back {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

/* 按钮样式 */
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

.btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

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

/* 统计卡片 */
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-unit {
  font-size: 13px;
  color: #888;
  margin-left: 4px;
}

/* 表格样式 */
.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background: #fafafa;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

td {
  font-size: 14px;
}

tr:hover {
  background: #fafafa;
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .nav-text {
    display: none;
  }
  
  .main-content {
    margin-left: 60px;
    padding: 16px;
  }
}
</style>
