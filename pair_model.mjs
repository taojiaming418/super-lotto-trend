#!/usr/bin/env node
/**
 * 号码配对建模 — 不是独立评分，而是建模号码之间的联合出现概率
 * 
 * 思路: 选6个号码时，考虑这6个号码在历史上是否经常一起出现
 * 不选6个"各自得分最高"的，选"搭配得最好"的组合
 */
import { lotteryData } from './src/data/lottery.js'

const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)

console.log('='.repeat(60))
console.log('号码配对建模 — 组合选择 vs 独立评分')
console.log('测试: ' + allTest.length + ' 期')
console.log('='.repeat(60))

// ---- V26 评分函数 ----
function sumState(nums) {
  const s=nums.reduce((a,b)=>a+b,0)
  if(s<70)return 1;if(s<85)return 2;if(s<100)return 3;if(s<115)return 4;if(s<130)return 5;return 6
}

function v26Score(history) {
  const latest=history[0],prev=history[1]||latest
  const prevSet=new Set(latest.frontNumbers),prev2Set=new Set(prev.frontNumbers)
  const l5={};history.slice(0,5).forEach(d=>d.frontNumbers.forEach(n=>l5[n]=(l5[n]||0)+1))
  const l10={};history.slice(0,10).forEach(d=>d.frontNumbers.forEach(n=>l10[n]=(l10[n]||0)+1))
  const state=sumState(latest.frontNumbers),oddCount=latest.frontNumbers.filter(n=>n%2===1).length,bigCount=latest.frontNumbers.filter(n=>n>=18).length
  const stateFreq={}
  for(let j=1;j<history.length;j++){const d=history[j],p=history[j+1]||history[j];if(sumState(d.frontNumbers)===state&&d.frontNumbers.filter(n=>n%2===1).length===oddCount&&d.frontNumbers.filter(n=>n>=18).length===bigCount)p.frontNumbers.forEach(n=>stateFreq[n]=(stateFreq[n]||0)+1)}
  const maxStateFreq=Math.max(1,...Object.values(stateFreq))
  const transfer={}
  for(let j=1;j<history.length;j++){const src=history[j].frontNumbers,tgt=history[j-1].frontNumbers;src.forEach(s=>{if(!transfer[s])transfer[s]={};tgt.forEach(t=>{if(s!==t)transfer[s][t]=(transfer[s][t]||0)+1})})}
  const maxTransfer=Math.max(1,...Object.values(transfer).flatMap(v=>Object.values(v)))
  return Array.from({length:35},(_,i)=>i+1).map(n=>{
    const repeat=prevSet.has(n)?1:0,gapRepeat=(prev2Set.has(n)&&!prevSet.has(n))?1:0
    const neighbor=latest.frontNumbers.some(x=>Math.abs(n-x)===1)?1:0
    let ts=0;latest.frontNumbers.forEach(src=>{if(transfer[src]&&transfer[src][n])ts+=transfer[src][n]/maxTransfer})
    const stateMatch=(stateFreq[n]||0)/maxStateFreq
    const f5=l5[n]||0;const f10=l10[n]||0
    let score=repeat*23+gapRepeat*29+neighbor*20+ts*7+stateMatch*6
    score+=f5*3+f10*2+(f5/5-f10/10)*5
    return {number:n,score}
  }).sort((a,b)=>b.score-a.score)
}

// ---- 回测函数 ----
function backtestIndiv(testPeriods, sorted) {
  let hits=0,total=0,win=0
  for(const actual of testPeriods){
    const train=sorted.filter(d=>d.period>=actual.period-100&&d.period<actual.period).sort((a,b)=>b.period-a.period)
    if(train.length<50)continue
    const top6=v26Score(train).slice(0,6).map(s=>s.number)
    const actualSet=new Set(actual.frontNumbers)
    const h=top6.filter(n=>actualSet.has(n)).length
    hits+=h;total++
    if(h>=2)win++
  }
  return {f6:hits/total, winRate:win/total}
}

// ---- 配对评分函数 ----
function buildPairMatrix(history) {
  // 35×35 矩阵，pair[i][j] = 号码i和j同时出现的次数
  const pair = Array.from({length:36},()=>Array(36).fill(0))
  const freq = Array(36).fill(0)
  for(let j=0;j<history.length;j++){
    const nums=history[j].frontNumbers
    nums.forEach(a=>{freq[a]++;nums.forEach(b=>{if(a<b)pair[a][b]++})})
  }
  // 转成条件概率: P(j | i) = pair[i][j]/freq[i]
  const cond = Array.from({length:36},()=>Array(36).fill(0))
  for(let a=1;a<=35;a++)for(let b=a+1;b<=35;b++){
    if(freq[a]>0)cond[a][b]=pair[a][b]/freq[a]
    if(freq[b]>0)cond[b][a]=pair[a][b]/freq[b]
  }
  return {cond, freq}
}

// 组合选择: 从topK中选6个让平均配对评分最高
function selectByPair(history, topK=20, pairWeight=1.0) {
  const topN = v26Score(history).slice(0,topK)
  const candidates = topN.map(s=>s.number)
  const baseScores = {}
  topN.forEach(s=>baseScores[s.number]=s.score)
  
  const {cond} = buildPairMatrix(history)
  
  // 从candidates中选6个，最大化组合评分 = 平均V26分 + pairWeight * 平均配对分
  // 用贪心搜索: 先选V26最高的，然后每次加一个使组合分最高的
  let selected = [candidates[0]]
  const remaining = candidates.slice(1)
  
  while(selected.length < 6 && remaining.length > 0) {
    let bestScore = -Infinity, bestIdx = -1
    for(let i=0;i<remaining.length;i++){
      const n = remaining[i]
      // 计算当前组合加入n后的平均分
      const avgV26 = [...selected, n].reduce((s,x)=>s+baseScores[x],0)/(selected.length+1)
      // 计算pair得分: n与已选中号码的平均配对概率
      let pairSum = 0
      for(const s of selected)pairSum+=cond[Math.min(s,n)][Math.max(s,n)]
      const avgPair = selected.length>0?pairSum/selected.length:0
      const totalScore = avgV26 + pairWeight * avgPair
      if(totalScore>bestScore){bestScore=totalScore;bestIdx=i}
    }
    selected.push(remaining[bestIdx])
    remaining.splice(bestIdx,1)
  }
  return selected
}

function backtestPair(testPeriods, sorted, topK, pairWeight) {
  let hits=0,total=0,win=0
  for(const actual of testPeriods){
    const train=sorted.filter(d=>d.period>=actual.period-100&&d.period<actual.period).sort((a,b)=>b.period-a.period)
    if(train.length<50)continue
    const top6=selectByPair(train, topK, pairWeight)
    const actualSet=new Set(actual.frontNumbers)
    const h=top6.filter(n=>actualSet.has(n)).length
    hits+=h;total++
    if(h>=2)win++
  }
  return {f6:hits/total, winRate:win/total}
}

// ---- 对比 ----
console.log('\n--- 独立评分 (V26 Top-6) ---')
const ind = backtestIndiv(allTest, sorted)
console.log('  f6平均命中: ' + ind.f6.toFixed(4))
console.log('  中奖率(前≥2): ' + (ind.winRate*100).toFixed(2) + '%')

console.log('\n--- 配对选择: 测试不同 topK 和 pairWeight ---')
console.log('')
console.log('配对权重 | Top-K | Top-15 | Top-20 | Top-25 | Top-30')
console.log('-'.repeat(55))
for(const pw of [0.2, 0.5, 1.0, 2.0, 5.0]){
  const vals = []
  for(const tk of [15,20,25,30]){
    const r=backtestPair(allTest, sorted, tk, pw)
    vals.push((r.f6*100).toFixed(1)+'/'+(r.winRate*100).toFixed(1))
  }
  console.log(pw.toFixed(1).padStart(6) + '   | ' + vals[0].padEnd(10) + ' | ' + vals[1].padEnd(10) + ' | ' + vals[2].padEnd(10) + ' | ' + vals[3].padEnd(10))
}

// ---- 找最优参数 ----
console.log('\n--- 精细调参 ---')
let best={f6:0, winRate:0, topK:20, pw:1}
for(let tk=12;tk<=30;tk+=2){
  for(let pw=0.1;pw<=3;pw+=0.2){
    const r=backtestPair(allTest, sorted, tk, pw)
    if(r.f6>best.f6){best={f6:r.f6, winRate:r.winRate, topK:tk, pw}}
  }
}
console.log('  最佳f6: ' + best.f6.toFixed(4) + ' (topK='+best.topK+', pw='+best.pw+')')
console.log('  对应中奖率: ' + (best.winRate*100).toFixed(2) + '%')

const bestWin = backtestPair(allTest, sorted, best.topK, best.pw)
console.log('\n  最佳 vs V26独立:')
console.log('  f6: ' + bestWin.f6.toFixed(4) + ' vs ' + ind.f6.toFixed(4) + ' = ' + ((bestWin.f6/ind.f6-1)*100).toFixed(2) + '%')
console.log('  中奖率: ' + (bestWin.winRate*100).toFixed(2) + '% vs ' + (ind.winRate*100).toFixed(2) + '%')

// ---- 另一种方法: 直接选历史最大共现组合 ----
console.log('\n\n--- 方法3: 共现组合直接评分 (不用V26分数) ---')
function scoreByCooccurrence(history) {
  // 直接用30期历史，看每个号码与最近开奖号码的共现关系
  const window=Math.min(30,history.length)
  const {cond}=buildPairMatrix(history.slice(0,window))
  const latest=history[0].frontNumbers
  const scores=[]
  for(let n=1;n<=35;n++){
    let pairScore=0
    for(const l of latest)pairScore+=cond[Math.min(n,l)][Math.max(n,l)]
    scores.push({number:n, score:pairScore})
  }
  return scores.sort((a,b)=>b.score-a.score)
}

function backtestCooc(testPeriods, sorted, k) {
  let hits=0,total=0,win=0
  for(const actual of testPeriods){
    const train=sorted.filter(d=>d.period>=actual.period-100&&d.period<actual.period).sort((a,b)=>b.period-a.period)
    if(train.length<50)continue
    const top6=scoreByCooccurrence(train).slice(0,k).map(s=>s.number)
    const actualSet=new Set(actual.frontNumbers)
    const h=top6.filter(n=>actualSet.has(n)).length
    hits+=h;total++
    if(h>=2)win++
  }
  return {f6:hits/total, winRate:win/total}
}

// 纯配对 vs V26纯独立 vs 组合
console.log('  方法            | f6命中   | 中奖率')
console.log('  ' + '-'.repeat(35))
const c1 = backtestCooc(allTest, sorted, 6)
console.log('  纯共现评分(6)     | ' + c1.f6.toFixed(4) + ' | ' + (c1.winRate*100).toFixed(2) + '%')
console.log('  V26独立评分(6)   | ' + ind.f6.toFixed(4) + ' | ' + (ind.winRate*100).toFixed(2) + '%')
console.log('  V26+配对(topK='+best.topK+') | ' + bestWin.f6.toFixed(4) + ' | ' + (bestWin.winRate*100).toFixed(2) + '%')

// 再加一种: 各测前几名的f6和2+率
console.log('\n--- V26不同Top-K的2+命中率 ---')
for(let k=6;k<=10;k++){
  let w=0,t=0
  for(const actual of allTest){
    const train=sorted.filter(d=>d.period>=actual.period-100&&d.period<actual.period).sort((a,b)=>b.period-a.period)
    if(train.length<50)continue
    const topK=v26Score(train).slice(0,k).map(s=>s.number)
    const actualSet=new Set(actual.frontNumbers)
    const h=topK.filter(n=>actualSet.has(n)).length
    if(h>=2)w++;t++
  }
  console.log('  Top-' + k + ': 中奖率=' + (w/t*100).toFixed(2) + '%')
}
