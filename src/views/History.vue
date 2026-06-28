<template>
  <div class="history-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">开奖历史</h1>
        <p class="page-subtitle">每一期中奖号码、一等奖奖金、销售额和奖池累计金额</p>
      </div>
      <div class="header-right">
        <div class="period-selector">
          <select v-model="periodCount" class="select-input" @change="handlePeriodChange">
            <option :value="30">近30期</option>
            <option :value="50">近50期</option>
            <option :value="100">近100期</option>
            <option :value="0">全部</option>
          </select>
        </div>
        <button class="btn btn-export" @click="exportData">
          <span class="export-icon">📥</span>
          导出数据
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card table-card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>期号</th>
              <th>开奖日期</th>
              <th>星期</th>
              <th>中奖号码</th>
              <th>一等奖奖金</th>
              <th>销售额</th>
              <th>奖池累计</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="draw in displayData" :key="draw.period">
              <td>
                <span class="period-number">{{ draw.period }}</span>
              </td>
              <td class="date-cell">{{ draw.date }}</td>
              <td>
                <span class="day-badge">{{ dayLabel(draw.day) }}</span>
              </td>
              <td class="numbers-cell">
                <span
                  v-for="num in draw.frontNumbers"
                  :key="'f' + num"
                  class="ball ball-front"
                >{{ formatNum(num) }}</span>
                <span class="ball-separator">+</span>
                <span
                  v-for="num in draw.backNumbers"
                  :key="'b' + num"
                  class="ball ball-back"
                >{{ formatNum(num) }}</span>
              </td>
              <td class="money-cell">{{ formatMoney(draw.firstPrize) }}</td>
              <td class="money-cell">{{ formatMoney(draw.sales) }}</td>
              <td class="money-cell">{{ formatMoney(draw.pool) }}</td>
              <td>
                <button class="btn btn-detail" @click="showDetail(draw.period)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="displayData.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData } from '@/data/lottery'

const periodCount = ref(30)

const displayData = computed(() => {
  if (periodCount.value === 0) return lotteryData
  return lotteryData.slice(0, periodCount.value)
})

function handlePeriodChange() {
  // Selection is already reactive via v-model
}

function formatNum(num) {
  return String(num).padStart(2, '0')
}

function formatMoney(amount) {
  if (amount == null) return '——'
  return '¥' + amount.toLocaleString('zh-CN')
}

function dayLabel(day) {
  const labels = { '一': '周一', '二': '周二', '三': '周三', '四': '周四', '五': '周五', '六': '周六', '日': '周日' }
  return labels[day] || day
}

function showDetail(period) {
  // Future enhancement: navigate to detail view or show modal
  alert('查看第' + period + '期详情')
}

function exportData() {
  const headers = ['期号', '开奖日期', '星期', '前区号码', '后区号码', '一等奖奖金', '销售额', '奖池累计']
  const rows = displayData.value.map(d => [
    d.period,
    d.date,
    dayLabel(d.day),
    d.frontNumbers.join(','),
    d.backNumbers.join(','),
    d.firstPrize,
    d.sales,
    d.pool
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `大乐透开奖历史_${periodCount.value || '全部'}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<style scoped>
.history-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Select Input */
.select-input {
  padding: 8px 32px 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  min-width: 120px;
}

.select-input:hover {
  border-color: #1890ff;
}

.select-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* Export Button */
.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-export:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f0f7ff;
}

.export-icon {
  font-size: 16px;
}

/* Table Card */
.table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  padding: 0;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

th {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 2px solid #f0f0f0;
  background: #fafafa;
  font-weight: 600;
  color: #666;
  font-size: 13px;
  white-space: nowrap;
}

td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: #f7faff;
}

/* Period Number */
.period-number {
  color: #1890ff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.period-number:hover {
  text-decoration: underline;
}

/* Date Cell */
.date-cell {
  color: #666;
  font-size: 13px;
}

/* Day Badge */
.day-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #f5f5f5;
  color: #666;
}

/* Numbers Cell */
.numbers-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
}

.ball-back {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
}

.ball-separator {
  color: #888;
  font-size: 14px;
  font-weight: 600;
  margin: 0 2px;
}

/* Money Cell */
.money-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}

/* Detail Button */
.btn-detail {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-detail:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f0f7ff;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }

  .ball {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  th, td {
    padding: 10px 12px;
  }
}
</style>
