#!/usr/bin/env node
/**
 * V26 精确权重扫描 — 用前端 v26.js 同款特征做回测
 * 对比 V26 原始权重 vs 附近变化 vs 随机搜索
 */
import { lotteryData } from './src/data/lottery.js'

function sumState(nums) {
  const s = nums.reduce((a, b) => a + b, 0)
  if (s < 70) return 1; if (s < 85) return 2; if (s < 100) return 3
  if (s < 115) return 4; if (s < 130) return 5; return 6
}

function scoreFront(history, weights) {
  const latest = history[0], prev = history[1] || latest
  const prevSet = new Set(latest.frontNumbers)
  const prev2Set = new Set(prev.frontNumbers)
  const l5 = {}; history.slice(0,5).forEach(d=>d.frontNumbers.forEach(n=>l5[n]=(l5[n]||0)+1))
  const l10 = {}; history.slice(0,10).forEach(d=>d.frontNumbers.forEach(n=>l10[n]=(l10[n]||0)+1))
  const state = sumState(latest.frontNumbers)
  const oddCount = latest.frontNumbers.filter(n=>n%2===1).length
  const bigCount = latest.frontNumbers.filter(n=>n>=18).length
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
    const repeat = prevSet.has(n)?1:0
    const gapRepeat = (prev2Set.has(n)&&!prevSet.has(n))?1:0
    const neighbor = latest.frontNumbers.some(x=>Math.abs(n-x)===1)?1:0
    let ts=0
    latest.frontNumbers.forEach(src=>{if(transfer[src]&&transfer[src][n])ts+=transfer[src][n]/maxTransfer})
    const stateMatch=(stateFreq[n]||0)/maxStateFreq
    const f5=l5[n]||0; const f10=l10[n]||0; const trend=f5/5-f10/10
    let score = repeat*weights[0] + gapRepeat*weights[1] + neighbor*weights[2] + ts*weights[3] + stateMatch*weights[4]
    score += f5*3 + f10*2 + trend*5
    scores.push({ number: n, score })
  }
  return scores.sort((a,b)=>b.score-a.score)
}

function backtest(weights, sorted) {
  const testPeriods = sorted.slice(100)
  let totalHits = 0, count = 0
  for (const actual of testPeriods) {
    const trainHistory = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period)
      .sort((a,b)=>b.period-a.period)
    if (trainHistory.length < 50) continue
    const top6 = scoreFront(trainHistory, weights).slice(0,6).map(s=>s.number)
    const actualSet = new Set(actual.frontNumbers)
    totalHits += top6.filter(n=>actualSet.has(n)).length
    count++
  }
  return totalHits / count
}

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
console.log('='.repeat(60))
console.log('V26 精确权重扫描（精确复制前端 v26.js 5D 特征）')
console.log('测试: ' + (sorted.length - 100) + ' 期 (' + sorted[100].period + '~' + sorted[sorted.length-1].period + ')')
console.log('='.repeat(60))

// 1. V26基线
const v26 = backtest([23,29,20,7,6], sorted)
console.log('\n基线:')
console.log('  V26 [23,29,20,7,6] = ' + v26.toFixed(4))

const v13 = backtest([16,20,15,17,6], sorted)
console.log('  V13 [16,20,15,17,6] = ' + v13.toFixed(4) + ' (diff: ' + (v13-v26).toFixed(4) + ')')

const s6 = backtest([25,10,15,8,10], sorted)
console.log('  S6  [25,10,15,8,10] = ' + s6.toFixed(4) + ' (diff: ' + (s6-v26).toFixed(4) + ')')

// 2. V23最优权重（简化特征找到的）在V26特征下测试
const v23w = backtest([17,22,5,11,22], sorted)
console.log('  V23best [17,22,5,11,22] = ' + v23w.toFixed(4) + ' (diff: ' + (v23w-v26).toFixed(4) + ')')

// 3. 围绕V26做局部扫描
console.log('\n--- 局部扫描 ---')
const variations = []
for (const w0 of [21,23,25]) {
  for (const w1 of [27,29,31]) {
    for (const w2 of [18,20,22]) {
      for (const w3 of [5,7,9]) {
        for (const w4 of [4,6,8]) {
          variations.push([w0,w1,w2,w3,w4])
        }
      }
    }
  }
}
// 加上V23 best的附近
for (const w0 of [15,17,19]) {
  for (const w1 of [20,22,24]) {
    for (const w2 of [3,5,7]) {
      for (const w3 of [9,11,13]) {
        for (const w4 of [20,22,24]) {
          variations.push([w0,w1,w2,w3,w4])
        }
      }
    }
  }
}

let best = {w: [23,29,20,7,6], f6: v26}
let bestImpr = {w: null, f6: 0}
for (const w of variations) {
  const f6 = backtest(w, sorted)
  if (f6 > best.f6) { best.w = w; best.f6 = f6 }
  if (f6 > v26 * 1.003) {
    const d = ((f6/v26 - 1) * 100).toFixed(2)
    console.log('  [' + w.join(',') + '] f6=' + f6.toFixed(4) + ' (+' + d + '%)')
  }
}
console.log('')
console.log('  局部最优: [' + best.w.join(',') + '] f6=' + best.f6.toFixed(4) + ' (vs V26: +' + ((best.f6/v26-1)*100).toFixed(2) + '%)')

// 4. 随机搜索
console.log('\n--- 随机搜索 100 组 ---')
let rng = { seed: 42, next() { this.seed = (this.seed * 16807) % 2147483647; return this.seed } }
let bestRand = {w: null, f6: 0}
for (let i = 0; i < 100; i++) {
  const w = Array.from({length:5}, ()=>Math.floor(rng.next() % 25) + 3)
  const f6 = backtest(w, sorted)
  if (f6 > bestRand.f6) { bestRand.w = w; bestRand.f6 = f6 }
  if (f6 > v26 * 1.004) {
    console.log('  [' + w.join(',') + '] f6=' + f6.toFixed(4) + ' (+' + ((f6/v26-1)*100).toFixed(2) + '%)')
  }
}
console.log('')
console.log('  随机最优: [' + (bestRand.w ? bestRand.w.join(',') : '-') + '] f6=' + (bestRand.f6 || 0).toFixed(4))

// 5. 总结
console.log('\n' + '='.repeat(60))
console.log('总结')
console.log('='.repeat(60))
console.log('  V26 [23,29,20,7,6]         = ' + v26.toFixed(4))
console.log('  V13 [16,20,15,17,6]        = ' + v13.toFixed(4) + '  diff: ' + (v13-v26).toFixed(4))
console.log('  S6  [25,10,15,8,10]        = ' + s6.toFixed(4) + '  diff: ' + (s6-v26).toFixed(4))
console.log('  局部最优 [' + best.w.join(',') + '] = ' + best.f6.toFixed(4) + '  diff: ' + (best.f6-v26).toFixed(4))
if (bestRand.f6 > v26) {
  console.log('  随机最优 [' + bestRand.w.join(',') + '] = ' + bestRand.f6.toFixed(4) + '  diff: ' + (bestRand.f6-v26).toFixed(4))
}
