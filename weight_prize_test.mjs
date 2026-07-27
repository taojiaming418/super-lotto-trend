#!/usr/bin/env node
/**
 * 真实中奖率评测 — 不是前6平均命中，是"能不能中奖"
 * 
 * 用户真实玩法: 胆拖 / 6+3复式
 * 给6个前区推荐号码 + 3个后区推荐号码
 * 
 * 中奖条件:
 * - 九等奖: 前6中≥2 且 后3中≥1  OR  前6中≥3
 * - 更大奖: 没特别要求，先看九等奖
 */
import { lotteryData } from './src/data/lottery.js'

function sumState(nums) {
  const s = nums.reduce((a, b) => a + b, 0)
  if (s < 70) return 1; if (s < 85) return 2; if (s < 100) return 3
  if (s < 115) return 4; if (s < 130) return 5; return 6
}

function scoreFront(history, weights) {
  const latest = history[0], prev = history[1] || latest
  const prevSet = new Set(latest.frontNumbers), prev2Set = new Set(prev.frontNumbers)
  const l5 = {}; history.slice(0,5).forEach(d=>d.frontNumbers.forEach(n=>l5[n]=(l5[n]||0)+1))
  const l10 = {}; history.slice(0,10).forEach(d=>d.frontNumbers.forEach(n=>l10[n]=(l10[n]||0)+1))
  const state = sumState(latest.frontNumbers), oddCount = latest.frontNumbers.filter(n=>n%2===1).length, bigCount = latest.frontNumbers.filter(n=>n>=18).length
  const stateFreq = {}
  for (let j=1; j<history.length; j++) {
    const d=history[j], p=history[j+1]||history[j]
    if (sumState(d.frontNumbers)===state && d.frontNumbers.filter(n=>n%2===1).length===oddCount && d.frontNumbers.filter(n=>n>=18).length===bigCount)
      p.frontNumbers.forEach(n=>stateFreq[n]=(stateFreq[n]||0)+1)
  }
  const maxStateFreq = Math.max(1,...Object.values(stateFreq))
  const transfer={}
  for (let j=1; j<history.length; j++) {
    const src=history[j].frontNumbers, tgt=history[j-1].frontNumbers
    src.forEach(s=>{if(!transfer[s])transfer[s]={};tgt.forEach(t=>{if(s!==t)transfer[s][t]=(transfer[s][t]||0)+1})})
  }
  const maxTransfer = Math.max(1,...Object.values(transfer).flatMap(v=>Object.values(v)))
  const scores=[]
  for (let n=1; n<=35; n++) {
    const repeat = prevSet.has(n)?1:0, gapRepeat = (prev2Set.has(n)&&!prevSet.has(n))?1:0
    const neighbor = latest.frontNumbers.some(x=>Math.abs(n-x)===1)?1:0
    let ts=0; latest.frontNumbers.forEach(src=>{if(transfer[src]&&transfer[src][n])ts+=transfer[src][n]/maxTransfer})
    const stateMatch=(stateFreq[n]||0)/maxStateFreq
    const f5=l5[n]||0; const f10=l10[n]||0; const trend=f5/5-f10/10
    let score = repeat*weights[0] + gapRepeat*weights[1] + neighbor*weights[2] + ts*weights[3] + stateMatch*weights[4]
    score += f5*3 + f10*2 + trend*5
    scores.push({number:n,score})
  }
  return scores.sort((a,b)=>b.score-a.score)
}

function scoreBack(history) {
  const latest = history[0], prev = history[1] || latest
  const prevSet = new Set(latest.backNumbers)
  const prev2Set = prev ? new Set(prev.backNumbers) : new Set()
  const l3 = {}; history.slice(0,3).forEach(d=>d.backNumbers.forEach(n=>l3[n]=(l3[n]||0)+1))
  const l8 = {}; history.slice(0,8).forEach(d=>d.backNumbers.forEach(n=>l8[n]=(l8[n]||0)+1))
  const neighbor1 = []; const neighbor2 = []
  history[0].backNumbers.forEach(n=>{if(n>1)neighbor1.push(n-1);if(n<12)neighbor1.push(n+1);if(n>2)neighbor2.push(n-2);if(n<11)neighbor2.push(n+2)})
  const n1Set = new Set(neighbor1); const n2Set = new Set(neighbor2)
  const road012 = latest.backNumbers.map(n=>n%3).sort().join(',')
  const roadFreq={}; for(let j=1; j<Math.min(30,history.length); j++){const r=history[j].backNumbers.map(n=>n%3).sort().join(',');if(r===road012)history[j-1].backNumbers.forEach(n=>roadFreq[n]=(roadFreq[n]||0)+1)}
  const maxRoad = Math.max(1,...Object.values(roadFreq))
  const scores=[]
  for(let n=1;n<=12;n++){
    let score = 0
    score += (n1Set.has(n)?2.0:0) + (n2Set.has(n)?1.0:0)
    score += (prevSet.has(n)?2.5:0) + (prev2Set.has(n)?1.5:0)
    score += (l3[n]||0)*1.2 + (l8[n]||0)*0.6
    score += (roadFreq[n]||0)/maxRoad * 1.0
    scores.push({number:n,score})
  }
  return scores.sort((a,b)=>b.score-a.score)
}

function evaluate(weights, testPeriods, sorted) {
  let winCount = 0, win2plus1 = 0, win3plus = 0, total = 0
  for (const actual of testPeriods) {
    const trainHistory = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (trainHistory.length < 50) continue
    
    const frontPred = scoreFront(trainHistory, weights).slice(0,6).map(s=>s.number)
    const backPred = scoreBack(trainHistory).slice(0,3).map(s=>s.number)
    
    const frontHits = frontPred.filter(n=>new Set(actual.frontNumbers).has(n)).length
    const backHits = backPred.filter(n=>new Set(actual.backNumbers).has(n)).length
    
    // 九等奖条件1: 前≥2 且 后≥1
    const cond1 = frontHits >= 2 && backHits >= 1
    // 九等奖条件2: 前≥3（不管后区）
    const cond2 = frontHits >= 3
    // 中奖 = 任一条件满足
    const win = cond1 || cond2
    
    if (win) winCount++
    if (cond1) win2plus1++
    if (cond2) win3plus++
    total++
  }
  return {
    winRate: winCount/total,
    win2plus1Rate: win2plus1/total,
    win3plusRate: win3plus/total,
    total
  }
}

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)
const mid = Math.floor(allTest.length / 2)

console.log('='.repeat(60))
console.log('真实中奖率评测 — 6前+3后推荐')
console.log('中奖=前6中≥2且后3中≥1 或 前6中≥3')
console.log('测试: ' + allTest.length + ' 期')
console.log('='.repeat(60))

// 随机基线
console.log('\n--- 随机基线 (模拟 50 次取平均) ---')
let randWin = 0, rand2p1 = 0, rand3p = 0
for (let t=0; t<50; t++) {
  let w=0,w21=0,w3=0,total=0
  for (const actual of allTest) {
    const frontPred = Array.from({length:6},()=>Math.floor(Math.random()*35)+1)
    const backPred = Array.from({length:3},()=>Math.floor(Math.random()*12)+1)
    const fh = frontPred.filter(n=>new Set(actual.frontNumbers).has(n)).length
    const bh = backPred.filter(n=>new Set(actual.backNumbers).has(n)).length
    if (fh>=2&&bh>=1) {w++;w21++}
    else if (fh>=3) {w++;w3++}
    total++
  }
  randWin += w/total; rand2p1 += w21/total; rand3p += w3/total
}
randWin/=50; rand2p1/=50; rand3p/=50
console.log('  总中奖率: ' + (randWin*100).toFixed(2) + '%')
console.log('  其中 前≥2+后≥1: ' + (rand2p1*100).toFixed(2) + '%')
console.log('  其中 前≥3:      ' + (rand3p*100).toFixed(2) + '%')

// 评估各权重
const configs = [
  {name:'V26原 [23,29,20,7,6]', w:[23,29,20,7,6]},
  {name:'V13 [16,20,15,17,6]', w:[16,20,15,17,6]},
  {name:'新 [15,24,3,13,20]', w:[15,24,3,13,20]},
  {name:'新 [4,29,17,18,14]', w:[4,29,17,18,14]},
  {name:'新 [5,27,10,13,19]', w:[5,27,10,13,19]},
  {name:'新 [3,24,8,13,24]', w:[3,24,8,13,24]},
]

console.log('\n--- 各模型中奖率 ---')
for (const c of configs) {
  const r = evaluate(c.w, allTest, sorted)
  
  // 早期验证
  const rEarly = evaluate(c.w, allTest.slice(0, Math.floor(allTest.length/2)), sorted)
  const rLate = evaluate(c.w, allTest.slice(Math.floor(allTest.length/2)), sorted)
  
  const impr = ((r.winRate/randWin - 1)*100).toFixed(1)
  console.log('')
  console.log(c.name)
  console.log('  总中奖率: ' + (r.winRate*100).toFixed(2) + '%' + ' (vs随机: +' + impr + '%)')
  console.log('  前≥2+后≥1: ' + (r.win2plus1Rate*100).toFixed(2) + '%')
  console.log('  前≥3:      ' + (r.win3plusRate*100).toFixed(2) + '%')
  console.log('  早期: ' + (rEarly.winRate*100).toFixed(2) + '%  后期: ' + (rLate.winRate*100).toFixed(2) + '%')
}
