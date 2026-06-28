<template>
  <div class="prediction-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">预测号码</h1>
        <p class="page-subtitle">模型生成于 2026/6/28 22:06:23</p>
      </div>
      <button class="help-btn" title="帮助说明">?</button>
    </div>

    <!-- 置信度提示 -->
    <div class="alert-box alert-warning">
      <div class="alert-icon">⚠️</div>
      <div class="alert-content">
        <strong>模型置信度 76%</strong>
        <p>风险等级：中等偏上。结果只代表统计筛选，不保证中奖。</p>
      </div>
    </div>

    <!-- 预测方案卡片 -->
    <div class="strategy-card" v-for="(strategy, idx) in strategies" :key="strategy.name">
      <div class="strategy-head">
        <div class="strategy-badge">{{ idx + 1 }}</div>
        <div class="strategy-info">
          <h3 class="strategy-name">{{ strategy.name }}</h3>
          <span class="strategy-desc">{{ strategy.desc }}</span>
        </div>
        <div class="strategy-confidence">
          <span class="confidence-value">76%</span>
          <span class="confidence-label">置信度</span>
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
      </div>

      <!-- 星级评分 -->
      <div class="rating-row">
        <span
          v-for="i in 5"
          :key="i"
          class="star"
          :class="{ active: i <= strategy.stars }"
        >★</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { lotteryData } from '@/data/lottery'
import {
  frontSum, span, oddEvenRatio, zoneRatio
} from '@/utils/lotto'
import { generatePrediction } from '@/utils/v26'

// V26模型预测
const prediction = computed(() => generatePrediction(lotteryData))

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

// 星级评分（基于V26得分）
function calculateStars(numbers, scores, zone) {
  let totalScore = 0
  for (const n of numbers) {
    const s = scores.find(x => x.number === n)
    if (s) totalScore += s.score
  }
  const avgScore = totalScore / numbers.length
  // 根据平均得分给星级
  if (avgScore > 30) return 5
  if (avgScore > 20) return 4
  if (avgScore > 10) return 3
  return 2
}

// 生成所有策略
const strategies = computed(() => {
  const pred = prediction.value
  return [
    {
      name: '智能推荐',
      desc: 'V26 5D特征综合评分（重号/隔期/邻号/转移/状态匹配）',
      frontNumbers: pred.smart.front,
      backNumbers: pred.smart.back,
      stats: computeStats(pred.smart.front, pred.smart.back),
      stars: calculateStars(pred.smart.front, pred.frontScores, 'front')
    },
    {
      name: '热号优先',
      desc: '近5期高频追踪 + 8特征后区模型',
      frontNumbers: pred.hot.front,
      backNumbers: pred.hot.back,
      stats: computeStats(pred.hot.front, pred.hot.back),
      stars: calculateStars(pred.hot.front, pred.frontScores, 'front')
    },
    {
      name: '冷号修复',
      desc: '长遗漏回补 + 邻号±3特征',
      frontNumbers: pred.cold.front,
      backNumbers: pred.cold.back,
      stats: computeStats(pred.cold.front, pred.cold.back),
      stars: calculateStars(pred.cold.front, pred.frontScores, 'front')
    }
  ]
})
</script>

<style scoped>
.prediction-page {
  max-width: 800px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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
  font-size: 13px;
  color: #999;
  margin: 0;
}

.help-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  background: #fff;
  color: #999;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.help-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f0f7ff;
}

/* 警告提示框 */
.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.alert-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  font-size: 15px;
  color: #d48806;
  margin-bottom: 4px;
}

.alert-content p {
  font-size: 13px;
  color: #ad8b3a;
  margin: 0;
  line-height: 1.5;
}

/* 策略卡片 */
.strategy-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.3s;
}

.strategy-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 策略头部 */
.strategy-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.strategy-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890ff;
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
  font-size: 12px;
  color: #999;
}

.strategy-confidence {
  text-align: right;
  flex-shrink: 0;
}

.confidence-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #52c41a;
  line-height: 1.1;
}

.confidence-label {
  display: block;
  font-size: 11px;
  color: #bbb;
}

/* 号码行 */
.balls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 16px;
}

.balls-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balls-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  flex-shrink: 0;
}

.balls-group {
  display: flex;
  gap: 6px;
}

.balls-divider {
  color: #d9d9d9;
  font-size: 20px;
  font-weight: 600;
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.ball-front {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  box-shadow: 0 2px 4px rgba(207, 19, 34, 0.3);
}

.ball-back {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 2px 4px rgba(9, 109, 217, 0.3);
}

/* 统计行 */
.stats-row {
  display: flex;
  gap: 0;
  margin-bottom: 14px;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 10px 4px;
  border-right: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 星级评分 */
.rating-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.star {
  font-size: 20px;
  color: #e8e8e8;
  transition: color 0.3s;
}

.star.active {
  color: #fadb14;
  text-shadow: 0 0 4px rgba(250, 219, 20, 0.4);
}

/* 响应式 */
@media (max-width: 768px) {
  .prediction-page {
    padding: 0 4px;
  }

  .balls-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .balls-divider {
    align-self: center;
  }

  .stat-item {
    padding: 8px 2px;
  }

  .stat-value {
    font-size: 13px;
  }
}
</style>
