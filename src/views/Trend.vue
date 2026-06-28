<template>
  <div class="trend-page">
    <div class="page-header">
      <h1 class="page-title">中奖号码走势分析可视化图</h1>
      <p class="page-subtitle">和值、跨度、AC、奇偶、连号、冷热和遗漏的图形化分析</p>
    </div>

    <!-- 和值与奖池走势 -->
    <div class="card chart-card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">和值与奖池走势</h3>
          <span class="card-badge">近50期</span>
        </div>
        <p class="card-desc">前区和值、10期均线和奖池累计</p>
      </div>
      <div ref="sumPoolChartRef" class="chart-container"></div>
    </div>

    <!-- 跨度/AC复杂度 -->
    <div class="card chart-card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">跨度 / AC复杂度</h3>
          <span class="card-badge">空间离散度</span>
        </div>
        <p class="card-desc">观察空间离散度和随机复杂度</p>
      </div>
      <div ref="spanAcChartRef" class="chart-container"></div>
    </div>

    <!-- 奇偶与连号走势 -->
    <div class="card chart-card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">奇偶与连号走势</h3>
          <span class="card-badge">基础形态</span>
        </div>
        <p class="card-desc">基础形态与结构关系</p>
      </div>
      <div ref="oddEvenChartRef" class="chart-container"></div>
    </div>

    <!-- 前区冷热遗漏 -->
    <div class="card chart-card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">前区冷热遗漏</h3>
          <span class="card-badge">近30期</span>
        </div>
        <p class="card-desc">近30期频次与当前遗漏并排比较</p>
      </div>
      <div ref="omissionChartRef" class="chart-container"></div>
    </div>

    <!-- 前区号码热力图 -->
    <div class="card chart-card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">前区号码热力图</h3>
          <span class="card-badge">35码</span>
        </div>
        <p class="card-desc">颜色越深表示近30期越热，角标为遗漏</p>
      </div>
      <div class="heatmap-grid heatmap-front">
        <div v-for="n in 35" :key="'f' + n" class="heatmap-cell" :style="getFrontHeatStyle(n)" :title="`号码${padNum(n)}: 出现${frontFreq[n]}次, 遗漏${frontOmit[n]}期`">
          <span class="heatmap-num">{{ padNum(n) }}</span>
          <span class="heatmap-freq">{{ frontFreq[n] }}</span>
          <span class="heatmap-omit">{{ frontOmit[n] }}</span>
        </div>
      </div>
    </div>

    <!-- 后区号码热力图 -->
    <div class="card chart-card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">后区号码热力图</h3>
          <span class="card-badge">12码</span>
        </div>
        <p class="card-desc">颜色越深表示近30期越热，角标为遗漏</p>
      </div>
      <div class="heatmap-grid heatmap-back">
        <div v-for="n in 12" :key="'b' + n" class="heatmap-cell" :style="getBackHeatStyle(n)" :title="`号码${padNum(n)}: 出现${backFreq[n]}次, 遗漏${backOmit[n]}期`">
          <span class="heatmap-num">{{ padNum(n) }}</span>
          <span class="heatmap-freq">{{ backFreq[n] }}</span>
          <span class="heatmap-omit">{{ backOmit[n] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { lotteryData } from '@/data/lottery'
import {
  frontSum, span, acValue, consecutivePairs,
  calculateOmission, calculateFrequency
} from '@/utils/lotto'

// === 计算数据 ===
const recent50 = computed(() => lotteryData.slice(0, 50))
const recent30 = computed(() => lotteryData.slice(0, 30))

// 前区频次和遗漏（1-35）
const frontFreq = computed(() => {
  const freq = Array(36).fill(0)
  for (let n = 1; n <= 35; n++) freq[n] = calculateFrequency(lotteryData, n, 30, 'front')
  return freq
})
const frontOmit = computed(() => {
  const omit = Array(36).fill(0)
  for (let n = 1; n <= 35; n++) omit[n] = calculateOmission(lotteryData, n, 'front')
  return omit
})

// 后区频次和遗漏（1-12）
const backFreq = computed(() => {
  const freq = Array(13).fill(0)
  for (let n = 1; n <= 12; n++) freq[n] = calculateFrequency(lotteryData, n, 30, 'back')
  return freq
})
const backOmit = computed(() => {
  const omit = Array(13).fill(0)
  for (let n = 1; n <= 12; n++) omit[n] = calculateOmission(lotteryData, n, 'back')
  return omit
})

const frontMaxFreq = computed(() => Math.max(...frontFreq.value.slice(1), 1))

// 图表 refs
const sumPoolChartRef = ref(null)
const spanAcChartRef = ref(null)
const oddEvenChartRef = ref(null)
const omissionChartRef = ref(null)

let sumPoolChart = null
let spanAcChart = null
let oddEvenChart = null
let omissionChart = null

// 10期移动均线
function movingAvg(arr, period) {
  return arr.map((_, i) => {
    if (i + period > arr.length) return null
    const slice = arr.slice(i, i + period)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

function padNum(n) { return String(n).padStart(2, '0') }

// === 图表1: 和值与奖池走势 ===
function initSumPoolChart() {
  if (!sumPoolChartRef.value) return
  const data = recent50.value
  const periods = data.map(d => d.period).reverse()
  const sums = data.map(d => frontSum(d.frontNumbers)).reverse()
  const pools = data.map(d => d.pool).reverse()
  const ma10 = movingAvg(sums, 10).reverse()

  sumPoolChart = echarts.init(sumPoolChartRef.value)
  sumPoolChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['前区和值', '10期均线', '奖池累计(亿元)'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: { left: 60, right: 60, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { rotate: 45, fontSize: 11, interval: 4 }
    },
    yAxis: [
      {
        type: 'value',
        name: '和值',
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: '奖池(亿)',
        splitLine: { show: false },
        axisLabel: {
          formatter: v => (v / 1e8).toFixed(1)
        }
      }
    ],
    series: [
      {
        name: '前区和值',
        type: 'line',
        data: sums,
        smooth: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#5470c6' },
        itemStyle: { color: '#5470c6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84,112,198,0.2)' },
            { offset: 1, color: 'rgba(84,112,198,0.02)' }
          ])
        }
      },
      {
        name: '10期均线',
        type: 'line',
        data: ma10,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#fac858' }
      },
      {
        name: '奖池累计(亿元)',
        type: 'line',
        yAxisIndex: 1,
        data: pools,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#91cc75' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(145,204,117,0.2)' },
            { offset: 1, color: 'rgba(145,204,117,0.02)' }
          ])
        }
      }
    ]
  })
}

// === 图表2: 跨度/AC复杂度 ===
function initSpanAcChart() {
  if (!spanAcChartRef.value) return
  const data = recent50.value
  const periods = data.map(d => d.period).reverse()
  const spans = data.map(d => span(d.frontNumbers)).reverse()
  const acs = data.map(d => acValue(d.frontNumbers)).reverse()

  spanAcChart = echarts.init(spanAcChartRef.value)
  spanAcChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['跨度', 'AC值'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: { left: 60, right: 45, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { rotate: 45, fontSize: 11, interval: 4 }
    },
    yAxis: [
      {
        type: 'value',
        name: '跨度',
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: 'AC值',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '跨度',
        type: 'bar',
        data: spans,
        barWidth: 10,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#5470c6' },
            { offset: 1, color: '#91cc75' }
          ]),
          borderRadius: [3, 3, 0, 0]
        }
      },
      {
        name: 'AC值',
        type: 'line',
        yAxisIndex: 1,
        data: acs,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#fac858' },
        itemStyle: { color: '#fac858' }
      }
    ]
  })
}

// === 图表3: 奇偶与连号走势 ===
function initOddEvenChart() {
  if (!oddEvenChartRef.value) return
  const data = recent50.value
  const periods = data.map(d => d.period).reverse()
  const odds = data.map(d => d.frontNumbers.filter(n => n % 2 === 1).length).reverse()
  const evens = data.map(d => d.frontNumbers.filter(n => n % 2 === 0).length).reverse()
  const consec = data.map(d => consecutivePairs(d.frontNumbers)).reverse()

  oddEvenChart = echarts.init(oddEvenChartRef.value)
  oddEvenChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['奇数', '偶数', '连号对数'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: { left: 60, right: 70, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { rotate: 45, fontSize: 11, interval: 4 }
    },
    yAxis: [
      {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: '连号',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '奇数',
        type: 'bar',
        stack: 'oddEven',
        data: odds,
        barWidth: 14,
        itemStyle: { color: '#5470c6' },
        label: { show: true, position: 'inside', fontSize: 11, color: '#fff', formatter: p => `${p.value}奇` }
      },
      {
        name: '偶数',
        type: 'bar',
        stack: 'oddEven',
        data: evens,
        barWidth: 14,
        itemStyle: { color: '#91cc75', borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'inside', fontSize: 11, color: '#fff', formatter: p => `${p.value}偶` }
      },
      {
        name: '连号对数',
        type: 'line',
        yAxisIndex: 1,
        data: consec,
        smooth: true,
        symbol: 'triangle',
        symbolSize: 8,
        lineStyle: { width: 2.5, color: '#fac858' },
        itemStyle: { color: '#fac858' },
        label: { show: true, fontSize: 11, color: '#fac858', formatter: p => `${p.value}对` }
      }
    ]
  })
}

// === 图表4: 前区冷热遗漏 ===
function initOmissionChart() {
  if (!omissionChartRef.value) return
  const nums = Array.from({ length: 35 }, (_, i) => padNum(i + 1))
  const freqs = frontFreq.value.slice(1)
  const omits = frontOmit.value.slice(1)

  omissionChart = echarts.init(omissionChartRef.value)
  omissionChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['出现频次(近30期)', '遗漏期数'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: { left: 60, right: 45, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: nums,
      axisLabel: { fontSize: 11, interval: 2 }
    },
    yAxis: [
      {
        type: 'value',
        name: '频次',
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: '遗漏',
        inverse: true,
        splitLine: { show: false },
        axisLabel: { color: '#999' }
      }
    ],
    series: [
      {
        name: '出现频次(近30期)',
        type: 'bar',
        data: freqs,
        barWidth: 6,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#5470c6' },
            { offset: 1, color: '#91cc75' }
          ]),
          borderRadius: [2, 2, 0, 0]
        }
      },
      {
        name: '遗漏期数',
        type: 'bar',
        yAxisIndex: 1,
        data: omits,
        barWidth: 6,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#e8e8e8' },
            { offset: 1, color: '#f5f5f5' }
          ]),
          borderRadius: [2, 2, 0, 0]
        }
      }
    ]
  })
}

// 热力图颜色
function getHeatStyle(freqArr, n) {
  const freq = freqArr[n]
  const allFreq = freqArr.slice(1)
  const maxF = Math.max(...allFreq, 1)
  const minF = Math.min(...allFreq, 0)
  const range = maxF - minF || 1
  const ratio = (freq - minF) / range

  let bgColor
  if (freq === 0) {
    bgColor = '#e8f4ff'
  } else if (ratio < 0.3) {
    bgColor = `rgba(255, 100, 100, ${0.2 + ratio * 0.4})`
  } else if (ratio < 0.5) {
    bgColor = `rgba(255, 50, 50, ${0.35 + ratio * 0.3})`
  } else if (ratio < 0.7) {
    bgColor = `rgba(220, 20, 20, ${0.55 + ratio * 0.2})`
  } else {
    bgColor = `rgba(180, 0, 0, ${0.7 + ratio * 0.25})`
  }
  return {
    backgroundColor: bgColor,
    border: '1px solid ' + (freq === 0 ? '#cce5ff' : 'rgba(200,0,0,0.2)')
  }
}

function getFrontHeatStyle(n) { return getHeatStyle(frontFreq.value, n) }
function getBackHeatStyle(n) { return getHeatStyle(backFreq.value, n) }

// === 窗口自适应 ===
const charts = []
function resizeAll() { charts.forEach(c => c?.resize()) }

onMounted(() => {
  nextTick(() => {
    initSumPoolChart()
    initSpanAcChart()
    initOddEvenChart()
    initOmissionChart()

    if (sumPoolChart) charts.push(sumPoolChart)
    if (spanAcChart) charts.push(spanAcChart)
    if (oddEvenChart) charts.push(oddEvenChart)
    if (omissionChart) charts.push(omissionChart)

    window.addEventListener('resize', resizeAll)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeAll)
  charts.forEach(c => c?.dispose())
})
</script>

<style scoped>
.trend-page { max-width: 1100px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #333; margin: 0 0 6px 0; }
.page-subtitle { font-size: 14px; color: #888; margin: 0; }

.card {
  background: #fff; border-radius: 10px; padding: 20px;
  margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: box-shadow 0.3s;
}
.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.card-header { margin-bottom: 16px; }
.card-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.card-title { font-size: 16px; font-weight: 600; color: #333; margin: 0; }
.card-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #f0f5ff; color: #1890ff; font-weight: 500; }
.card-desc { font-size: 13px; color: #999; margin: 0; }

.chart-container { width: 100%; height: 360px; }

/* 热力图 */
.heatmap-grid { display: grid; gap: 4px; }
.heatmap-front { grid-template-columns: repeat(7, 1fr); }
.heatmap-back { grid-template-columns: repeat(6, 1fr); }
.heatmap-cell {
  position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 6px 2px; border-radius: 6px; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s; min-height: 58px;
}
.heatmap-cell:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.18); z-index: 2; }
.heatmap-num { font-size: 15px; font-weight: 700; color: #333; }
.heatmap-freq { font-size: 12px; font-weight: 600; color: #666; margin-top: 2px; }
.heatmap-omit { position: absolute; top: 2px; right: 4px; font-size: 10px; color: #999; font-weight: 500; }

@media (max-width: 768px) {
  .heatmap-front { grid-template-columns: repeat(5, 1fr); }
  .heatmap-back { grid-template-columns: repeat(6, 1fr); }
  .chart-container { height: 280px; }
}
</style>
