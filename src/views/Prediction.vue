<template>
  <div class="prediction-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">预测号码</h1>
        <p class="page-subtitle">基于 V26 5D特征 + 后区8特征模型 · {{ modelTimestamp }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-regenerate" @click="regenerate">
          <span>🎲</span> 重新生成
        </button>
      </div>
    </div>

    <!-- 预测期号 -->
    <div class="prediction-period-tag">
      <span class="period-badge">🎯 预测 {{ nextPeriod }}期</span>
      <span class="period-badge ref-badge">📌 上期 {{ latestDraw?.period }}期</span>
    </div>

    <!-- 置信度提示 -->
    <div class="alert-box" :class="confidenceLevel">
      <div class="alert-icon">{{ confidenceIcon }}</div>
      <div class="alert-content">
        <strong>综合置信度 {{ overallConfidence }}%</strong>
        <p>{{ confidenceTip }}</p>
      </div>
      <div class="alert-score">
        <div class="score-ring">
          <svg viewBox="0 0 36 36" class="ring-svg">
            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="ring-fill" :stroke-dasharray="`${overallConfidence}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="ring-text">{{ overallConfidence }}%</span>
        </div>
      </div>
    </div>

    <!-- 最新开奖参考 -->
    <div class="card reference-card" v-if="latestDraw">
      <div class="card-title">上期开奖参考 · {{ latestDraw.period }}期 开奖号码</div>
      <div class="ref-numbers">
        <span v-for="n in latestDraw.frontNumbers" :key="'rf'+n" class="ball ball-front ball-sm">{{ padNum(n) }}</span>
        <span class="ref-divider">+</span>
        <span v-for="n in latestDraw.backNumbers" :key="'rb'+n" class="ball ball-back ball-sm">{{ padNum(n) }}</span>
      </div>
    </div>

    <!-- 预测方案 -->
    <div class="strategy-card" v-for="(strategy, idx) in strategies" :key="strategy.name">
      <div class="strategy-head">
        <div class="strategy-badge" :style="{ background: badgeColors[idx] }">{{ idx + 1 }}</div>
        <div class="strategy-info">
          <h3 class="strategy-name">{{ strategy.name }}</h3>
          <span class="strategy-desc">{{ strategy.desc }}</span>
        </div>
        <div class="strategy-confidence" :class="strategy.confidenceClass">
          <span class="confidence-dot"></span>
          <span class="confidence-value">{{ strategy.confidence }}%</span>
        </div>
      </div>

      <!-- 号码球 -->
      <div class="balls-row">
        <div class="balls-section">
          <span class="balls-label">前区</span>
          <div class="balls-group">
            <span
              v-for="n in strategy.frontNumbers"
              :key="'f' + n"
              class="ball ball-front"
              :title="getScoreTitle(n, strategy)"
            >{{ padNum(n) }}</span>
          </div>
        </div>
        <div class="balls-divider">+</div>
        <div class="balls-section">
          <span class="balls-label">后区</span>
          <div class="balls-group">
            <span
              v-for="n in strategy.backNumbers"
              :key="'b' + n"
              class="ball ball-back"
              :title="getBackScoreTitle(n, strategy)"
            >{{ padNum(n) }}</span>
          </div>
        </div>
      </div>

      <!-- 统计指标 -->
      <div class="stats-row">
        <div class="stat-item" v-for="stat in strategy.stats" :key="stat.label">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value }}</span>
        </div>
        <div class="stat-item score-item">
          <span class="stat-label">V26评分</span>
          <span class="stat-value score-value">{{ strategy.totalScore }}</span>
        </div>
      </div>

      <!-- 评分条 -->
      <div class="score-bar">
        <div class="score-bar-label">综合评价</div>
        <div class="score-bar-track">
          <div
            class="score-bar-fill"
            :style="{ width: strategy.scorePercent + '%', background: scoreColors[idx] }"
          ></div>
        </div>
        <div class="score-bar-num">{{ strategy.scorePercent }}/100</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData, getLatestDraw } from '@/data/lottery'
import {
  frontSum, span, oddEvenRatio, zoneRatio
} from '@/utils/lotto'
import { generatePrediction } from '@/utils/v26'

const latestDraw = getLatestDraw()

// 预测期号 = 最新一期 + 1
const nextPeriod = computed(() => latestDraw ? latestDraw.period + 1 : '——')

// V26模型预测
const prediction = computed(() => generatePrediction(lotteryData))

// 模型生成时间
const now = new Date()
const modelTimestamp = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

// 号码格式化
function padNum(n) {
  return String(n).padStart(2, '0')
}

// 生成统计指标
function computeStats(frontNums, backNums) {
  return [
    { label: '和值', value: frontSum(frontNums) },
    { label: '跨度', value: span(frontNums) },
    { label: '奇偶', value: oddEvenRatio(frontNums) },
    { label: '分区', value: zoneRatio(frontNums) }
  ]
}

// 计算号码评分说明
// 计算一个评分在全部号码中的百分位排名
function calcPercentile(score, allScores) {
  if (!allScores || allScores.length === 0) return 50
  const sorted = [...allScores].sort((a, b) => a - b)
  const rank = sorted.filter(x => x <= score).length
  return Math.round((rank / sorted.length) * 100)
}

function getScoreTitle(num, strategy) {
  if (!strategy.scoreMap) return ''
  const s = strategy.scoreMap[num]
  const pct = calcPercentile(s, strategy.frontScores?.map(x => x.score) || [])
  return s ? `V26评分: ${s} · 高于${pct}%的号码` : ''
}

function getBackScoreTitle(num, strategy) {
  if (!strategy.backScoreMap) return ''
  const s = strategy.backScoreMap[num]
  const pct = calcPercentile(s, strategy.backScores?.map(x => x.score) || [])
  return s ? `后区评分: ${s} · 高于${pct}%的号码` : ''
}

const badgeColors = ['#1890ff', '#52c41a', '#fa8c16']
const scoreColors = ['#1890ff', '#52c41a', '#fa8c16']

// 置信度 = 所有选中号码的平均百分位排名
// 百分位越高说明V26特征越强，参考价值越大
function calcConfidence(frontNums, backNums, frontScores, backScores) {
  let totalPct = 0
  let count = 0
  
  const allFront = frontScores.map(s => s.score)
  const allBack = backScores.map(s => s.score)
  
  for (const n of frontNums) {
    const s = frontScores.find(x => x.number === n)
    if (s) {
      totalPct += calcPercentile(s.score, allFront)
      count++
    }
  }
  for (const n of backNums) {
    const s = backScores.find(x => x.number === n)
    if (s) {
      totalPct += calcPercentile(s.score, allBack)
      count++
    }
  }
  
  if (count === 0) return 50
  const avg = Math.round(totalPct / count)
  return Math.min(95, Math.max(50, avg))
}

// 星级评分（基于百分位）
function calcStars(frontNums, frontScores) {
  if (!frontScores || frontScores.length === 0) return 0
  const allFront = frontScores.map(s => s.score)
  let totalPct = 0
  for (const n of frontNums) {
    const s = frontScores.find(x => x.number === n)
    if (s) totalPct += calcPercentile(s.score, allFront)
  }
  const avg = totalPct / frontNums.length
  if (avg >= 85) return 5
  if (avg >= 70) return 4
  if (avg >= 55) return 3
  if (avg >= 40) return 2
  return 1
}

// 生成所有策略
const strategies = computed(() => {
  const pred = prediction.value
  const frontScores = pred.frontScores || []
  const backScores = pred.backScores || []

  // 构建号码评分映射
  function buildScoreMap(nums, scores) {
    const map = {}
    for (const n of nums) {
      const s = scores.find(x => x.number === n)
      map[n] = s ? s.score : 0
    }
    return map
  }

  const s1Front = pred.smart.front
  const s1Back = pred.smart.back
  const s2Front = pred.hot.front
  const s2Back = pred.hot.back
  const s3Front = pred.cold.front
  const s3Back = pred.cold.back

  const c1 = calcConfidence(s1Front, s1Back, frontScores, backScores)
  const c2 = calcConfidence(s2Front, s2Back, frontScores, backScores)
  const c3 = calcConfidence(s3Front, s3Back, frontScores, backScores)

  // 总评分
  function totalScore(nums, scores) {
    let t = 0
    for (const n of nums) {
      const s = scores.find(x => x.number === n)
      if (s) t += s.score
    }
    return t
  }

  const t1 = totalScore(s1Front, frontScores)
  const t2 = totalScore(s2Front, frontScores)
  const t3 = totalScore(s3Front, frontScores)
  const maxT = Math.max(t1, t2, t3, 1)

  return [
    {
      name: '智能推荐',
      desc: 'V26 5D特征综合评分（重号/隔期/邻号/转移/状态匹配）',
      frontNumbers: s1Front,
      backNumbers: s1Back,
      stats: computeStats(s1Front, s1Back),
      stars: calcStars(s1Front, frontScores),
      confidence: c1,
      confidenceClass: c1 >= 75 ? 'high' : c1 >= 60 ? 'mid' : 'low',
      totalScore: t1,
      scorePercent: Math.round(t1 / maxT * 100),
      scoreMap: buildScoreMap(s1Front, frontScores),
      backScoreMap: buildScoreMap(s1Back, backScores),
    },
    {
      name: '热号优先',
      desc: '近5期高频追踪 + 8特征后区模型',
      frontNumbers: s2Front,
      backNumbers: s2Back,
      stats: computeStats(s2Front, s2Back),
      stars: calcStars(s2Front, frontScores),
      confidence: c2,
      confidenceClass: c2 >= 75 ? 'high' : c2 >= 60 ? 'mid' : 'low',
      totalScore: t2,
      scorePercent: Math.round(t2 / maxT * 100),
      scoreMap: buildScoreMap(s2Front, frontScores),
      backScoreMap: buildScoreMap(s2Back, backScores),
    },
    {
      name: '冷号修复',
      desc: '长遗漏回补 + 邻号±3特征',
      frontNumbers: s3Front,
      backNumbers: s3Back,
      stats: computeStats(s3Front, s3Back),
      stars: calcStars(s3Front, frontScores),
      confidence: c3,
      confidenceClass: c3 >= 75 ? 'high' : c3 >= 60 ? 'mid' : 'low',
      totalScore: t3,
      scorePercent: Math.round(t3 / maxT * 100),
      scoreMap: buildScoreMap(s3Front, frontScores),
      backScoreMap: buildScoreMap(s3Back, backScores),
    }
  ]
})

// 综合置信度（取平均）
const overallConfidence = computed(() => {
  if (!strategies.value.length) return 76
  const sum = strategies.value.reduce((s, st) => s + st.confidence, 0)
  return Math.round(sum / strategies.value.length)
})

const confidenceLevel = computed(() => {
  const v = overallConfidence.value
  if (v >= 80) return 'alert-success'
  if (v >= 60) return 'alert-warning'
  return 'alert-error'
})

const confidenceIcon = computed(() => {
  const v = overallConfidence.value
  if (v >= 80) return '✅'
  if (v >= 60) return '⚠️'
  return '🚫'
})

const confidenceTip = computed(() => {
  const v = overallConfidence.value
  if (v >= 80) return `所选号码的V26特征评分处于前${v}%水平，模型匹配度较高`
  if (v >= 60) return `所选号码的V26评分高于${v}%的号码，结果仅供参考`
  return `所选号码评分仅高于${v}%的号码，特征偏弱，建议参考走势图表`
})

// 重新生成
function regenerate() {
  location.reload()
}
</script>

<style scoped>
.prediction-page {
  max-width: 900px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 12px;
  color: #999;
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
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f0f7ff;
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
}

/* 参考卡片 */
.reference-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ref-numbers {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ball-sm {
  width: 30px;
  height: 30px;
  font-size: 11px;
}

.ref-divider {
  color: #d9d9d9;
  font-size: 14px;
  font-weight: 600;
  margin: 0 4px;
}

/* 置信度提示 */
.alert-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.alert-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.alert-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.alert-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

/* 预测期号标签 */
.prediction-period-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.period-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.period-badge.ref-badge {
  background: #f5f5f5;
  color: #888;
  border: 1px solid #e8e8e8;
  font-weight: 400;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.alert-warning .alert-content strong { color: #d48806; }
.alert-success .alert-content strong { color: #52c41a; }
.alert-error .alert-content strong { color: #ff4d4f; }

.alert-content p {
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

.alert-warning .alert-content p { color: #ad8b3a; }
.alert-success .alert-content p { color: #73d13d; }
.alert-error .alert-content p { color: #ff7875; }

/* SVG 环形分数 */
.alert-score {
  flex-shrink: 0;
}

.score-ring {
  position: relative;
  width: 48px;
  height: 48px;
}

.ring-svg {
  width: 48px;
  height: 48px;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #f0f0f0;
  stroke-width: 3;
}

.ring-fill {
  fill: none;
  stroke: #1890ff;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s ease;
}

.alert-success .ring-fill { stroke: #52c41a; }
.alert-warning .ring-fill { stroke: #faad14; }
.alert-error .ring-fill { stroke: #ff4d4f; }

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 700;
  color: #333;
}

/* 策略卡片 */
.strategy-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.3s, transform 0.2s;
}

.strategy-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.strategy-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.strategy-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.strategy-info {
  flex: 1;
}

.strategy-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 2px 0;
}

.strategy-desc {
  font-size: 11px;
  color: #bbb;
}

.strategy-confidence {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.strategy-confidence.high {
  background: #f6ffed;
  color: #52c41a;
}

.strategy-confidence.mid {
  background: #fffbe6;
  color: #d48806;
}

.strategy-confidence.low {
  background: #fff2f0;
  color: #ff4d4f;
}

.confidence-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.confidence-value {
  font-size: 14px;
}

/* 号码行 */
.balls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 14px;
}

.balls-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balls-label {
  font-size: 11px;
  color: #bbb;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 24px;
}

.balls-group {
  display: flex;
  gap: 6px;
}

.balls-divider {
  color: #d9d9d9;
  font-size: 18px;
  font-weight: 600;
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: help;
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  box-shadow: 0 2px 4px rgba(207, 19, 34, 0.25);
}

.ball-back {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 2px 4px rgba(9, 109, 217, 0.25);
}

/* 统计行 */
.stats-row {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-right: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: #aaa;
  margin-bottom: 2px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.score-value {
  color: #1890ff;
}

/* 评分条 */
.score-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-bar-label {
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
  flex-shrink: 0;
}

.score-bar-track {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.score-bar-num {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .prediction-page {
    padding: 0 4px;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .btn {
    flex: 1;
    justify-content: center;
  }

  .balls-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .balls-divider {
    align-self: center;
  }

  .reference-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-item {
    padding: 6px 2px;
  }

  .stat-value {
    font-size: 12px;
  }

  .ball {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .prediction-page {
    padding: 0 2px;
  }
  .card {
    padding: 14px;
  }
  .page-header {
    flex-direction: column;
  }
  .header-actions {
    width: 100%;
  }
  .btn {
    flex: 1;
    justify-content: center;
  }
  .strategy-card {
    padding: 14px;
  }
  .strategy-badge {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }
  .strategy-name {
    font-size: 15px;
  }
  .balls-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .ball {
    width: 26px;
    height: 26px;
    font-size: 10px;
  }
  .balls-divider {
    align-self: center;
  }
  .stats-row {
    flex-wrap: wrap;
    gap: 4px;
  }
  .stat-item {
    flex: 1 1 45%;
    padding: 6px 4px;
  }
  .stat-value {
    font-size: 11px;
  }
  .score-bar {
    flex-wrap: wrap;
  }
  .alert-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
