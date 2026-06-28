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
          <select v-model="periodCount" class="select-input">
            <option :value="30">近30期</option>
            <option :value="50">近50期</option>
            <option :value="100">近100期</option>
            <option :value="0">全部({{ totalCount }}期)</option>
          </select>
        </div>
        <button class="btn btn-export" @click="exportData">
          <span class="btn-icon">📥</span>
          导出CSV
        </button>
        <button class="btn btn-sync" @click="syncData" :disabled="syncing">
          <span class="btn-icon">{{ syncing ? '⏳' : '🔄' }}</span>
          {{ syncing ? '同步中...' : '补全数据' }}
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
              <th>日期</th>
              <th>中奖号码</th>
              <th>和值</th>
              <th>跨度</th>
              <th>一等奖</th>
              <th>奖池</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="draw in displayData" :key="draw.period" @click="showDetail(draw)" class="draw-row">
              <td>
                <span class="period-number">{{ draw.period }}</span>
              </td>
              <td class="date-cell">{{ draw.date }} <span class="day-tag">{{ dayLabel(draw.day) }}</span></td>
              <td class="numbers-cell">
                <span v-for="num in draw.frontNumbers" :key="'f' + num" class="ball ball-front">{{ formatNum(num) }}</span>
                <span class="ball-sep">+</span>
                <span v-for="num in draw.backNumbers" :key="'b' + num" class="ball ball-back">{{ formatNum(num) }}</span>
              </td>
              <td class="stat-cell">{{ frontSum(draw.frontNumbers) }}</td>
              <td class="stat-cell">{{ span(draw.frontNumbers) }}</td>
              <td class="money-cell" :class="{ missing: !draw.firstPrize }">{{ draw.firstPrize ? formatMoney(draw.firstPrize) : '——' }}</td>
              <td class="money-cell" :class="{ missing: !draw.pool }">{{ draw.pool ? formatMoney(draw.pool) : '——' }}</td>
              <td>
                <button class="btn-detail" @click.stop="showDetail(draw)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="displayData.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无数据</p>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" v-if="detailDraw" @click.self="closeDetail">
      <div class="modal-card">
        <button class="modal-close" @click="closeDetail">✕</button>
        <div class="modal-header">
          <h2 class="modal-title">第{{ detailDraw.period }}期 开奖详情</h2>
          <p class="modal-date">{{ detailDraw.date }} 星期{{ detailDraw.day }}</p>
        </div>

        <div class="modal-numbers">
          <div class="modal-section">
            <span class="section-label">前区</span>
            <div class="ball-row">
              <span v-for="n in detailDraw.frontNumbers" :key="'df'+n" class="ball ball-front ball-md">{{ formatNum(n) }}</span>
            </div>
          </div>
          <div class="modal-divider">+</div>
          <div class="modal-section">
            <span class="section-label">后区</span>
            <div class="ball-row">
              <span v-for="n in detailDraw.backNumbers" :key="'db'+n" class="ball ball-back ball-md">{{ formatNum(n) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-stats">
          <div class="stat-chip" v-for="s in detailStats" :key="s.label">
            <span class="chip-label">{{ s.label }}</span>
            <span class="chip-value">{{ s.value }}</span>
          </div>
        </div>

        <div class="modal-money" v-if="detailDraw.firstPrize || detailDraw.sales || detailDraw.pool">
          <div class="money-row" v-if="detailDraw.firstPrize">
            <span class="money-label">一等奖奖金</span>
            <span class="money-amount">{{ formatMoney(detailDraw.firstPrize) }}</span>
          </div>
          <div class="money-row" v-if="detailDraw.sales">
            <span class="money-label">销售额</span>
            <span class="money-amount">{{ formatMoney(detailDraw.sales) }}</span>
          </div>
          <div class="money-row" v-if="detailDraw.pool">
            <span class="money-label">奖池累计</span>
            <span class="money-amount highlight">{{ formatMoney(detailDraw.pool) }}</span>
          </div>
          <div class="money-row" v-if="!detailDraw.firstPrize && !detailDraw.sales && !detailDraw.pool">
            <span class="money-label">财务数据</span>
            <span class="money-missing">暂未收录，点击补全数据可尝试获取</span>
          </div>
        </div>
        <div class="modal-missing" v-else>
          <p>📊 暂无财务数据，点击上方「补全数据」可尝试从官方获取</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData } from '@/data/lottery'
import { frontSum, span, oddEvenRatio, primeCompositeRatio, bigSmallRatio, road012Ratio, consecutivePairs } from '@/utils/lotto'

const periodCount = ref(50)
const syncing = ref(false)
const detailDraw = ref(null)

const totalCount = computed(() => lotteryData.length)

const displayData = computed(() => {
  if (periodCount.value === 0) return lotteryData
  return lotteryData.slice(0, periodCount.value)
})

// ---------- Helpers ----------
function formatNum(num) {
  return String(num).padStart(2, '0')
}

function formatMoney(amount) {
  if (amount == null) return '——'
  return '¥' + amount.toLocaleString('zh-CN')
}

function dayLabel(day) {
  const map = { '一': '周一', '二': '周二', '三': '周三', '四': '周四', '五': '周五', '六': '周六', '日': '周日' }
  return map[day] || day
}

// ---------- Detail Modal ----------
function showDetail(draw) {
  detailDraw.value = draw
}

function closeDetail() {
  detailDraw.value = null
}

const detailStats = computed(() => {
  if (!detailDraw.value) return []
  const d = detailDraw.value
  const consec = consecutivePairs(d.frontNumbers)
  return [
    { label: '和值', value: frontSum(d.frontNumbers) },
    { label: '跨度', value: span(d.frontNumbers) },
    { label: '奇偶比', value: oddEvenRatio(d.frontNumbers) },
    { label: '质合比', value: primeCompositeRatio(d.frontNumbers) },
    { label: '大小比', value: bigSmallRatio(d.frontNumbers) },
    { label: '012路', value: road012Ratio(d.frontNumbers) },
    ...(consec > 0 ? [{ label: '连号', value: consec + '对' }] : [{ label: '连号', value: '无' }]),
  ]
})

// ---------- Export CSV ----------
function exportData() {
  const headers = ['期号', '开奖日期', '星期', '前区号码', '后区号码', '一等奖奖金', '销售额', '奖池累计']
  const rows = displayData.value.map(d => [
    d.period, d.date, dayLabel(d.day),
    d.frontNumbers.join(','), d.backNumbers.join(','),
    d.firstPrize || '', d.sales || '', d.pool || ''
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `大乐透_${periodCount.value || '全部'}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// ---------- Sync Data ----------
async function syncData() {
  syncing.value = true
  // 模拟抓取最新数据（后续可接入真实API）
  await new Promise(r => setTimeout(r, 1500))
  alert('已尝试同步最新开奖数据。如需自动定期更新，后续可配置定时任务。')
  syncing.value = false
}
</script>

<style scoped>
.history-page { max-width: 1200px; margin: 0 auto; }

/* Header */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
}
.header-left { flex: 1; }
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px 0; }
.page-subtitle { font-size: 14px; color: #888; margin: 0; }
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }

/* Select */
.select-input {
  padding: 8px 32px 8px 12px;
  border: 1px solid #d9d9d9; border-radius: 6px;
  font-size: 14px; color: #333;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none; cursor: pointer; min-width: 130px;
}
.select-input:hover { border-color: #1890ff; }
.select-input:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.2); }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid #d9d9d9; border-radius: 6px;
  background: #fff; color: #333; font-size: 13px; cursor: pointer;
  transition: all 0.3s;
}
.btn:hover { border-color: #1890ff; color: #1890ff; background: #f0f7ff; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sync:hover { border-color: #52c41a; color: #52c41a; background: #f6ffed; }
.btn-icon { font-size: 14px; }

/* Table Card */
.table-card {
  background: #fff; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; padding: 0;
}
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 750px; }
th {
  padding: 12px 14px; text-align: left; border-bottom: 2px solid #f0f0f0;
  background: #fafafa; font-weight: 600; color: #666; font-size: 12px; white-space: nowrap;
}
td {
  padding: 10px 14px; text-align: left; border-bottom: 1px solid #f0f0f0;
  font-size: 13px; color: #333; vertical-align: middle;
}
tr:last-child td { border-bottom: none; }

.draw-row { cursor: pointer; transition: background 0.2s; }
.draw-row:hover td { background: #f0f7ff; }

.period-number { color: #1890ff; font-weight: 700; cursor: pointer; }
.period-number:hover { text-decoration: underline; }
.date-cell { color: #666; font-size: 12px; white-space: nowrap; }
.day-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; background: #f5f5f5; color: #999; margin-left: 6px; }

/* Numbers */
.numbers-cell { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
.ball {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.ball-front { background: linear-gradient(135deg,#ff4d4f,#cf1322); box-shadow: 0 1px 3px rgba(255,77,79,0.3); }
.ball-back { background: linear-gradient(135deg,#1890ff,#096dd9); box-shadow: 0 1px 3px rgba(24,144,255,0.3); }
.ball-md { width: 36px; height: 36px; font-size: 14px; }
.ball-sep { color: #bbb; font-size: 12px; font-weight: 600; margin: 0 2px; }

.stat-cell { font-weight: 600; color: #555; font-size: 13px; }
.money-cell { font-family: monospace; font-size: 12px; white-space: nowrap; }
.money-cell.missing { color: #bbb; }

.btn-detail {
  padding: 3px 10px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #666; font-size: 11px; cursor: pointer; transition: all 0.3s;
}
.btn-detail:hover { border-color: #1890ff; color: #1890ff; background: #f0f7ff; }

.empty-state { text-align: center; padding: 60px 20px; color: #999; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 16px; }
.empty-state p { font-size: 14px; margin: 0; }

/* ========== Detail Modal ========== */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: #fff; border-radius: 16px;
  width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  padding: 32px; position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: modalIn 0.25s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-close {
  position: absolute; top: 14px; right: 14px;
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: #f5f5f5; color: #999;
  font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover { background: #ff4d4f; color: #fff; }

.modal-header { margin-bottom: 20px; }
.modal-title { font-size: 20px; font-weight: 700; margin: 0 0 4px 0; }
.modal-date { font-size: 14px; color: #888; margin: 0; }

.modal-numbers {
  display: flex; align-items: center; gap: 20px;
  padding: 20px; background: #fafafa; border-radius: 12px; margin-bottom: 16px;
}
.modal-section { display: flex; align-items: center; gap: 10px; }
.section-label { font-size: 12px; color: #999; font-weight: 500; flex-shrink: 0; }
.ball-row { display: flex; gap: 6px; }
.modal-divider { color: #d9d9d9; font-size: 18px; font-weight: 600; }

.modal-stats {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px; margin-bottom: 20px;
}
.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 8px; background: #fafafa; border-radius: 8px;
}
.chip-label { font-size: 11px; color: #999; margin-bottom: 4px; }
.chip-value { font-size: 16px; font-weight: 700; color: #333; }

.modal-money {
  border-top: 1px solid #f0f0f0; padding-top: 16px;
}
.money-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
}
.money-label { font-size: 13px; color: #888; }
.money-amount { font-size: 15px; font-weight: 700; color: #333; font-family: monospace; }
.money-amount.highlight { color: #fa8c16; }
.money-missing { font-size: 12px; color: #bbb; }

.modal-missing {
  text-align: center; padding: 16px; color: #bbb; font-size: 13px;
  border-top: 1px solid #f0f0f0; margin-top: 16px;
}


/* Responsive */
@media (max-width: 768px) {
  .page-header { flex-direction: column; }
  .header-right { width: 100%; justify-content: flex-start; }
  .ball { width: 22px; height: 22px; font-size: 10px; }
  th, td { padding: 8px 10px; }
  .modal-card { padding: 24px; }
  .modal-numbers { flex-direction: column; gap: 12px; }
  .stat-cell { font-size: 11px; }
}
</style>
