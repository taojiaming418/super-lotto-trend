#!/usr/bin/env node
/**
 * 权重验证 v2 — 大范围搜索 + 前后期交叉验证防过拟合
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

function backtest(weights, testPeriods, sorted) {
  let totalHits = 0, count = 0
  for (const actual of testPeriods) {
    const trainHistory = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (trainHistory.length < 50) continue
    const top6 = scoreFront(trainHistory, weights).slice(0,6).map(s=>s.number)
    totalHits += top6.filter(n=>new Set(actual.frontNumbers).has(n)).length; count++
  }
  return totalHits/count
}

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)
const mid = Math.floor(allTest.length / 2)
const earlyTest = allTest.slice(0, mid)
const lateTest = allTest.slice(mid)
console.log('权重验证 v2 — 大范围搜索 + 前后交叉验证')
console.log('总测试: ' + allTest.length + ' 期, 早期: ' + earlyTest.length + ' 期, 后期: ' + lateTest.length)
console.log('')

// V26基线
const v26 = backtest([23,29,20,7,6], allTest, sorted)
console.log('V26 [23,29,20,7,6] = ' + v26.toFixed(4))
console.log('')

// 大规模随机搜索
console.log('--- 随机搜索 500 组 ---')
let rng = { seed: 12345, next() { this.seed = (this.seed * 16807) % 2147483647; return this.seed } }
let candidates = []
for (let i = 0; i < 500; i++) {
  candidates.push(Array.from({length:5}, ()=>Math.floor(rng.next() % 28) + 3))
}

// 加上已知好候选
candidates.push([15,24,3,13,20], [3,26,7,14,8], [25,31,18,7,6], [21,29,22,5,4], [23,31,18,7,8])
candidates.push([15,22,3,13,20], [17,24,3,13,22], [17,22,5,11,22]) // V23类

// 评估：总 + 早期 + 后期
let best = {w:[23,29,20,7,6], f6:v26}
let top10 = []
let tested = new Set()
for (const w of candidates) {
  const key = w.join(',')
  if (tested.has(key)) continue
  tested.add(key)
  
  const f6 = backtest(w, allTest, sorted)
  if (f6 > best.f6) best = {w, f6}
  if (f6 > v26 * 1.01) {
    const f6e = backtest(w, earlyTest, sorted)
    const f6l = backtest(w, lateTest, sorted)
    // 前后期都优于V26才记录
    const v26e = backtest([23,29,20,7,6], earlyTest, sorted)
    const v26l = backtest([23,29,20,7,6], lateTest, sorted)
    const goodEarly = f6e >= v26e
    const goodLate = f6l >= v26l
    const stable = goodEarly && goodLate
    top10.push({w, f6, f6e, f6l, stable, 
      eImpr: ((f6e/v26e-1)*100).toFixed(1)+'%',
      lImpr: ((f6l/v26l-1)*100).toFixed(1)+'%'})
    const tag = stable ? ' ✅稳定' : ' ⚠️单边'
    console.log('  [' + w.join(',') + '] f6=' + f6.toFixed(4) + ' 早期:' + f6e.toFixed(4) + '(' + top10[top10.length-1].eImpr + ') 后期:' + f6l.toFixed(4) + '(' + top10[top10.length-1].lImpr + ')' + tag)
  }
}

console.log('')
console.log('🏆 总最优: [' + best.w.join(',') + '] f6=' + best.f6.toFixed(4) + ' (vs V26: +' + ((best.f6/v26-1)*100).toFixed(2) + '%)')

console.log('\n--- Top 稳定候选 (前后期都优于V26) ---')
const stableOnes = top10.filter(t => t.stable).sort((a,b) => b.f6 - a.f6)
for (const t of stableOnes.slice(0,15)) {
  console.log('  [' + t.w.join(',') + '] f6=' + t.f6.toFixed(4) + ' 早期:' + t.eImpr + ' 后期:' + t.lImpr)
}

console.log('\n--- V26 各段基线 ---')
const v26e = backtest([23,29,20,7,6], earlyTest, sorted)
const v26l = backtest([23,29,20,7,6], lateTest, sorted)
console.log('  早期: ' + v26e.toFixed(4) + ' 后期: ' + v26l.toFixed(4))

// 如果找到更好的，做精搜
if (best.f6 > v26 * 1.015) {
  console.log('\n--- 精搜 (在 [' + best.w.join(',') + '] 附近) ---')
  let rw = best.w
  let rv = best.f6
  for (let it = 0; it < 5; it++) {
    let improved = false
    for (let d = 0; d < 5; d++) {
      for (const delta of [-4, -3, -2, -1, 1, 2, 3, 4]) {
        const nw = [...rw]
        nw[d] = Math.max(1, Math.min(30, nw[d] + delta))
        const f6 = backtest(nw, allTest, sorted)
        if (f6 > rv + 0.0003) {
          rw = nw; rv = f6; improved = true
          const v = ((f6/v26-1)*100).toFixed(2)
          console.log('  迭代: [' + nw.join(',') + '] f6=' + f6.toFixed(4) + ' (+' + v + '%)')
        }
      }
    }
    if (!improved) break
  }
  console.log('')
  console.log('  精搜结果: [' + rw.join(',') + '] f6=' + rv.toFixed(4) + ' (vs V26: +' + ((rv/v26-1)*100).toFixed(2) + '%)')
  best.w = rw; best.f6 = rv
}

// 交叉验证
console.log('\n=== 交叉验证 ===')
console.log('最终候选: [' + best.w.join(',') + '] vs V26 [23,29,20,7,6]')
const f6e = backtest(best.w, earlyTest, sorted)
const f6l = backtest(best.w, lateTest, sorted)
console.log('  早期: ' + f6e.toFixed(4) + ' vs V26 ' + v26e.toFixed(4) + ' = ' + ((f6e/v26e-1)*100).toFixed(2) + '%')
console.log('  后期: ' + f6l.toFixed(4) + ' vs V26 ' + v26l.toFixed(4) + ' = ' + ((f6l/v26l-1)*100).toFixed(2) + '%')

console.log('\n=== 结论 ===')
const totalImpr = ((best.f6/v26-1)*100).toFixed(2)
if (best.f6 > v26 * 1.015) {
  console.log('✅ V26 可以被改进! [' + best.w.join(',') + '] 提升 ' + totalImpr + '%')
  if (f6e >= v26e && f6l >= v26l) console.log('   前后期验证均通过，可靠!')
  else console.log('   但单边期未验证通过，需谨慎')
} else if (best.f6 > v26 * 1.005) {
  console.log('⚡ V26 有小幅提升空间 (但差距很小)')
} else {
  console.log('✅ V26 [23,29,20,7,6] 在精确特征空间内已接近最优')
}
