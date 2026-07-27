#!/usr/bin/env node
/**
 * 详细命中分布分析 — 看看模型到底比随机好在哪
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

function evalDetail(weights, testPeriods, sorted) {
  // 前区命中分布
  const detail = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0}
  let totalHits = 0
  for (const actual of testPeriods) {
    const trainHistory = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (trainHistory.length < 50) continue
    const top6 = scoreFront(trainHistory, weights).slice(0,6).map(s=>s.number)
    const hits = top6.filter(n=>new Set(actual.frontNumbers).has(n)).length
    detail[hits < 5 ? hits : 5]++
    totalHits += hits
  }
  const n = testPeriods.length
  return { detail, avg: totalHits/n, n }
}

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)

console.log('前区命中分布对比')
console.log('预测6码 vs 实际5码中奖号码')
console.log('测试: ' + allTest.length + ' 期')
console.log('')

// 随机分布（理论值）
function randomDetail(nTest) {
  const d = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0}
  for (let t=0; t<nTest; t++) {
    const hits = Array.from({length:6},()=>Math.floor(Math.random()*35)+1)
      .filter(n=>{const w=new Set(Array.from({length:5},()=>Math.floor(Math.random()*35)+1));return w.has(n)}).length
    d[hits < 5 ? hits : 5]++
  }
  return d
}

// 理论分布
const rd = randomDetail(500000)
console.log('--- 随机 (50万次模拟) ---')
let randAvg = 0
for (const k of Object.keys(rd)) { randAvg += k*rd[k] }
randAvg /= 500000
for (let k=0; k<=4; k++) {
  console.log('  前区中' + k + '个: ' + (rd[k]/500000*100).toFixed(2) + '%')
}
console.log('  平均命中: ' + randAvg.toFixed(4))

const configs = [
  {name:'V26 [23,29,20,7,6]', w:[23,29,20,7,6]},
  {name:'新 [15,24,3,13,20]', w:[15,24,3,13,20]},
  {name:'新 [5,27,10,13,19]', w:[5,27,10,13,19]},
  {name:'新 [3,24,8,13,24]', w:[3,24,8,13,24]},
]

for (const c of configs) {
  const r = evalDetail(c.w, allTest, sorted)
  console.log('\n--- ' + c.name + ' ---')
  for (let k=0; k<=4; k++) {
    const pct = (r.detail[k]/r.n*100).toFixed(2)
    const rPct = (rd[k]/500000*100).toFixed(2)
    const diff = (r.detail[k]/r.n - rd[k]/500000)*100
    const sign = diff > 0 ? '+' : ''
    console.log('  前区中' + k + '个: ' + pct + '% (随机:' + rPct + '%, 差:' + sign + diff.toFixed(2) + '%)')
  }
  console.log('  平均命中: ' + r.avg.toFixed(4) + ' (随机:' + randAvg.toFixed(4) + ')')
  console.log('  中奖率(前≥2): ' + ((r.detail[2]+r.detail[3]+r.detail[4])/r.n*100).toFixed(2) + '%')
}
