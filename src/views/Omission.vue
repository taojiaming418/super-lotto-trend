<template>
  <div class="omission-page">
    <!-- Header Section (same as Dashboard style) -->
    <div class="header-section">
      <div class="header-top">
        <div>
          <h1 class="main-title">超级大乐透走势预测</h1>
          <p class="main-subtitle">综合分析历史数据，预测号码走势趋势</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-refresh" @click="refreshData">
            <span>🔄</span> 刷新数据
          </button>
          <button class="btn btn-update" @click="updatePrediction">
            <span>🔄</span> 更新预测
          </button>
        </div>
      </div>

      <!-- Info Bar -->
      <div class="info-bar">
        <div class="info-item">
          <span class="info-label">数据版本</span>
          <span class="info-value">V13 Refined</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">数据范围</span>
          <span class="info-value">{{ totalPeriods }}期</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">最近更新</span>
          <span class="info-value">{{ latestDraw ? latestDraw.date : '-' }}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">奖池累计</span>
          <span class="info-value highlight">{{ latestDraw ? formatMoney(latestDraw.pool) : '-' }}</span>
        </div>
      </div>
    </div>

    <!-- Latest Draw Display -->
    <div class="latest-draw-section" v-if="latestDraw">
      <div class="latest-draw-header">
        <div class="latest-draw-title">
          <span class="draw-label">最新开奖</span>
          <span class="draw-period">{{ latestDraw.period }}期</span>
          <span class="draw-date">{{ latestDraw.date }} 周{{ latestDraw.day }}</span>
        </div>
      </div>
      <div class="draw-numbers">
        <div class="number-group">
          <span class="group-label">前区</span>
          <span
            v-for="num in latestDraw.frontNumbers"
            :key="'f' + num"
            class="ball ball-front ball-lg"
          >{{ formatNum(num) }}</span>
        </div>
        <div class="number-separator">
          <span class="plus-icon">+</span>
        </div>
        <div class="number-group">
          <span class="group-label">后区</span>
          <span
            v-for="num in latestDraw.backNumbers"
            :key="'b' + num"
            class="ball ball-back ball-lg"
          >{{ formatNum(num) }}</span>
        </div>
      </div>
    </div>

    <!-- Next Draw Reference -->
    <div class="card reference-card">
      <div class="card-title">下期参考</div>
      <div class="reference-grid">
        <div class="reference-item">
          <span class="ref-label">和值区间</span>
          <span class="ref-value">{{ sumRangeRef.low }} - {{ sumRangeRef.high }}</span>
        </div>
        <div class="reference-item">
          <span class="ref-label">奇偶比</span>
          <span class="ref-value">{{ lastOddEven }} (推荐 {{ recommendedOddEven }})</span>
        </div>
        <div class="reference-item">
          <span class="ref-label">大小比</span>
          <span class="ref-value">{{ lastBigSmall }} (推荐 {{ recommendedBigSmall }})</span>
        </div>
        <div class="reference-item">
          <span class="ref-label">012路</span>
          <span class="ref-value">{{ lastroad012 }} (推荐 {{ recommendedroad012 }})</span>
        </div>
        <div class="reference-item">
          <span class="ref-label">AC值</span>
          <span class="ref-value">{{ lastACValue }} (推荐 {{ recommendedACValue }})</span>
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stat-cards-row">
      <div class="stat-card">
        <div class="stat-label">前区号码平均值</div>
        <div class="stat-value">{{ avgFrontNumber.toFixed(1) }}</div>
        <div class="stat-trend">近30期均值</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">前区和值均值</div>
        <div class="stat-value">{{ avgSum.toFixed(0) }}</div>
        <div class="stat-trend">近30期均值</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">后区号码均值</div>
        <div class="stat-value">{{ avgBackNumber.toFixed(1) }}</div>
        <div class="stat-trend">近30期均值</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">连号出现概率</div>
        <div class="stat-value">{{ consecutiveRate }}%</div>
        <div class="stat-trend">近30期</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="card charts-card">
      <div class="card-title">中奖号码走势分析可视化图</div>
      <p class="card-subtitle">和值、跨度、AC、奇偶、连号、冷热和遗漏的图形化分析</p>
      <div class="charts-grid">
        <div class="chart-placeholder">
          <div class="chart-icon">📈</div>
          <div class="chart-label">和值与奖池走势</div>
          <div class="chart-desc">前区和值与奖池累计变化趋势</div>
          <div class="chart-preview">
            <svg viewBox="0 0 300 100" class="chart-svg">
              <polyline points="10,80 50,60 90,70 130,40 170,50 210,30 250,45 290,20"
                fill="none" stroke="#ff4d4f" stroke-width="2" opacity="0.7"/>
              <polyline points="10,90 50,85 90,80 130,75 170,65 210,60 250,55 290,50"
                fill="none" stroke="#1890ff" stroke-width="2" opacity="0.5"/>
            </svg>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <div class="chart-label">跨度/AC复杂度</div>
          <div class="chart-desc">前区跨度和AC值变化趋势</div>
          <div class="chart-preview">
            <svg viewBox="0 0 300 100" class="chart-svg">
              <polyline points="10,70 50,50 90,75 130,45 170,60 210,35 250,55 290,30"
                fill="none" stroke="#52c41a" stroke-width="2" opacity="0.7"/>
              <polyline points="10,85 50,75 90,80 130,65 170,70 210,60 250,72 290,55"
                fill="none" stroke="#faad14" stroke-width="2" opacity="0.5"/>
            </svg>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="chart-icon">📉</div>
          <div class="chart-label">奇偶与连号走势</div>
          <div class="chart-desc">奇偶比值和连号数量变化趋势</div>
          <div class="chart-preview">
            <svg viewBox="0 0 300 100" class="chart-svg">
              <polyline points="10,50 50,40 90,60 130,35 170,55 210,45 250,30 290,50"
                fill="none" stroke="#722ed1" stroke-width="2" opacity="0.7"/>
              <polyline points="10,90 50,80 90,85 130,70 170,75 210,65 250,80 290,60"
                fill="none" stroke="#eb2f96" stroke-width="2" opacity="0.5"/>
            </svg>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="chart-icon">🔥</div>
          <div class="chart-label">前区冷热遗漏</div>
          <div class="chart-desc">各号码出现频次与遗漏值</div>
          <div class="chart-preview">
            <svg viewBox="0 0 300 100" class="chart-svg">
              <rect x="10" y="60" width="6" height="40" fill="#ff4d4f" opacity="0.7"/>
              <rect x="20" y="45" width="6" height="55" fill="#ff7875" opacity="0.7"/>
              <rect x="30" y="70" width="6" height="30" fill="#ff9c6e" opacity="0.7"/>
              <rect x="40" y="30" width="6" height="70" fill="#ff4d4f" opacity="0.8"/>
              <rect x="50" y="80" width="6" height="20" fill="#ffc069" opacity="0.7"/>
              <rect x="60" y="55" width="6" height="45" fill="#ff7875" opacity="0.7"/>
              <rect x="70" y="40" width="6" height="60" fill="#ff4d4f" opacity="0.7"/>
              <rect x="80" y="75" width="6" height="25" fill="#ffc069" opacity="0.7"/>
              <rect x="90" y="20" width="6" height="80" fill="#ff4d4f" opacity="0.9"/>
              <polyline points="10,60 20,45 30,70 40,30 50,80 60,55 70,40 80,75 90,20"
                fill="none" stroke="#1890ff" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.5"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Front Zone Heatmap -->
    <div class="card heatmap-card">
      <div class="card-title">
        前区号码热力图
        <span class="heatmap-subtitle">近30期频次热力（颜色越深=出现越多）</span>
      </div>
      <div class="heatmap-grid front-heatmap">
        <div
          v-for="cell in frontHeatmap"
          :key="'fhm' + cell.number"
          class="heatmap-cell"
          :style="{ backgroundColor: cell.color }"
          :title="`号码 ${formatNum(cell.number)}: 出现${cell.frequency}次, 遗漏${cell.omission}期`"
        >
          <span class="heatmap-number">{{ formatNum(cell.number) }}</span>
          <span class="heatmap-omission">{{ cell.omission === 0 ? '本期' : cell.omission + '期' }}</span>
        </div>
      </div>
    </div>

    <!-- Back Zone Heatmap -->
    <div class="card heatmap-card">
      <div class="card-title">
        后区号码热力图
        <span class="heatmap-subtitle">近30期频次热力（颜色越深=出现越多）</span>
      </div>
      <div class="heatmap-grid back-heatmap">
        <div
          v-for="cell in backHeatmap"
          :key="'bhm' + cell.number"
          class="heatmap-cell"
          :style="{ backgroundColor: cell.color }"
          :title="`号码 ${formatNum(cell.number)}: 出现${cell.frequency}次, 遗漏${cell.omission}期`"
        >
          <span class="heatmap-number">{{ formatNum(cell.number) }}</span>
          <span class="heatmap-omission">{{ cell.omission === 0 ? '本期' : cell.omission + '期' }}</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap-legend">
      <span class="legend-label">冷</span>
      <span class="legend-bar">
        <span class="legend-step" v-for="step in legendSteps" :key="step" :style="{ background: step }"></span>
      </span>
      <span class="legend-label">热</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData, getLatestDraw, getTotalPeriods } from '@/data/lottery'
import {
  frontSum, span, acValue, oddEvenRatio, bigSmallRatio,
  road012Ratio, consecutivePairs, calculateOmission, calculateFrequency,
  sumRange
} from '@/utils/lotto'

// ---------- Data ----------
const latestDraw = getLatestDraw()
const totalPeriods = getTotalPeriods()
const recent30 = lotteryData.slice(0, 30)

// ---------- Info helpers ----------
function formatMoney(amount) {
  return '¥' + amount.toLocaleString('zh-CN')
}

function formatNum(num) {
  return String(num).padStart(2, '0')
}

// ---------- Reference Section ----------
const sumRangeRef = computed(() => sumRange(lotteryData, 50))

const lastOddEven = computed(() => {
  if (!latestDraw) return '-'
  return oddEvenRatio(latestDraw.frontNumbers)
})

const lastBigSmall = computed(() => {
  if (!latestDraw) return '-'
  return bigSmallRatio(latestDraw.frontNumbers)
})

const lastroad012 = computed(() => {
  if (!latestDraw) return '-'
  return road012Ratio(latestDraw.frontNumbers)
})

const lastACValue = computed(() => {
  if (!latestDraw) return '-'
  return acValue(latestDraw.frontNumbers)
})

// Recommended values based on historical stats
const recommendedOddEven = computed(() => {
  const stats = {}
  for (let i = 0; i < 30 && i < lotteryData.length; i++) {
    const ratio = oddEvenRatio(lotteryData[i].frontNumbers)
    stats[ratio] = (stats[ratio] || 0) + 1
  }
  return Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] || '3:2'
})

const recommendedBigSmall = computed(() => {
  const stats = {}
  for (let i = 0; i < 30 && i < lotteryData.length; i++) {
    const ratio = bigSmallRatio(lotteryData[i].frontNumbers)
    stats[ratio] = (stats[ratio] || 0) + 1
  }
  return Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] || '2:3'
})

const recommendedroad012 = computed(() => {
  const stats = {}
  for (let i = 0; i < 30 && i < lotteryData.length; i++) {
    const ratio = road012Ratio(lotteryData[i].frontNumbers)
    stats[ratio] = (stats[ratio] || 0) + 1
  }
  return Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] || '1:2:2'
})

const recommendedACValue = computed(() => {
  const values = []
  for (let i = 0; i < 30 && i < lotteryData.length; i++) {
    values.push(acValue(lotteryData[i].frontNumbers))
  }
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  return Math.round(avg)
})

// ---------- Stat Cards ----------
const avgFrontNumber = computed(() => {
  if (recent30.length === 0) return 0
  const allNums = recent30.flatMap(d => d.frontNumbers)
  return allNums.reduce((s, n) => s + n, 0) / allNums.length
})

const avgSum = computed(() => {
  if (recent30.length === 0) return 0
  const sums = recent30.map(d => frontSum(d.frontNumbers))
  return sums.reduce((s, n) => s + n, 0) / sums.length
})

const avgBackNumber = computed(() => {
  if (recent30.length === 0) return 0
  const allNums = recent30.flatMap(d => d.backNumbers)
  return allNums.reduce((s, n) => s + n, 0) / allNums.length
})

const consecutiveRate = computed(() => {
  if (recent30.length === 0) return 0
  const withConsecutive = recent30.filter(d => consecutivePairs(d.frontNumbers) > 0).length
  return Math.round((withConsecutive / recent30.length) * 100)
})

// ---------- Heatmap ----------
const legendSteps = [
  'linear-gradient(135deg, #e6f7ff, #bae7ff)',
  'linear-gradient(135deg, #bae7ff, #91d5ff)',
  'linear-gradient(135deg, #91d5ff, #69c0ff)',
  'linear-gradient(135deg, #69c0ff, #ffd591)',
  'linear-gradient(135deg, #ffd591, #ffa39e)',
  'linear-gradient(135deg, #ffa39e, #ff7a45)',
  'linear-gradient(135deg, #ff7a45, #ff4d4f)',
  'linear-gradient(135deg, #ff4d4f, #cf1322)',
]

function getHeatColor(frequency, maxFreq) {
  if (maxFreq === 0) return 'linear-gradient(135deg, #e6f7ff, #bae7ff)'
  const ratio = frequency / maxFreq
  if (ratio === 0) return 'linear-gradient(135deg, #e6f7ff, #bae7ff)'
  if (ratio <= 0.2) return 'linear-gradient(135deg, #bae7ff, #91d5ff)'
  if (ratio <= 0.4) return 'linear-gradient(135deg, #91d5ff, #69c0ff)'
  if (ratio <= 0.5) return 'linear-gradient(135deg, #69c0ff, #ffd591)'
  if (ratio <= 0.6) return 'linear-gradient(135deg, #ffd591, #ffa39e)'
  if (ratio <= 0.7) return 'linear-gradient(135deg, #ffa39e, #ff7a45)'
  if (ratio <= 0.85) return 'linear-gradient(135deg, #ff7a45, #ff4d4f)'
  return 'linear-gradient(135deg, #ff4d4f, #cf1322)'
}

function buildHeatmapData(zone) {
  const maxNum = zone === 'front' ? 35 : 12
  const key = zone === 'front' ? 'frontNumbers' : 'backNumbers'
  const cells = []
  let maxFreq = 0
  const dataMap = {}

  for (let num = 1; num <= maxNum; num++) {
    const freq = calculateFrequency(lotteryData, num, 30, zone)
    const om = calculateOmission(lotteryData, num, zone)
    dataMap[num] = { frequency: freq, omission: om }
    if (freq > maxFreq) maxFreq = freq
  }

  for (let num = 1; num <= maxNum; num++) {
    const { frequency, omission } = dataMap[num]
    cells.push({
      number: num,
      frequency,
      omission,
      color: getHeatColor(frequency, maxFreq)
    })
  }
  return cells
}

const frontHeatmap = computed(() => buildHeatmapData('front'))
const backHeatmap = computed(() => buildHeatmapData('back'))

// ---------- Actions ----------
function refreshData() {
  // Placeholder for future data refresh
  alert('数据已是最新')
}

function updatePrediction() {
  // Placeholder for future prediction update
  alert('预测已更新')
}
</script>

<style scoped>
.omission-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* ========== Header ========== */
.header-section {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 20px;
  color: #fff;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.main-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #fff;
}

.main-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-refresh span,
.btn-update span {
  font-size: 14px;
}

/* Info Bar */
.info-bar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 20px;
}

.info-item:first-child {
  padding-left: 0;
}

.info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.info-value.highlight {
  color: #ffd700;
}

.info-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

/* ========== Latest Draw ========== */
.latest-draw-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.latest-draw-header {
  margin-bottom: 16px;
}

.latest-draw-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.draw-label {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
  padding: 2px 10px;
  background: #fff1f0;
  border-radius: 4px;
}

.draw-period {
  font-size: 16px;
  font-weight: 700;
  color: #1890ff;
}

.draw-date {
  font-size: 13px;
  color: #888;
}

.draw-numbers {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  padding: 12px 0;
}

.number-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-label {
  font-size: 13px;
  color: #888;
  margin-right: 4px;
  font-weight: 500;
}

.number-separator {
  display: flex;
  align-items: center;
}

.plus-icon {
  font-size: 24px;
  color: #ccc;
  font-weight: 300;
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.ball-lg {
  width: 44px;
  height: 44px;
  font-size: 18px;
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  box-shadow: 0 3px 8px rgba(255, 77, 79, 0.35);
}

.ball-back {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 3px 8px rgba(24, 144, 255, 0.35);
}

/* ========== Reference Card ========== */
.reference-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.reference-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.reference-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.ref-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.ref-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

/* ========== Stat Cards ========== */
.stat-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
  font-family: 'SFMono-Regular', Consolas, monospace;
}

.stat-trend {
  font-size: 12px;
  color: #aaa;
}

/* ========== Charts Section ========== */
.charts-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-subtitle {
  font-size: 13px;
  color: #888;
  margin: -12px 0 20px 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-placeholder {
  background: #fafbfc;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.chart-placeholder:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.chart-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.chart-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.chart-desc {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 16px;
}

.chart-preview {
  max-width: 100%;
  height: 80px;
}

.chart-svg {
  width: 100%;
  height: 100%;
}

/* ========== Heatmap ========== */
.heatmap-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.heatmap-subtitle {
  font-size: 12px;
  color: #888;
  font-weight: 400;
  margin-left: 8px;
}

.heatmap-grid {
  display: grid;
  gap: 8px;
}

.front-heatmap {
  grid-template-columns: repeat(7, 1fr);
}

.back-heatmap {
  grid-template-columns: repeat(6, 1fr);
  max-width: 70%;
  margin: 0 auto;
}

.heatmap-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.04);
  min-height: 60px;
}

.heatmap-cell:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.heatmap-number {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.3;
}

.heatmap-omission {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
  white-space: nowrap;
}

/* Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.legend-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.legend-bar {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
}

.legend-step {
  width: 24px;
  height: 12px;
}

/* ========== Card base (shared) ========== */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ========== Responsive ========== */
@media (max-width: 960px) {
  .stat-cards-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .front-heatmap {
    grid-template-columns: repeat(5, 1fr);
  }

  .back-heatmap {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .header-top {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .btn {
    flex: 1;
    justify-content: center;
  }

  .info-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-divider {
    display: none;
  }

  .info-item {
    padding: 0;
  }

  .stat-cards-row {
    grid-template-columns: 1fr 1fr;
  }

  .front-heatmap {
    grid-template-columns: repeat(5, 1fr);
  }

  .back-heatmap {
    max-width: 100%;
    grid-template-columns: repeat(6, 1fr);
  }

  .heatmap-cell {
    padding: 8px 4px;
    min-height: 50px;
  }

  .heatmap-number {
    font-size: 13px;
  }

  .reference-grid {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .ball-lg {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }

  .draw-numbers {
    gap: 10px;
  }
}
</style>
