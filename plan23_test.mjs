#!/usr/bin/env node
/**
 * 方案2: 减少预测数量，集中高置信度
 * 对比: top-1, top-2, ..., top-6 各有多准
 * 看看前几名是否比随机明显强
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

function evalTopK(weights, testPeriods, sorted, k) {
  let hits = 0, total = 0
  for (const actual of testPeriods) {
    const trainHistory = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (trainHistory.length < 50) continue
    const topK = scoreFront(trainHistory, weights).slice(0,k).map(s=>s.number)
    const actualSet = new Set(actual.frontNumbers)
    hits += topK.filter(n=>actualSet.has(n)).length
    total++
  }
  return hits/total
}

// 随机基线
function randomTopK(k) {
  let hits = 0
  for (let t=0; t<500000; t++) {
    const pred = new Set()
    while (pred.size < k) pred.add(Math.floor(Math.random()*35)+1)
    const win = new Set()
    while (win.size < 5) win.add(Math.floor(Math.random()*35)+1)
    // 确保没有重复（用Set实现不放回）
    // 但win可能和其他随机试次有重叠——但只要pred和win在同一期内不重复就行
    // 更简单：直接用一次性无放回
  }
  // 理论期望: k * 5/35
  return k * 5 / 35
}

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)
console.log('方案2: 减少预测数量 — 各Top-K命中率')
console.log('测试: ' + allTest.length + ' 期')
console.log('')

const configs = [
  {name:'V26 [23,29,20,7,6]', w:[23,29,20,7,6]},
  {name:'新 [15,24,3,13,20]', w:[15,24,3,13,20]},
  {name:'新 [3,24,8,13,24]', w:[3,24,8,13,24]},
]

// 表头
console.log('K  | 理论随机  | V26    | 新[15,24,3,13,20] | 新[3,24,8,13,24]')
console.log('-'.repeat(65))
for (let k=1; k<=6; k++) {
  const r = (k * 5 / 35).toFixed(4)
  const vals = configs.map(c => evalTopK(c.w, allTest, sorted, k).toFixed(4))
  const v26g = ((vals[0]/r - 1)*100).toFixed(2)
  const n1g = ((vals[1]/r - 1)*100).toFixed(2)
  const n2g = ((vals[2]/r - 1)*100).toFixed(2)
  const line = k + '  | ' + r.padStart(8) + ' | ' + vals[0].padStart(6) + ' (' + v26g + '%)' + ' | ' + vals[1].padStart(6) + ' (' + n1g + '%)' + ' | ' + vals[2].padStart(6) + ' (' + n2g + '%)'
  console.log(line)
}

// 方案3快速测试：遗漏值特征
console.log('\n\n方案3: 新特征 — 遗漏值 (Omission)')
console.log('遗漏值 = 距离上次出现多少期，是经典的彩票预测特征')
console.log('')

// 简单测试：用遗漏值替代重号 的效果
function scoreFrontOmission(history, weights) {
  // 和scoreFront相同，但特征4(状态匹配)替换为 遗漏值归一化
  const latest = history[0], prev = history[1] || latest
  const prevSet = new Set(latest.frontNumbers), prev2Set = new Set(prev.frontNumbers)
  const l5 = {}; history.slice(0,5).forEach(d=>d.frontNumbers.forEach(n=>l5[n]=(l5[n]||0)+1))
  const l10 = {}; history.slice(0,10).forEach(d=>d.frontNumbers.forEach(n=>l10[n]=(l10[n]||0)+1))
  // 计算遗漏值：每个号码距离上次出现多少期
  const omission = {}
  for (let n=1; n<=35; n++) {
    omission[n] = 100  // 默认100期没出现
    for (let j=0; j<history.length; j++) {
      if (history[j].frontNumbers.includes(n)) {
        omission[n] = j  // j=0=上一期, j=1=上两期...距离=j
        break
      }
    }
  }
  const maxOmission = Math.max(1, ...Object.values(omission))
  
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
    const omissionNorm = (maxOmission - omission[n]) / maxOmission  // 1=刚出过, 0=很久没出
    const f5=l5[n]||0; const f10=l10[n]||0; const trend=f5/5-f10/10
    let score = repeat*weights[0] + gapRepeat*weights[1] + neighbor*weights[2] + ts*weights[3] + omissionNorm*weights[4]
    score += f5*3 + f10*2 + trend*5
    scores.push({number:n,score})
  }
  return scores.sort((a,b)=>b.score-a.score)
}

function evalTopKOm(weights, testPeriods, sorted, k) {
  let hits = 0, total = 0
  for (const actual of testPeriods) {
    const trainHistory = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (trainHistory.length < 50) continue
    const topK = scoreFrontOmission(trainHistory, weights).slice(0,k).map(s=>s.number)
    const actualSet = new Set(actual.frontNumbers)
    hits += topK.filter(n=>actualSet.has(n)).length
    total++
  }
  return hits/total
}

// 测试基础权重 [23,29,20,7] + 遗漏值(新特征4取代状态匹配)
console.log('特征方案: [重号,隔期,邻号,转移,遗漏值]')
console.log('测试权重 [23,29,20,7,6]（原有替入，6是遗漏值权重）')
console.log('')
console.log('K  | 理论随机  | V26原状态 | 遗漏值替代')
console.log('-'.repeat(45))
for (let k=1; k<=6; k++) {
  const r = (k * 5 / 35).toFixed(4)
  const v26v = evalTopK([23,29,20,7,6], allTest, sorted, k).toFixed(4)
  const omv = evalTopKOm([23,29,20,7,6], allTest, sorted, k).toFixed(4)
  console.log(k + '  | ' + r.padStart(8) + ' | ' + v26v.padStart(8) + ' | ' + omv.padStart(8))
}
