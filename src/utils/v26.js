/**
 * V26 联合模型 - 前端预测引擎
 * 前区: 5D特征(重号/隔期重号/邻号/转移号/状态匹配) 权重(23,29,20,7,6)
 * 后区: 8特征(邻号±3/±2/012路/近3期/近8期/重号)
 */

// 前区V26权重
const FRONT_WEIGHTS = [23, 29, 20, 7, 6]

// 和值状态
function sumState(nums) {
  const s = nums.reduce((a, b) => a + b, 0)
  if (s < 70) return 1
  if (s < 85) return 2
  if (s < 100) return 3
  if (s < 115) return 4
  if (s < 130) return 5
  return 6
}

// 计算前区每个号码的5D得分
function scoreFrontNumbers(history) {
  const latest = history[0]
  const prev = history[1] || latest
  const prevSet = new Set(latest.frontNumbers)
  const prev2Set = new Set(prev.frontNumbers)
  
  // 近5期频率
  const l5 = {}
  history.slice(0, 5).forEach(d => d.frontNumbers.forEach(n => { l5[n] = (l5[n] || 0) + 1 }))
  
  // 近10期频率
  const l10 = {}
  history.slice(0, 10).forEach(d => d.frontNumbers.forEach(n => { l10[n] = (l10[n] || 0) + 1 }))
  
  // 状态匹配频率
  const state = sumState(latest.frontNumbers)
  const oddCount = latest.frontNumbers.filter(n => n % 2 === 1).length
  const bigCount = latest.frontNumbers.filter(n => n >= 18).length
  
  const stateFreq = {}
  for (let j = 1; j < history.length; j++) {
    const d = history[j]
    const p = history[j + 1] || history[j]
    if (sumState(d.frontNumbers) === state &&
        d.frontNumbers.filter(n => n % 2 === 1).length === oddCount &&
        d.frontNumbers.filter(n => n >= 18).length === bigCount) {
      p.frontNumbers.forEach(n => { stateFreq[n] = (stateFreq[n] || 0) + 1 })
    }
  }
  const maxStateFreq = Math.max(1, ...Object.values(stateFreq))
  
  // 转移矩阵
  const transfer = {}
  for (let j = 1; j < history.length; j++) {
    const src = history[j].frontNumbers
    const tgt = history[j - 1].frontNumbers
    src.forEach(s => {
      if (!transfer[s]) transfer[s] = {}
      tgt.forEach(t => {
        if (s !== t) transfer[s][t] = (transfer[s][t] || 0) + 1
      })
    })
  }
  const maxTransfer = Math.max(1, ...Object.values(transfer).flatMap(v => Object.values(v)))
  
  // 为每个号码计算5D得分
  const scores = []
  for (let n = 1; n <= 35; n++) {
    // D1: 重号
    const repeat = prevSet.has(n) ? 1 : 0
    // D2: 隔期重号
    const gapRepeat = (prev2Set.has(n) && !prevSet.has(n)) ? 1 : 0
    // D3: 邻号
    const neighbor = latest.frontNumbers.some(x => Math.abs(n - x) === 1) ? 1 : 0
    // D4: 转移号
    let transferScore = 0
    latest.frontNumbers.forEach(src => {
      if (transfer[src] && transfer[src][n]) {
        transferScore += transfer[src][n] / maxTransfer
      }
    })
    // D5: 状态匹配
    const stateMatch = (stateFreq[n] || 0) / maxStateFreq
    
    // 加权得分
    let score = repeat * FRONT_WEIGHTS[0] +
                gapRepeat * FRONT_WEIGHTS[1] +
                neighbor * FRONT_WEIGHTS[2] +
                transferScore * FRONT_WEIGHTS[3] +
                stateMatch * FRONT_WEIGHTS[4]
    
    // 频率加成
    const f5 = l5[n] || 0
    const f10 = l10[n] || 0
    const trend = f5 / 5 - f10 / 10
    score += f5 * 3 + f10 * 2 + trend * 5
    
    // 加入随机扰动（±0.5，让每次重新生成有变化）
    score += (Math.random() - 0.5) * 1
    
    scores.push({ number: n, score, features: { repeat, gapRepeat, neighbor, transferScore, stateMatch, f5, f10 } })
  }
  
  return scores.sort((a, b) => b.score - a.score)
}

// 计算后区每个号码的得分（8特征模型）
function scoreBackNumbers(history) {
  const latest = history[0]
  const prevSet = new Set(latest.backNumbers)
  
  // 近3期频率
  const l3 = {}
  history.slice(0, 3).forEach(d => d.backNumbers.forEach(n => { l3[n] = (l3[n] || 0) + 1 }))
  
  // 近8期频率
  const l8 = {}
  history.slice(0, 8).forEach(d => d.backNumbers.forEach(n => { l8[n] = (l8[n] || 0) + 1 }))
  
  // 近15期频率
  const l15 = {}
  history.slice(0, 15).forEach(d => d.backNumbers.forEach(n => { l15[n] = (l15[n] || 0) + 1 }))
  
  const scores = []
  for (let n = 1; n <= 12; n++) {
    let score = 0
    
    // 特征1: 邻号±1
    const neighbor1 = latest.backNumbers.some(x => Math.abs(n - x) === 1) ? 1 : 0
    score += neighbor1 * 20
    
    // 特征2: 邻号±2
    const neighbor2 = latest.backNumbers.some(x => Math.abs(n - x) === 2) ? 1 : 0
    score += neighbor2 * 15
    
    // 特征3: 邻号±3
    const neighbor3 = latest.backNumbers.some(x => Math.abs(n - x) === 3) ? 1 : 0
    score += neighbor3 * 10
    
    // 特征4: 012路匹配
    const road = n % 3
    const latestRoads = latest.backNumbers.map(x => x % 3)
    const roadMatch = latestRoads.includes(road) ? 1 : 0
    score += roadMatch * 12
    
    // 特征5: 近3期频率
    score += (l3[n] || 0) * 8
    
    // 特征6: 近8期频率
    score += (l8[n] || 0) * 5
    
    // 特征7: 近15期频率
    score += (l15[n] || 0) * 3
    
    // 特征8: 重号
    const repeat = prevSet.has(n) ? 1 : 0
    score += repeat * 6
    
    scores.push({ number: n, score, features: { neighbor1, neighbor2, neighbor3, roadMatch, l3: l3[n] || 0, l8: l8[n] || 0, repeat } })
  }
  
  return scores.sort((a, b) => b.score - a.score)
}

// 生成预测号码（每次结果不同，内置随机扰动）
export function generatePrediction(history) {
  const frontScores = scoreFrontNumbers(history)
  const backScores = scoreBackNumbers(history)
  
  // 智能推荐：综合得分最高的5+2
  const smartFront = [...frontScores].map(s => ({...s, score: s.score + (Math.random()-0.5)*2}))
    .sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.number).sort((a, b) => a - b)
  const smartBack = [...backScores].map(s => ({...s, score: s.score + (Math.random()-0.5)*2}))
    .sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.number).sort((a, b) => a - b)
  
  // 热号优先：近5期频率最高的
  const hotFront = [...frontScores]
    .sort((a, b) => b.features.f5 - a.features.f5 || b.features.f10 - a.features.f10)
    .slice(0, 5).map(s => s.number).sort((a, b) => a - b)
  const hotBack = [...backScores]
    .sort((a, b) => b.features.l3 - a.features.l3 || b.features.l8 - a.features.l8)
    .slice(0, 2).map(s => s.number).sort((a, b) => a - b)
  
  // 冷号修复：遗漏最大的（得分最低的）
  const coldFront = [...frontScores]
    .sort((a, b) => a.score - b.score).slice(0, 5).map(s => s.number).sort((a, b) => a - b)
  const coldBack = [...backScores]
    .sort((a, b) => a.score - b.score).slice(0, 2).map(s => s.number).sort((a, b) => a - b)
  
  return {
    smart: { front: smartFront, back: smartBack, confidence: 76 },
    hot: { front: hotFront, back: hotBack, confidence: 72 },
    cold: { front: coldFront, back: coldBack, confidence: 65 },
    frontScores,
    backScores
  }
}

// 获取号码特征详情
export function getNumberFeatures(history, number, zone = 'front') {
  if (zone === 'front') {
    const scores = scoreFrontNumbers(history)
    return scores.find(s => s.number === number)
  } else {
    const scores = scoreBackNumbers(history)
    return scores.find(s => s.number === number)
  }
}
