<template>
  <div class="structure-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">结构特征</h1>
      <p class="page-subtitle">基础分布、动态跨度、关联关系和冷热遗漏的当前读数</p>
    </div>

    <!-- 2x2 网格 -->
    <div class="structure-grid">
      <!-- 基础分布 -->
      <div class="feature-card">
        <div class="feature-card-header">
          <div class="card-icon icon-green">📊</div>
          <h2 class="card-title">基础分布</h2>
        </div>
        <div class="feature-body">
          <div class="feature-row" v-for="item in basicDistribution" :key="item.label">
            <span class="feature-label">{{ item.label }}</span>
            <div class="feature-bar-bg">
              <div
                class="feature-bar-fill bar-green"
                :style="{ width: item.percent + '%' }"
              ></div>
            </div>
            <span class="feature-value">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- 动态跨度 -->
      <div class="feature-card">
        <div class="feature-card-header">
          <div class="card-icon icon-blue">📏</div>
          <h2 class="card-title">动态跨度</h2>
        </div>
        <div class="feature-body">
          <div class="feature-value-grid">
            <div class="fv-item" v-for="item in dynamicSpan" :key="item.label">
              <span class="fv-label">{{ item.label }}</span>
              <span class="fv-number" :class="getNumberClass(item)">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 结构关系 -->
      <div class="feature-card">
        <div class="feature-card-header">
          <div class="card-icon icon-yellow">🔗</div>
          <h2 class="card-title">结构关系</h2>
        </div>
        <div class="feature-body">
          <div class="feature-value-grid">
            <div class="fv-item" v-for="item in structureRelation" :key="item.label">
              <span class="fv-label">{{ item.label }}</span>
              <span class="fv-number" :class="getNumberClass(item)">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 冷热遗漏 -->
      <div class="feature-card">
        <div class="feature-card-header">
          <div class="card-icon icon-red">🔥</div>
          <h2 class="card-title">冷热遗漏</h2>
        </div>
        <div class="feature-body">
          <div class="omission-section">
            <div class="omission-row">
              <span class="omission-label hot">热码</span>
              <div class="omission-balls">
                <span
                  v-for="n in hotNumbers"
                  :key="'hot' + n"
                  class="ball ball-front ball-small"
                >{{ n }}</span>
              </div>
            </div>
            <div class="omission-row">
              <span class="omission-label cold">冷码</span>
              <div class="omission-balls">
                <span
                  v-for="n in coldNumbers"
                  :key="'cold' + n"
                  class="ball ball-front ball-small ball-dim"
                >{{ n }}</span>
              </div>
            </div>
            <div class="omission-stats">
              <div class="os-item">
                <span class="os-label">最高遗漏</span>
                <span class="os-value os-warn">{{ maxOmission }}期</span>
              </div>
              <div class="os-item">
                <span class="os-label">和值主区间</span>
                <span class="os-value">{{ sumRangeVal.low }}-{{ sumRangeVal.high }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全部期数的特征表格 -->
    <div class="section-title">各期结构特征一览</div>
    <div class="feature-table card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>期号</th>
              <th>日期</th>
              <th>质合比</th>
              <th>大小比</th>
              <th>奇偶比</th>
              <th>012路</th>
              <th>三区比</th>
              <th>和值</th>
              <th>跨度</th>
              <th>AC值</th>
              <th>连号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="draw in tableData" :key="draw.period">
              <td class="td-period">{{ draw.period }}</td>
              <td class="td-date">{{ draw.date }}</td>
              <td>{{ primeCompositeRatio(draw.frontNumbers) }}</td>
              <td>{{ bigSmallRatio(draw.frontNumbers) }}</td>
              <td>{{ oddEvenRatio(draw.frontNumbers) }}</td>
              <td>{{ road012Ratio(draw.frontNumbers) }}</td>
              <td>{{ zoneRatio(draw.frontNumbers) }}</td>
              <td class="td-number">{{ frontSum(draw.frontNumbers) }}</td>
              <td class="td-number">{{ span(draw.frontNumbers) }}</td>
              <td class="td-number">{{ acValue(draw.frontNumbers) }}</td>
              <td class="td-number">{{ consecutivePairs(draw.frontNumbers) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer" v-if="showAll">
        <button class="btn btn-link" @click="showAll = false">收起部分</button>
      </div>
      <div class="table-footer" v-else>
        <button class="btn btn-link" @click="showAll = true">查看全部 {{ totalPeriods }} 期</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData, getTotalPeriods } from '@/data/lottery'
import {
  frontSum, span, acValue, oddEvenRatio, bigSmallRatio,
  primeCompositeRatio, road012Ratio, zoneRatio,
  consecutivePairs, repeatNumbers, diagonalNeighbors,
  calculateOmission, calculateFrequency, sumRange
} from '@/utils/lotto'

const showAll = ref(false)
const totalPeriods = getTotalPeriods()

// 最新一期
const latestDraw = lotteryData[0]
const prevDraw = lotteryData[1] || null

// 基础分布
const basicDistribution = computed(() => {
  const items = [
    { label: '质合比', value: primeCompositeRatio(latestDraw.frontNumbers) },
    { label: '大小比', value: bigSmallRatio(latestDraw.frontNumbers) },
    { label: '奇偶比', value: oddEvenRatio(latestDraw.frontNumbers) },
    { label: '012路比', value: road012Ratio(latestDraw.frontNumbers) }
  ]
  return items.map(item => {
    const [a, b] = item.value.split(':').map(Number)
    const total = a + b || (item.value.includes(':') ? a + (item.value.split(':')[1] ? Number(item.value.split(':')[1]) : 0) : 0)
    // 对于012路是三部分
    let percent = 50
    if (item.label === '012路比') {
      const parts = item.value.split(':').map(Number)
      percent = ((parts[0] + parts[1]) / 5) * 100
    } else if (total > 0) {
      percent = (a / total) * 100
    }
    return { ...item, percent }
  })
})

// 动态跨度
const dynamicSpan = computed(() => [
  { label: '前区和值', value: frontSum(latestDraw.frontNumbers), unit: '' },
  { label: '后区和值', value: frontSum(latestDraw.backNumbers), unit: '' },
  { label: '前区跨度', value: span(latestDraw.frontNumbers), unit: '' },
  { label: '前区AC值', value: acValue(latestDraw.frontNumbers), unit: '' }
])

// 结构关系
const structureRelation = computed(() => {
  const repeat = prevDraw ? repeatNumbers(latestDraw.frontNumbers, prevDraw.frontNumbers) : 0
  const diagonal = prevDraw ? diagonalNeighbors(latestDraw.frontNumbers, prevDraw.frontNumbers) : 0
  return [
    { label: '三区比', value: zoneRatio(latestDraw.frontNumbers), highlight: false },
    { label: '连号对', value: consecutivePairs(latestDraw.frontNumbers), highlight: consecutivePairs(latestDraw.frontNumbers) > 0 },
    { label: '重号', value: repeat, highlight: repeat > 0 },
    { label: '斜连邻号', value: diagonal, highlight: diagonal > 0 }
  ]
})

// 冷热遗漏
const omissions = computed(() => {
  const result = []
  for (let i = 1; i <= 35; i++) {
    result.push({ number: i, omission: calculateOmission(lotteryData, i, 'front') })
  }
  return result
})

const hotNumbers = computed(() => {
  return [...omissions.value]
    .sort((a, b) => a.omission - b.omission)
    .slice(0, 5)
    .map(o => o.number)
    .sort((a, b) => a - b)
})

const coldNumbers = computed(() => {
  return [...omissions.value]
    .filter(o => o.omission > 3)
    .sort((a, b) => b.omission - a.omission)
    .slice(0, 5)
    .map(o => o.number)
    .sort((a, b) => a - b)
})

const maxOmission = computed(() => Math.max(...omissions.value.map(o => o.omission)))

const sumRangeVal = computed(() => sumRange(lotteryData, 50))

// 表格数据
const tableData = computed(() => {
  const count = showAll.value ? lotteryData.length : Math.min(20, lotteryData.length)
  return lotteryData.slice(0, count)
})

function getNumberClass(item) {
  if (item.highlight) return 'fv-number-highlight'
  return ''
}
</script>

<style scoped>
.structure-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
  line-height: 1.3;
}

.page-subtitle {
  font-size: 14px;
  color: #888;
}

/* 2x2 网格 */
.structure-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 28px;
}

.feature-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.feature-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.icon-green { background: #f6ffed; }
.icon-blue { background: #f0f5ff; }
.icon-yellow { background: #fffbe6; }
.icon-red { background: #fff2f0; }

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

/* 基础分布 */
.feature-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-label {
  font-size: 13px;
  color: #666;
  width: 56px;
  flex-shrink: 0;
}

.feature-bar-bg {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.feature-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-green { background: linear-gradient(90deg, #b7eb8f, #52c41a); }

.feature-value {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  width: 48px;
  text-align: right;
}

/* 动态跨度 & 结构关系 数值网格 */
.feature-value-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.fv-item {
  text-align: center;
  padding: 12px 8px;
  background: #fafafa;
  border-radius: 8px;
}

.fv-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.fv-number {
  display: inline-block;
  font-size: 22px;
  font-weight: 700;
  color: #1890ff;
  line-height: 1.2;
}

.fv-number-highlight {
  color: #ff4d4f;
}

/* 冷热遗漏 */
.omission-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.omission-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.omission-label {
  font-size: 12px;
  font-weight: 600;
  width: 36px;
  flex-shrink: 0;
}

.omission-label.hot { color: #ff4d4f; }
.omission-label.cold { color: #1890ff; }

.omission-balls {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
  color: #fff;
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
}

.ball-small {
  width: 30px;
  height: 30px;
  font-size: 12px;
}

.ball-dim {
  background: linear-gradient(135deg, #bbb, #999);
}

.omission-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
}

.os-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.os-label {
  font-size: 12px;
  color: #888;
}

.os-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.os-warn {
  color: #ff4d4f;
}

/* 特征表格 */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 3px solid #1890ff;
}

.feature-table {
  padding: 0;
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  background: #fafafa;
  font-weight: 600;
  color: #666;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid #f0f0f0;
  white-space: nowrap;
}

td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #f5f5f5;
  color: #555;
}

tr:hover td {
  background: #fafafa;
}

.td-period {
  font-weight: 600;
  color: #333;
}

.td-date {
  color: #888;
  white-space: nowrap;
}

.td-number {
  text-align: center;
}

.table-footer {
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #1890ff;
}

.btn:hover {
  background: #f0f5ff;
}

@media (max-width: 768px) {
  .structure-grid {
    grid-template-columns: 1fr;
  }
  .feature-value-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .structure-page {
    padding: 0 6px;
  }
  .page-header {
    flex-direction: column;
  }
  .page-title {
    font-size: 20px;
  }
  .card {
    padding: 14px;
  }
  .feature-card {
    padding: 16px;
  }
  .feature-value-grid {
    grid-template-columns: 1fr;
  }
  .feature-table {
    padding: 0;
  }
  .table-container {
    overflow-x: auto;
  }
  table {
    font-size: 12px;
  }
  th, td {
    padding: 6px 8px;
  }
  .section-title {
    font-size: 15px;
  }
  .omission-row {
    flex-wrap: wrap;
    gap: 6px;
  }
  .omission-balls {
    gap: 4px;
  }
  .ball.ball-small {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  .omission-stats {
    grid-template-columns: 1fr;
  }
  .feature-row {
    flex-wrap: wrap;
    gap: 4px;
  }
  .feature-label {
    font-size: 12px;
  }
}
</style>
