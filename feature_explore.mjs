#!/usr/bin/env node
/**
 * 新特征探索 — 多种特征方向对比
 * 用简单权重(每个特征权重=1)单独测试每种特征的预测能力
 */
import { lotteryData } from './src/data/lottery.js'

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)

console.log('='.repeat(60))
console.log('新特征探索 — 用各特征单独预测，比TOP-1~TOP-3命中率')
console.log('测试: ' + allTest.length + ' 期')
console.log('='.repeat(60))

// Top-K评估
function evalFeature(genFn, k) {
  let hits = 0, total = 0
  for (const actual of allTest) {
    const train = sorted.filter(d => d.period >= actual.period-100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (train.length < 50) continue
    const scores = genFn(train)
    const topK = scores.sort((a,b)=>b.score-a.score).slice(0,k).map(s=>s.number)
    const actualSet = new Set(actual.frontNumbers)
    hits += topK.filter(n=>actualSet.has(n)).length
    total++
  }
  return hits/total
}

function fmt(v, r) { return (v*100).toFixed(2) + '% (vs随机' + ((v/r-1)*100).toFixed(1) + '%)' }

const random1 = 1*5/35
const random2 = 2*5/35
const random3 = 3*5/35

// ================================================================
// 特征列表
// ================================================================
const features = []

// F1: 重号（基线）
features.push({
  name: 'F1 重号(基线)',
  gen: (train) => {
    const latest = train[0]
    const set = new Set(latest.frontNumbers)
    return Array.from({length:35},(_,i)=>i+1).map(n=>({number:n, score: set.has(n)?1:0}))
  }
})

// F2: 30期热号频率 (连续30期累计频率)
features.push({
  name: 'F2 30期热号',
  gen: (train) => {
    const freq = {}
    for (let j=0; j<Math.min(30, train.length); j++)
      train[j].frontNumbers.forEach(n=>freq[n]=(freq[n]||0)+1)
    const maxF = Math.max(1,...Object.values(freq))
    return Array.from({length:35},(_,i)=>i+1).map(n=>({number:n, score:(freq[n]||0)/maxF}))
  }
})

// F3: 遗漏值 (1/遗漏期数, 越久没出分数越低? 实际上应该是越久越可能出)
features.push({
  name: 'F3 遗漏值',
  gen: (train) => {
    const omission = {}
    for (let n=1; n<=35; n++) {
      omission[n] = train.length
      for (let j=0; j<train.length; j++)
        if (train[j].frontNumbers.includes(n)) { omission[n] = j; break }
    }
    const maxO = Math.max(1,...Object.values(omission))
    return Array.from({length:35},(_,i)=>i+1).map(n=>({number:n, score:(maxO - omission[n])/maxO}))
  }
})

// F4: 热号频率(倒过来, 越久没出分数越高 = 遗漏越久越可能出)
features.push({
  name: 'F4 反遗漏',
  gen: (train) => {
    const omission = {}
    for (let n=1; n<=35; n++) {
      omission[n] = train.length
      for (let j=0; j<train.length; j++)
        if (train[j].frontNumbers.includes(n)) { omission[n] = j; break }
    }
    const maxO = Math.max(1,...Object.values(omission))
    return Array.from({length:35},(_,i)=>i+1).map(n=>({number:n, score:omission[n]/maxO}))
  }
})

// F5: 区间热度 (5个区间 1-7/8-14/15-21/22-28/29-35)
features.push({
  name: 'F5 区间热度',
  gen: (train) => {
    const zoneFreq = {}
    for (let j=0; j<Math.min(20, train.length); j++) {
      train[j].frontNumbers.forEach(n=>{
        const zone = Math.floor((n-1)/7)
        zoneFreq[zone] = (zoneFreq[zone]||0)+1
      })
    }
    const maxZ = Math.max(1,...Object.values(zoneFreq))
    return Array.from({length:35},(_,i)=>i+1).map(n=>({number:n, score:(zoneFreq[Math.floor((n-1)/7)]||0)/maxZ}))
  }
})

// F6: 跨度特征 (每个号码离最近开奖号码的距离反向)
features.push({
  name: 'F6 跨度关联',
  gen: (train) => {
    const latest = train[0].frontNumbers
    return Array.from({length:35},(_,i)=>i+1).map(n=>({
      number:n,
      score: 1 - Math.min(...latest.map(x=>Math.abs(n-x)))/34
    }))
  }
})

// F7: 间隔模式 (号码在上一次出现时的间隔期数 vs 历史平均间隔)
features.push({
  name: 'F7 间隔偏离',
  gen: (train) => {
    const gaps = {}
    const lastAppear = {}
    for (let j=0; j<train.length; j++) {
      train[j].frontNumbers.forEach(n=>{
        if (lastAppear[n] !== undefined) {
          const gap = j - lastAppear[n]
          if (!gaps[n]) gaps[n] = []
          gaps[n].push(gap)
        }
        lastAppear[n] = j
      })
    }
    // 当前遗漏
    const currOmission = {}
    for (let n=1; n<=35; n++) {
      if (lastAppear[n] !== undefined) currOmission[n] = lastAppear[n]
      else currOmission[n] = train.length
    }
    // 分数：如果当前遗漏超过历史平均间隔，则分数高（"该出了"）
    return Array.from({length:35},(_,i)=>i+1).map(n=>{
      const avgGap = gaps[n] ? gaps[n].reduce((a,b)=>a+b,0)/gaps[n].length : 8
      const currGap = currOmission[n] || train.length
      // 当前遗漏 / 历史平均间隔, >1表示"该出了"
      const ratio = currGap / avgGap
      // 归一化到0-1
      return {number:n, score: Math.min(1, ratio / 3)}
    })
  }
})

// F8: 与上期和值偏差 (号码能使和值接近历史平均吗?)
features.push({
  name: 'F8 和值均衡',
  gen: (train) => {
    const latest = train[0]
    const lastSum = latest.frontNumbers.reduce((a,b)=>a+b,0)
    // 历史平均和值
    let histSum = 0
    for (let j=0; j<Math.min(50, train.length); j++)
      histSum += train[j].frontNumbers.reduce((a,b)=>a+b,0)
    histSum /= Math.min(50, train.length)
    // 偏离方向
    const direction = histSum > lastSum ? 1 : -1  // 和值偏低/偏高时倾向哪边
    const deviation = Math.abs(histSum - lastSum) / 200  // 归一化
    return Array.from({length:35},(_,i)=>i+1).map(n=>({
      number:n,
      score: direction > 0 ? (n > 18 ? deviation : 0) : (n < 18 ? deviation : 0)
    }))
  }
})

console.log('\n--- 各特征单独预测 (TOP-1/2/3) ---')
console.log('')
console.log('特征'.padEnd(20) + ' | TOP-1'.padEnd(25) + ' | TOP-2'.padEnd(25) + ' | TOP-3')
console.log('-'.repeat(85))
for (const f of features) {
  const t1 = evalFeature(f.gen, 1)
  const t2 = evalFeature(f.gen, 2)
  const t3 = evalFeature(f.gen, 3)
  console.log(f.name.padEnd(20) + ' | ' + fmt(t1, random1).padEnd(22) + ' | ' + fmt(t2, random2).padEnd(22) + ' | ' + fmt(t3, random3))
}

// ================================================================
// 组合特征测试
// ================================================================
console.log('\n\n--- V26 + 新特征组合(各+1权重) ---')
console.log('')

// V26评分函数
function scoreFront(history) {
  const latest = history[0], prev = history[1] || latest
  const prevSet = new Set(latest.frontNumbers), prev2Set = new Set(prev.frontNumbers)
  const l5 = {}; history.slice(0,5).forEach(d=>d.frontNumbers.forEach(n=>l5[n]=(l5[n]||0)+1))
  const l10 = {}; history.slice(0,10).forEach(d=>d.frontNumbers.forEach(n=>l10[n]=(l10[n]||0)+1))
  const state = sumState(latest.frontNumbers), oddCount = latest.frontNumbers.filter(n=>n%2===1).length, bigCount = latest.frontNumbers.filter(n=>n>=18).length
  const stateFreq={}
  for(let j=1;j<history.length;j++){const d=history[j],p=history[j+1]||history[j];if(sumState(d.frontNumbers)===state && d.frontNumbers.filter(n=>n%2===1).length===oddCount && d.frontNumbers.filter(n=>n>=18).length===bigCount)p.frontNumbers.forEach(n=>stateFreq[n]=(stateFreq[n]||0)+1)}
  const maxStateFreq=Math.max(1,...Object.values(stateFreq))
  const transfer={}
  for(let j=1;j<history.length;j++){const src=history[j].frontNumbers,tgt=history[j-1].frontNumbers;src.forEach(s=>{if(!transfer[s])transfer[s]={};tgt.forEach(t=>{if(s!==t)transfer[s][t]=(transfer[s][t]||0)+1})})}
  const maxTransfer=Math.max(1,...Object.values(transfer).flatMap(v=>Object.values(v)))
  const scores=Array.from({length:35},(_,i)=>i+1).map(n=>{
    const repeat=prevSet.has(n)?1:0,gapRepeat=(prev2Set.has(n)&&!prevSet.has(n))?1:0
    const neighbor=latest.frontNumbers.some(x=>Math.abs(n-x)===1)?1:0
    let ts=0;latest.frontNumbers.forEach(src=>{if(transfer[src]&&transfer[src][n])ts+=transfer[src][n]/maxTransfer})
    const stateMatch=(stateFreq[n]||0)/maxStateFreq
    const f5=l5[n]||0;const f10=l10[n]||0
    let score=repeat*23+gapRepeat*29+neighbor*20+ts*7+stateMatch*6
    score+=f5*3+f10*2+(f5/5-f10/10)*5
    return {number:n,score}
  })
  return scores
}
function sumState(nums){const s=nums.reduce((a,b)=>a+b,0);if(s<70)return 1;if(s<85)return 2;if(s<100)return 3;if(s<115)return 4;if(s<130)return 5;return 6}

// 加强版V26+：增加新特征
function scoreFrontPlus(history, bonuses) {
  const base = scoreFront(history)
  const baseMap = {}
  base.forEach(s=>baseMap[s.number]=s.score)
  
  // 计算新特征
  // 30期热号
  const freq30={}
  for(let j=0;j<Math.min(30,history.length);j++)history[j].frontNumbers.forEach(n=>freq30[n]=(freq30[n]||0)+1)
  const maxF30=Math.max(1,...Object.values(freq30))
  
  // 遗漏值
  const omission={}
  for(let n=1;n<=35;n++){omission[n]=history.length;for(let j=0;j<history.length;j++)if(history[j].frontNumbers.includes(n)){omission[n]=j;break}}
  const maxO=Math.max(1,...Object.values(omission))
  
  // 区间热度
  const zoneFreq={}
  for(let j=0;j<Math.min(20,history.length);j++)history[j].frontNumbers.forEach(n=>zoneFreq[Math.floor((n-1)/7)]=(zoneFreq[Math.floor((n-1)/7)]||0)+1)
  const maxZ=Math.max(1,...Object.values(zoneFreq))
  
  // 间隔偏离
  const gaps={},lastAppear={}
  for(let j=0;j<history.length;j++){history[j].frontNumbers.forEach(n=>{if(lastAppear[n]!==undefined){const g=j-lastAppear[n];if(!gaps[n])gaps[n]=[];gaps[n].push(g)}lastAppear[n]=j})}
  
  return Array.from({length:35},(_,i)=>i+1).map(n=>{
    let s = baseMap[n]
    if(bonuses.freq30) s += (freq30[n]||0)/maxF30 * bonuses.freq30
    if(bonuses.omission) s += (maxO - (omission[n]||0))/maxO * bonuses.omission
    if(bonuses.zone) s += (zoneFreq[Math.floor((n-1)/7)]||0)/maxZ * bonuses.zone
    if(bonuses.gap) {
      const avgGap = gaps[n] ? gaps[n].reduce((a,b)=>a+b,0)/gaps[n].length : 8
      const currGap = omission[n] || history.length
      const ratio = currGap / avgGap
      s += Math.min(1, ratio/3) * bonuses.gap
    }
    return {number:n,score:s}
  })
}

function evalPlus(bonuses, k) {
  let hits=0,total=0
  for(const actual of allTest){
    const train=sorted.filter(d=>d.period>=actual.period-100&&d.period<actual.period).sort((a,b)=>b.period-a.period)
    if(train.length<50)continue
    const topK=scoreFrontPlus(train,bonuses).slice(0,k).map(s=>s.number)
    const actualSet=new Set(actual.frontNumbers)
    hits+=topK.filter(n=>actualSet.has(n)).length;total++
  }
  return hits/total
}

const v26t6 = evalFeature(
  (train)=>{const latest=train[0];const set=new Set(latest.frontNumbers);return Array.from({length:35},(_,i)=>i+1).map(n=>({number:n,score:set.has(n)?1:0}))},
  6
)
const v26f6 = evalPlus({}, 6)
console.log('V26原始  TOP-6: ' + v26f6.toFixed(4) + ' (随机:' + (6*5/35).toFixed(4) + ')')

const bonusCombos = [
  {name:'+频30', b:{freq30:5}},
  {name:'+遗漏', b:{omission:5}},
  {name:'+区间', b:{zone:5}},
  {name:'+间隔', b:{gap:5}},
  {name:'+频30+遗漏', b:{freq30:3, omission:3}},
  {name:'+频30+区间', b:{freq30:3, zone:3}},
  {name:'+遗漏+区间', b:{omission:3, zone:3}},
  {name:'+遗漏+区间+频30', b:{omission:3, zone:3, freq30:3}},
  {name:'全加', b:{freq30:2, omission:2, zone:2, gap:2}},
  {name:'全加(5)', b:{freq30:5, omission:5, zone:5, gap:5}},
]

for (const c of bonusCombos) {
  const t6 = evalPlus(c.b, 6)
  const impr = ((t6/v26f6-1)*100).toFixed(2)
  console.log('V26' + c.name.padEnd(12) + ' TOP-6: ' + t6.toFixed(4) + ' (vs V26: ' + (t6-v26f6).toFixed(4) + ', +' + impr + '%)')
}
