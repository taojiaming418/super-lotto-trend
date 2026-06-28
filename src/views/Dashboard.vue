<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">超级大乐透走势预测</h1>
      <p class="page-subtitle">前区35选5 + 后区12选2，多变量特征工程与可视化复盘</p>
    </div>

    <!-- 顶部操作按钮 -->
    <div class="top-actions">
      <button class="btn btn-outline-green">
        <span class="btn-icon">🔗</span>
        福建体彩网实时开奖接口
      </button>
      <button class="btn btn-outline">
        <span class="btn-icon">📥</span>
        导入数据
      </button>
      <button class="btn btn-outline">
        <span class="btn-icon">🔄</span>
        刷新开奖
      </button>
      <button class="btn btn-danger">
        <span class="btn-icon">⚙</span>
        重新计算模型
      </button>
    </div>

    <!-- 信息栏 -->
    <div class="info-bar card">
      <div class="info-bar-left">
        <span class="info-text">{{ totalPeriods }}期，最新期号 {{ latest.period }}，开奖日期 {{ latest.date }}</span>
      </div>
      <div class="info-bar-right">
        <label class="info-label">走势图周期</label>
        <select class="info-select" v-model="trendPeriod">
          <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- 最新开奖卡片 -->
    <div class="latest-draw card">
      <div class="card-header">
        <span class="card-title">最新开奖</span>
        <span class="draw-badge">第 {{ latest.period }} 期</span>
      </div>
      <div class="draw-content">
        <div class="draw-date">{{ latest.date }} 星期{{ latest.day }}</div>
        <div class="draw-balls">
          <div class="ball-section">
            <span class="section-label">前区</span>
            <span
              v-for="n in latest.frontNumbers"
              :key="'f' + n"
              class="ball ball-front"
            >{{ n }}</span>
          </div>
          <div class="ball-divider">+</div>
          <div class="ball-section">
            <span class="section-label">后区</span>
            <span
              v-for="n in latest.backNumbers"
              :key="'b' + n"
              class="ball ball-back"
            >{{ n }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 下期参考 -->
    <div class="next-ref card">
      <div class="card-title">下期参考区间</div>
      <div class="ref-items">
        <div class="ref-item">
          <span class="ref-label">和值</span>
          <span class="ref-value">{{ sumRangeVal.low }}-{{ sumRangeVal.high }}</span>
        </div>
        <div class="ref-item">
          <span class="ref-label">奇偶比</span>
          <span class="ref-value">{{ oddEvenAvg }}</span>
        </div>
        <div class="ref-item">
          <span class="ref-label">大小比</span>
          <span class="ref-value">{{ bigSmallAvg }}</span>
        </div>
        <div class="ref-item">
          <span class="ref-label">012路</span>
          <span class="ref-value">{{ road012Avg }}</span>
        </div>
        <div class="ref-item">
          <span class="ref-label">AC值</span>
          <span class="ref-value">{{ acAvg }}</span>
        </div>
      </div>
    </div>

    <!-- 4个统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">💰</div>
        <div class="stat-info">
          <div class="stat-label">奖池累计</div>
          <div class="stat-value">{{ poolAmount }}</div>
          <div class="stat-unit">亿元</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-red">🏆</div>
        <div class="stat-info">
          <div class="stat-label">一等奖奖金</div>
          <div class="stat-value">{{ firstPrizeAmount }}</div>
          <div class="stat-unit">万元</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">📊</div>
        <div class="stat-info">
          <div class="stat-label">历史期数</div>
          <div class="stat-value">{{ totalPeriods }}</div>
          <div class="stat-unit">期</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">🎯</div>
        <div class="stat-info">
          <div class="stat-label">模型置信度</div>
          <div class="stat-value">76</div>
          <div class="stat-unit">%</div>
        </div>
      </div>
    </div>

    <!-- 结构特征概览 -->
    <div class="section-title">结构特征概览</div>
    <div class="structure-cards">
      <div class="sub-card">
        <div class="sub-card-title">基础分布</div>
        <div class="sub-card-body">
          <div class="sub-item" v-for="item in basicDist" :key="item.label">
            <span class="sub-item-label">{{ item.label }}</span>
            <span class="sub-item-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div class="sub-card">
        <div class="sub-card-title">动态跨度</div>
        <div class="sub-card-body">
          <div class="sub-item" v-for="item in dynamicSpan" :key="item.label">
            <span class="sub-item-label">{{ item.label }}</span>
            <span class="sub-item-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div class="sub-card">
        <div class="sub-card-title">结构关系</div>
        <div class="sub-card-body">
          <div class="sub-item" v-for="item in structureRelation" :key="item.label">
            <span class="sub-item-label">{{ item.label }}</span>
            <span class="sub-item-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div class="sub-card">
        <div class="sub-card-title">冷热遗漏</div>
        <div class="sub-card-body">
          <div class="sub-item" v-for="item in hotColdOmission" :key="item.label">
            <span class="sub-item-label">{{ item.label }}</span>
            <span class="sub-item-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData, getLatestDraw, getTotalPeriods } from '@/data/lottery'
import {
  frontSum, span, acValue, oddEvenRatio, bigSmallRatio,
  primeCompositeRatio, road012Ratio, zoneRatio,
  consecutivePairs, repeatNumbers, diagonalNeighbors,
  calculateOmission, calculateFrequency, sumRange
} from '@/utils/lotto'

const latest = computed(() => getLatestDraw())
const totalPeriods = computed(() => getTotalPeriods())

const periodOptions = [
  { label: '近30期', value: 30 },
  { label: '近50期', value: 50 },
  { label: '近100期', value: 100 }
]
const trendPeriod = ref(100)

// 奖池
const poolAmount = computed(() => latest.value.pool ? (latest.value.pool / 100000000).toFixed(2) : '——')
const firstPrizeAmount = computed(() => latest.value.firstPrize ? (latest.value.firstPrize / 10000).toFixed(1) : '——')

// 和值区间
const sumRangeVal = computed(() => sumRange(lotteryData, trendPeriod.value))

// 计算近期平均比值
const oddEvenAvg = computed(() => {
  const recent = lotteryData.slice(0, trendPeriod.value)
  const odds = recent.map(d => d.frontNumbers.filter(n => n % 2 !== 0).length)
  const avgOdd = Math.round(odds.reduce((a, b) => a + b, 0) / odds.length)
  return `${avgOdd}:${5 - avgOdd}`
})

const bigSmallAvg = computed(() => {
  const recent = lotteryData.slice(0, trendPeriod.value)
  const bigs = recent.map(d => d.frontNumbers.filter(n => n > 18).length)
  const avgBig = Math.round(bigs.reduce((a, b) => a + b, 0) / bigs.length)
  return `${avgBig}:${5 - avgBig}`
})

const road012Avg = computed(() => {
  const recent = lotteryData.slice(0, trendPeriod.value)
  const r0s = recent.map(d => d.frontNumbers.filter(n => n % 3 === 0).length)
  const r1s = recent.map(d => d.frontNumbers.filter(n => n % 3 === 1).length)
  const r2s = recent.map(d => d.frontNumbers.filter(n => n % 3 === 2).length)
  const avg0 = Math.round(r0s.reduce((a, b) => a + b, 0) / r0s.length)
  const avg1 = Math.round(r1s.reduce((a, b) => a + b, 0) / r1s.length)
  const avg2 = 5 - avg0 - avg1
  return `${avg0}:${avg1}:${avg2}`
})

const acAvg = computed(() => {
  const recent = lotteryData.slice(0, trendPeriod.value)
  const acs = recent.map(d => acValue(d.frontNumbers))
  return Math.round(acs.reduce((a, b) => a + b, 0) / acs.length)
})

// 最近一期各项指标
const latestDraw = computed(() => lotteryData[0])
const prevDraw = computed(() => lotteryData[1] || null)

// 基础分布
const basicDist = computed(() => [
  { label: '质合比', value: primeCompositeRatio(latestDraw.value.frontNumbers) },
  { label: '大小比', value: bigSmallRatio(latestDraw.value.frontNumbers) },
  { label: '奇偶比', value: oddEvenRatio(latestDraw.value.frontNumbers) },
  { label: '012路比', value: road012Ratio(latestDraw.value.frontNumbers) }
])

// 动态跨度
const dynamicSpan = computed(() => [
  { label: '前区和值', value: frontSum(latestDraw.value.frontNumbers) },
  { label: '后区和值', value: frontSum(latestDraw.value.backNumbers) },
  { label: '前区跨度', value: span(latestDraw.value.frontNumbers) },
  { label: '前区AC值', value: acValue(latestDraw.value.frontNumbers) }
])

// 结构关系
const structureRelation = computed(() => {
  const repeat = prevDraw.value ? repeatNumbers(latestDraw.value.frontNumbers, prevDraw.value.frontNumbers) : 0
  const diagonal = prevDraw.value ? diagonalNeighbors(latestDraw.value.frontNumbers, prevDraw.value.frontNumbers) : 0
  return [
    { label: '三区比', value: zoneRatio(latestDraw.value.frontNumbers) },
    { label: '连号对', value: consecutivePairs(latestDraw.value.frontNumbers) },
    { label: '重号', value: repeat },
    { label: '斜连邻号', value: diagonal }
  ]
})

// 冷热遗漏 - 计算所有号码的遗漏
const hotColdOmission = computed(() => {
  const omissions = []
  for (let i = 1; i <= 35; i++) {
    omissions.push({ number: i, omission: calculateOmission(lotteryData, i, 'front') })
  }
  const sorted = [...omissions].sort((a, b) => a.omission - b.omission)
  const hot = sorted.slice(0, 5).map(o => o.number).sort((a, b) => a - b)
  const cold = sorted.filter(o => o.omission > 0).sort((a, b) => b.omission - a.omission).slice(0, 5).map(o => o.number).sort((a, b) => a - b)
  const maxOmission = Math.max(...omissions.map(o => o.omission))
  return [
    { label: '热码', value: hot.join(' ') },
    { label: '冷码', value: cold.join(' ') },
    { label: '最高遗漏', value: `${maxOmission}期` },
    { label: '和值主区间', value: `${sumRangeVal.value.low}-${sumRangeVal.value.high}` }
  ]
})
</script>

<style scoped>
.dashboard {
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

/* 顶部按钮 */
.top-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #333;
}

.btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.btn-icon {
  font-size: 14px;
}

.btn-outline-green {
  border-color: #52c41a;
  color: #52c41a;
}
.btn-outline-green:hover {
  background: #f6ffed;
  border-color: #73d13d;
  color: #52c41a;
}

.btn-danger {
  border-color: #ff4d4f;
  color: #ff4d4f;
}
.btn-danger:hover {
  background: #fff2f0;
  border-color: #ff7875;
  color: #ff4d4f;
}

/* 信息栏 */
.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.info-text {
  font-size: 14px;
  color: #555;
}

.info-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #888;
}

.info-select {
  padding: 5px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #333;
  cursor: pointer;
  outline: none;
}

/* 最新开奖 */
.latest-draw {
  background: linear-gradient(135deg, #fff, #fffbe6);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.draw-badge {
  display: inline-block;
  padding: 2px 10px;
  background: #ff4d4f;
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.draw-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draw-date {
  font-size: 14px;
  color: #888;
}

.draw-balls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ball-section {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.section-label {
  font-size: 12px;
  color: #999;
  margin-right: 4px;
}

.ball-divider {
  font-size: 22px;
  color: #bbb;
  font-weight: 300;
}

/* 下期参考 */
.next-ref {
  background: linear-gradient(135deg, #f0f5ff, #fff);
}

.ref-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.ref-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.ref-label {
  font-size: 12px;
  color: #888;
}

.ref-value {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-icon-orange { background: #fff7e6; }
.stat-icon-red { background: #fff2f0; }
.stat-icon-blue { background: #f0f5ff; }
.stat-icon-purple { background: #f9f0ff; }

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  display: inline;
}

.stat-unit {
  font-size: 13px;
  color: #888;
  margin-left: 4px;
  display: inline;
}

/* 结构特征小节标题 */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 3px solid #1890ff;
}

.structure-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.sub-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-top: 3px solid;
}

.sub-card:nth-child(1) { border-top-color: #52c41a; }
.sub-card:nth-child(2) { border-top-color: #1890ff; }
.sub-card:nth-child(3) { border-top-color: #faad14; }
.sub-card:nth-child(4) { border-top-color: #ff4d4f; }

.sub-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.sub-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-item-label {
  font-size: 13px;
  color: #888;
}

.sub-item-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .stat-cards,
  .structure-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .top-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .stat-cards,
  .structure-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }
  .info-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .info-bar-left {
    width: 100%;
  }
  .info-bar-right {
    width: 100%;
    justify-content: flex-start;
  }
  .card {
    padding: 16px;
  }
  .draw-balls {
    gap: 6px;
  }
  .ball {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }
  .ref-items {
    gap: 12px;
  }
  .card-header {
    flex-wrap: wrap;
  }
  .stat-card {
    padding: 14px;
  }
  .section-title {
    font-size: 15px;
  }
}
</style>
