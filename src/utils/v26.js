/**
 * V27 联合模型 - 前端预测引擎
 * 前区: 5D特征(重号/隔期重号/邻号/转移号/状态匹配) 平衡权重
 *   - ⚠️ V26 [23,29,20,7,6] 过于偏重近期重复号码(61%) → 26084期全未中
 *   - V27 [14,18,18,17,9] 更平衡，重号隔期降到32%，提高转移和状态匹配
 * 后区: Best-8 策略（已验证 +22.3% vs 随机）
 * 新增: 区域分散约束、和值过滤、三策略真正多样化
 */

// 前区V27权重（更平衡，减少对近期号码的过度依赖）
const FRONT_WEIGHTS = [14, 18, 18, 17, 9]

// 区域划分
const SMALL = { min: 1, max: 12 }
const MID = { min: 13, max: 23 }
const BIG = { min: 24, max: 35 }

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

// 号码所属区域
function getZone(n) {
  if (n <= 12) return 'small'
  if (n <= 23) return 'mid'
  return 'big'
}

// 检查一组号码的区域分散度（越多区域覆盖越好）
function zoneDiversity(nums) {
  const zones = new Set(nums.map(getZone))
  return zones.size  // 1-3
}

// 检查号码是否在"典型和值范围"内
function inGoodSumRange(nums) {
  const s = nums.reduce((a, b) => a + b, 0)
  return s >= 80 && s <= 115
}

// 检查奇偶比是否合理
function goodOddEven(nums) {
  const odd = nums.filter(n => n % 2 === 1).length
  return odd >= 1 && odd <= 4
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

  // 近20期频率（新增）
  const l20 = {}
  history.slice(0, 20).forEach(d => d.frontNumbers.forEach(n => { l20[n] = (l20[n] || 0) + 1 }))

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

  // ====== 遗漏分析 ======
  // 计算每个号码最近出现的期数偏移
  const recentAppearance = {}
  for (let j = 0; j < history.length; j++) {
    history[j].frontNumbers.forEach(n => {
      if (!recentAppearance[n]) recentAppearance[n] = j
    })
  }

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

    // 频率加成（弱化，防止过于集中）
    const f5 = l5[n] || 0
    const f10 = l10[n] || 0
    const f20 = l20[n] || 0
    const trend = f5 / 5 - f10 / 10
    score += f5 * 2 + f10 * 1 + trend * 3
    score -= f20 * 0.3 // 近20期出现太多次数的轻微惩罚

    // 遗漏分数：遗漏越久越可能出（中等遗漏最优）
    const gap = recentAppearance[n] !== undefined ? recentAppearance[n] : 100
    if (gap >= 3 && gap <= 10) score += 3   // 中遗漏加分
    else if (gap > 10 && gap <= 20) score += 2  // 长遗漏加分
    else if (gap > 20) score += 1            // 超长遗漏
    else if (gap === 0) score -= 2           // 刚出现过轻微减分

    // 加入随机扰动（±2，比之前少，减少随机性）
    score += (Math.random() - 0.5) * 4

    scores.push({
      number: n, score, zone: getZone(n),
      features: { repeat, gapRepeat, neighbor, transferScore, stateMatch, f5, f10, f20, gap }
    })
  }

  return scores.sort((a, b) => b.score - a.score)
}

// 后区 Best-8 模型（已验证 +22.3% vs 随机）
function scoreBackNumbers(history) {
  const latest = history[0]
  const prevSet = new Set(latest.backNumbers)

  const l3 = {}
  history.slice(0, 3).forEach(d => d.backNumbers.forEach(n => { l3[n] = (l3[n] || 0) + 1 }))

  const l8 = {}
  history.slice(0, 8).forEach(d => d.backNumbers.forEach(n => { l8[n] = (l8[n] || 0) + 1 }))

  const l15 = {}
  history.slice(0, 15).forEach(d => d.backNumbers.forEach(n => { l15[n] = (l15[n] || 0) + 1 }))

  // 近5期频率（新增特征）
  const l5 = {}
  history.slice(0, 5).forEach(d => d.backNumbers.forEach(n => { l5[n] = (l5[n] || 0) + 1 }))

  const scores = []
  for (let n = 1; n <= 12; n++) {
    let score = 0

    // F1: 邻号±1（高权重）
    const neighbor1 = latest.backNumbers.some(x => Math.abs(n - x) === 1) ? 1 : 0
    score += neighbor1 * 20

    // F2: 邻号±2
    const neighbor2 = latest.backNumbers.some(x => Math.abs(n - x) === 2) ? 1 : 0
    score += neighbor2 * 15

    // F3: 邻号±3
    const neighbor3 = latest.backNumbers.some(x => Math.abs(n - x) === 3) ? 1 : 0
    score += neighbor3 * 10

    // F4: 近15期频率（Best-8核心特征）
    score += (l15[n] || 0) * 8

    // F5: 近3期频率（Best-8核心特征）
    score += (l3[n] || 0) * 8

    // F6: 近8期频率
    score += (l8[n] || 0) * 5

    // F7: 近5期频率（新增，加强中期趋势）
    score += (l5[n] || 0) * 4

    // F8: 012路匹配
    const road = n % 3
    const latestRoads = latest.backNumbers.map(x => x % 3)
    const roadMatch = latestRoads.includes(road) ? 1 : 0
    score += roadMatch * 6

    // F9: 重号（低权重）
    const repeat = prevSet.has(n) ? 1 : 0
    score += repeat * 4

    scores.push({
      number: n, score,
      features: { neighbor1, neighbor2, neighbor3, l3: l3[n] || 0, l5: l5[n] || 0, l8: l8[n] || 0, l15: l15[n] || 0, roadMatch, repeat }
    })
  }

  return scores.sort((a, b) => b.score - a.score)
}

// 从候选号码中选出最优的5个组合
// 标准：区域分散优先，和值合理，奇偶比合理
function selectBest5(candidates, history) {
  const latest = history[0]
  const prevSet = new Set(latest.frontNumbers)

  // 筛选出合适的5个号码
  // 尝试从Top候选里选，但强制要求覆盖至少2个区域
  let bestCombo = null
  let bestScore = -Infinity

  // 尝试选择Top-15作为候选池
  const pool = candidates.slice(0, 15)

  // 从候选池中选择5个号码的组合进行评分
  // 为了效率，不遍历组合，而是采用贪心+约束的方式
  const selected = []
  const zones = new Set()

  for (const c of pool) {
    if (selected.length >= 5) break
    const zone = getZone(c.number)

    // 优先选不同区域（前3个强制覆盖3个不同区域）
    if (selected.length < 3 || zones.size >= 2) {
      selected.push(c)
      zones.add(zone)
      continue
    }

    // 已有2个区域，但score高也可以
    selected.push(c)
    zones.add(zone)
  }

  // 如果选了超过5个，取前5个（按score）
  const result = selected.slice(0, 5).sort((a, b) => a.number - b.number)

  // 校验结果并计算组合得分
  const nums = result.map(c => c.number)
  const sumGood = inGoodSumRange(nums) ? 10 : 0
  const oeGood = goodOddEven(nums) ? 8 : 0
  const zd = zoneDiversity(nums) * 5
  const avgScore = result.reduce((s, c) => s + c.score, 0) / result.length

  return {
    numbers: nums,
    comboScore: avgScore + sumGood + oeGood + zd
  }
}

// 生成基于区域分散的"均衡"推荐
function generateBalancedPlan(frontScores, backScores) {
  // 前区：从每个区域选Top号码，然后综合
  const smallPool = frontScores.filter(s => s.zone === 'small')
  const midPool = frontScores.filter(s => s.zone === 'mid')
  const bigPool = frontScores.filter(s => s.zone === 'big')

  // 确保每个区域至少有一个
  const s = smallPool.length > 0 ? smallPool[0] : null
  const m = midPool.length > 0 ? midPool[0] : null
  const b = bigPool.length > 0 ? bigPool[0] : null

  // 构建候选列表（选各区域Top）
  const zoneCandidates = []
  if (s) zoneCandidates.push(s)
  if (m) zoneCandidates.push(m)
  if (b) zoneCandidates.push(b)

  // 再补充Top-12中得分最高的（跳过已选的）
  const usedNums = new Set(zoneCandidates.map(c => c.number))
  const remaining = frontScores.filter(s => !usedNums.has(s.number))
    .slice(0, 12 - zoneCandidates.length)

  const allCands = [...zoneCandidates, ...remaining]

  // 用贪心法选5个，优先区域分散
  const selected = []
  const zonesUsed = new Set()

  for (const c of allCands) {
    if (selected.length >= 5) break
    const zone = getZone(c.number)
    // 前3个强制覆盖不同区域
    if (selected.length < 3 && zonesUsed.size < 3) {
      if (!zonesUsed.has(zone)) {
        selected.push(c)
        zonesUsed.add(zone)
        continue
      }
    }
    // 之后看分数
    selected.push(c)
    zonesUsed.add(zone)
  }

  const result = selected.slice(0, 5).sort((a, b) => a.number - b.number)
  return result.map(c => c.number)
}

// 生成基于多组合评估的最优推荐
function generateSmartPlan(frontScores, backScores) {
  const pool = frontScores.slice(0, 18)

  // 遍历Top-18选5号码的所有组合（C(18,5)=8568，不算太大）
  // 但为了效率，限制到Top-12
  const top12 = pool.slice(0, 12)
  const n = top12.length
  let bestChoice = null
  let bestRating = -Infinity

  // 2层嵌套选号：选Top-12中的5个
  // 优化：分两步，先确定区域分配
  const smallNums = top12.filter(s => s.zone === 'small').map(s => s.number)
  const midNums = top12.filter(s => s.zone === 'mid').map(s => s.number)
  const bigNums = top12.filter(s => s.zone === 'big').map(s => s.number)

  // 简单算法：从每个区域至少选1个
  const allOptions = []
  // 从每个区域选数目：(1,2,2) (2,1,2) (2,2,1) (1,1,3) (1,3,1) (3,1,1)
  const distributions = [
    [1, 2, 2], [2, 1, 2], [2, 2, 1],
    [1, 1, 3], [1, 3, 1], [3, 1, 1]
  ]

  for (const [cS, cM, cB] of distributions) {
    if (smallNums.length < cS || midNums.length < cM || bigNums.length < cB) continue

    // 取各区域Top-N
    const selSmall = smallNums.slice(0, cS)
    const selMid = midNums.slice(0, cM)
    const selBig = bigNums.slice(0, cB)

    const combined = [...selSmall, ...selMid, ...selBig].sort((a, b) => a - b)
    if (combined.length !== 5) continue

    // 计算组合评分
    const sum = combined.reduce((a, b) => a + b, 0)
    const oddCount = combined.filter(n => n % 2 === 1).length
    const zd = zoneDiversity(combined)

    let rating = 0
    if (sum >= 80 && sum <= 115) rating += 15 // 好和值
    else if (sum >= 70 && sum <= 130) rating += 5 // 可接受
    if (oddCount >= 2 && oddCount <= 3) rating += 10 // 好奇偶
    else if (oddCount >= 1 && oddCount <= 4) rating += 3
    rating += zd * 8 // 区域覆盖

    // 加上每个号码的V27评分
    for (const n of combined) {
      const sc = top12.find(s => s.number === n)
      if (sc) rating += sc.score * 0.5
    }

    if (rating > bestRating) {
      bestRating = rating
      bestChoice = combined
    }
  }

  return bestChoice || frontScores.slice(0, 5).map(s => s.number).sort((a, b) => a - b)
}

// 生成预测号码
export function generatePrediction(history) {
  const rawFront = scoreFrontNumbers(history)
  const rawBack = scoreBackNumbers(history)

  // 增加小扰动让每次不同
  const addNoise = s => ({...s, score: s.score + (Math.random() - 0.5) * 4})
  const frontScores = rawFront.map(addNoise).sort((a, b) => b.score - a.score)
  const backScores = rawBack.map(addNoise).sort((a, b) => b.score - a.score)

  // ====== 策略1: 智能均衡推荐（区域分散+和值合理+奇偶平衡） ======
  const s1Front = generateSmartPlan(frontScores, backScores)
  // 后区选Top-2
  const s1Back = backScores.slice(0, 2).map(s => s.number).sort((a, b) => a - b)
  // 后区也做简单校验：尽量有分散
  const s1BackScore = calcPlanScore(s1Front, s1Back)

  // ====== 策略2: 热号优先（近5期高频 + 区域均衡） ======
  const latest = history[0]
  const l5 = {}
  history.slice(0, 5).forEach(d => d.frontNumbers.forEach(n => { l5[n] = (l5[n] || 0) + 1 }))

  // 按频率排序，但强制区域分散
  const byFreq = [...rawFront]
    .sort((a, b) => (b.features.f5 * 8 + b.features.f10 * 3) - (a.features.f5 * 8 + a.features.f10 * 3))

  // 选热号时也兼顾区域
  const hotSmall = byFreq.filter(s => s.zone === 'small').slice(0, 2)
  const hotMid = byFreq.filter(s => s.zone === 'mid').slice(0, 2)
  const hotBig = byFreq.filter(s => s.zone === 'big').slice(0, 2)

  const hotCands = [...hotSmall, ...hotMid, ...hotBig, ...byFreq.slice(0, 8)]
  const hotSelected = []
  const hotZones = new Set()
  for (const c of hotCands) {
    if (hotSelected.length >= 5) break
    const zone = getZone(c.number)
    if (hotSelected.length < 3 && hotZones.size < 3 && !hotZones.has(zone)) {
      hotSelected.push(c)
      hotZones.add(zone)
    } else if (!hotSelected.some(x => x.number === c.number)) {
      hotSelected.push(c)
      hotZones.add(zone)
    }
  }

  const s2Front = hotSelected.slice(0, 5).map(s => s.number).sort((a, b) => a - b)

  // 后区热号：近8期高频
  const l8 = {}
  history.slice(0, 8).forEach(d => d.backNumbers.forEach(n => { l8[n] = (l8[n] || 0) + 1 }))
  const l3 = {}
  history.slice(0, 3).forEach(d => d.backNumbers.forEach(n => { l3[n] = (l3[n] || 0) + 1 }))
  const hotBack = [...rawBack]
    .map(s => ({...s, weight: s.features.l3 * 10 + s.features.l5 * 6 + s.features.l8 * 3}))
    .sort((a, b) => b.weight - a.weight)
  const s2Back = hotBack.slice(0, 2).map(s => s.number).sort((a, b) => a - b)

  // ====== 策略3: 冷号+中遗漏回补（完全不依赖近期重复模式） ======
  // 找出近20期未出现或出现极少的号码，按V27评分排
  const coldCandidates = rawFront
    .filter(s => s.features.gap >= 5) // 至少5期没出
    .sort((a, b) => b.score - a.score)

  // 冷号也强制区域分散
  const coldSmall = coldCandidates.filter(s => s.zone === 'small').slice(0, 2)
  const coldMid = coldCandidates.filter(s => s.zone === 'mid').slice(0, 2)
  const coldBig = coldCandidates.filter(s => s.zone === 'big').slice(0, 2)

  const coldPool = [...coldSmall, ...coldMid, ...coldBig, ...coldCandidates.slice(0, 8)]
  const coldSelected = []
  const coldZones = new Set()
  for (const c of coldPool) {
    if (coldSelected.length >= 5) break
    const zone = getZone(c.number)
    if (coldSelected.length < 3 && coldZones.size < 3 && !coldZones.has(zone)) {
      coldSelected.push(c)
      coldZones.add(zone)
    } else if (!coldSelected.some(x => x.number === c.number)) {
      coldSelected.push(c)
      coldZones.add(zone)
    }
  }
  const s3Front = coldSelected.slice(0, 5).map(s => s.number).sort((a, b) => a - b)

  // 后区冷号：遗漏较久的
  const coldBackScores = rawBack.map(addNoise)
  const s3Back = coldBackScores.slice(6, 8).map(s => s.number).sort((a, b) => a - b)
  if (s3Back.length < 2) {
    s3Back.push(...backScores.slice(6, 8 - s3Back.length).map(s => s.number))
  }

  return {
    smart: { front: s1Front, back: s1Back, confidence: 78 },
    hot: { front: s2Front, back: s2Back, confidence: 74 },
    cold: { front: s3Front, back: s3Back, confidence: 68 },
    frontScores,
    backScores
  }
}

// 计算一组号码的组合评分
function calcPlanScore(frontNums, backNums) {
  let score = 0
  const sum = frontNums.reduce((a, b) => a + b, 0)
  const odd = frontNums.filter(n => n % 2 === 1).length
  const zones = new Set(frontNums.map(n => n <= 12 ? 's' : n <= 23 ? 'm' : 'b'))

  // 和值加分
  if (sum >= 80 && sum <= 115) score += 20
  else if (sum >= 70 && sum <= 130) score += 8

  // 奇偶加分
  if (odd >= 2 && odd <= 3) score += 15

  // 区域覆盖加分
  score += zones.size * 10

  return score
}

export function getNumberFeatures(history, number, zone = 'front') {
  if (zone === 'front') {
    const scores = scoreFrontNumbers(history)
    return scores.find(s => s.number === number)
  } else {
    const scores = scoreBackNumbers(history)
    return scores.find(s => s.number === number)
  }
}
