#!/usr/bin/env node
/**
 * V26+ 新特征权重寻优
 * 7个特征: 重号, 隔期, 邻号, 转移, 状态, 间隔偏离(F7), 和值均衡(F8)
 */
import { lotteryData } from './src/data/lottery.js'

// ===== 预计算 =====
console.log('预计算特征矩阵...')
const sorted = [...lotteryData].sort((a,b)=>a.period-b.period)
const allTest = sorted.slice(100)
const N_TEST = allTest.length
console.log('  测试期: ' + N_TEST)

function sumState(nums) {
  const s = nums.reduce((a,b)=>a+b,0)
  if(s<70)return 1;if(s<85)return 2;if(s<100)return 3;if(s<115)return 4;if(s<130)return 5;return 6
}

// 预计算每个测试期的7个特征值（每个号码35维）
// feat[t][n][f] = 第t个测试期的号码n的特征f的值
const FEATURES = ['重号','隔期','邻号','转移','状态','间隔偏离','和值均衡']
const N_FEAT = FEATURES.length
const feat = Array(N_TEST).fill(null).map(() => Array(35).fill(null).map(() => Array(N_FEAT).fill(0)))
const actualHits = Array(N_TEST).fill(null).map(() => new Array(35).fill(false))

let skipCount = 0
for (let ti = 0; ti < N_TEST; ti++) {
  const actual = allTest[ti]
  const actualSet = new Set(actual.frontNumbers)
  for (const n of actual.frontNumbers) actualHits[ti][n-1] = true
  
  const train = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
  if (train.length < 50) { skipCount++; continue }
  
  const latest = train[0], prev = train[1] || latest
  const prevSet = new Set(latest.frontNumbers), prev2Set = new Set(prev.frontNumbers)
  
  // F5 状态匹配频率
  const state = sumState(latest.frontNumbers)
  const oddCount = latest.frontNumbers.filter(n=>n%2===1).length
  const bigCount = latest.frontNumbers.filter(n=>n>=18).length
  const stateFreq={}
  for(let j=1;j<train.length;j++){
    const d=train[j],p=train[j+1]||train[j]
    if(sumState(d.frontNumbers)===state && d.frontNumbers.filter(n=>n%2===1).length===oddCount && d.frontNumbers.filter(n=>n>=18).length===bigCount)
      p.frontNumbers.forEach(n=>stateFreq[n]=(stateFreq[n]||0)+1)
  }
  const maxStateFreq=Math.max(1,...Object.values(stateFreq))
  
  // F4 转移矩阵
  const transfer={}
  for(let j=1;j<train.length;j++){
    const src=train[j].frontNumbers,tgt=train[j-1].frontNumbers
    src.forEach(s=>{if(!transfer[s])transfer[s]={};tgt.forEach(t=>{if(s!==t)transfer[s][t]=(transfer[s][t]||0)+1})})
  }
  const maxTransfer=Math.max(1,...Object.values(transfer).flatMap(v=>Object.values(v)))
  
  // F7 间隔偏离
  const gaps={},lastAppear={}
  for(let j=0;j<train.length;j++){
    train[j].frontNumbers.forEach(n=>{
      if(lastAppear[n]!==undefined){const g=j-lastAppear[n];if(!gaps[n])gaps[n]=[];gaps[n].push(g)}
      lastAppear[n]=j
    })
  }
  
  // F8 和值均衡
  const lastSum = latest.frontNumbers.reduce((a,b)=>a+b,0)
  let histSum=0; const window=Math.min(50,train.length)
  for(let j=0;j<window;j++) histSum+=train[j].frontNumbers.reduce((a,b)=>a+b,0)
  histSum/=window
  const direction = histSum > lastSum ? 1 : -1
  const deviation = Math.abs(histSum-lastSum)/200
  
  // 频率加成
  const l5={};train.slice(0,5).forEach(d=>d.frontNumbers.forEach(n=>l5[n]=(l5[n]||0)+1))
  const l10={};train.slice(0,10).forEach(d=>d.frontNumbers.forEach(n=>l10[n]=(l10[n]||0)+1))
  
  for (let n=1; n<=35; n++) {
    const idx = n-1
    feat[ti][idx][0] = prevSet.has(n)?1:0  // 重号
    feat[ti][idx][1] = (prev2Set.has(n)&&!prevSet.has(n))?1:0  // 隔期
    feat[ti][idx][2] = latest.frontNumbers.some(x=>Math.abs(n-x)===1)?1:0  // 邻号
    let ts=0; latest.frontNumbers.forEach(src=>{if(transfer[src]&&transfer[src][n])ts+=transfer[src][n]/maxTransfer})
    feat[ti][idx][3] = ts  // 转移
    feat[ti][idx][4] = (stateFreq[n]||0)/maxStateFreq  // 状态
    
    // F7: 间隔偏离
    const avgGap = gaps[n]?gaps[n].reduce((a,b)=>a+b,0)/gaps[n].length:8
    const currGap = lastAppear[n] !== undefined ? lastAppear[n] : train.length
    const ratio = currGap / avgGap
    feat[ti][idx][5] = Math.min(1, ratio/3)  // 间隔偏离 0-1
    
    // F8: 和值均衡
    feat[ti][idx][6] = direction > 0 ? (n>18?deviation:0) : (n<18?deviation:0)  // 和值均衡
    
    // 频率加成单独处理 (不是特征，是固定加分)
    const f5=l5[n]||0; const f10=l10[n]||0
    feat[ti][idx][7] = f5*3 + f10*2 + (f5/5-f10/10)*5  // 固定频率加分
  }
  
  if ((ti+1)%100 === 0) process.stdout.write('  '+(ti+1)+'/'+N_TEST+'\n')
}

console.log('  特征预计算完成!')
if (skipCount > 0) console.log('  跳过: ' + skipCount + ' 期')

// ===== 评估函数 =====
function evaluate(weights) {
  // weights: [w0,w1,w2,w3,w4,w5,w6] = [重号,隔期,邻号,转移,状态,间隔偏离,和值均衡]
  let totalHits = 0, validPeriods = 0
  for (let ti=0; ti<N_TEST; ti++) {
    const actual = allTest[ti]
    const train = sorted.filter(d => d.period >= actual.period - 100 && d.period < actual.period).sort((a,b)=>b.period-a.period)
    if (train.length < 50) continue
    
    // 计算分数
    const scores = []
    for (let n=0; n<35; n++) {
      let score = 0
      for (let f=0; f<7; f++) score += weights[f] * feat[ti][n][f]
      score += feat[ti][n][7]  // 频率加分
      scores.push({num: n+1, score})
    }
    scores.sort((a,b)=>b.score-a.score)
    
    const top6 = scores.slice(0,6)
    let hits = 0
    for (const s of top6) if (actualHits[ti][s.num-1]) hits++
    totalHits += hits
    validPeriods++
  }
  return totalHits / validPeriods
}

// ===== 基线 =====
console.log('\n=== 基线 ===')
const rnd = 6*5/35
console.log('  随机期望: ' + rnd.toFixed(4))

const v26 = evaluate([23,29,20,7,6,0,0])
console.log('  V26 [23,29,20,7,6] = ' + v26.toFixed(4) + ' (vs随机:+' + ((v26/rnd-1)*100).toFixed(2) + '%)')

// ===== 随机搜索 =====
console.log('\n=== 随机搜索 (5000组) ===')
const rng = {seed:42,next(){this.seed=(this.seed*16807)%2147483647;return this.seed}}

// 方案A: V26+F7 (6权重)
let bestA = {w:[23,29,20,7,6,0], f6:0, v:0}
console.log('\n  A: V26 [重号,隔期,邻号,转移,状态,间隔偏离]')
for (let i=0; i<2000; i++) {
  const w = [23+Math.floor(rng.next()%11)-5, 29+Math.floor(rng.next()%11)-5, 20+Math.floor(rng.next()%11)-5, 
             7+Math.floor(rng.next()%11)-5, 6+Math.floor(rng.next()%11)-5, Math.floor(rng.next()%21)+3]
  // 限制范围 1-30
  const ws = w.map(x=>Math.max(1,Math.min(30,x)))
  const f6 = evaluate(ws)
  if (f6 > bestA.f6) { bestA.w = ws; bestA.f6 = f6; bestA.v = f6 }
  if (f6 > v26*1.005) console.log('    ['+ws.join(',')+'] f6='+f6.toFixed(4)+' (+'+((f6/v26-1)*100).toFixed(2)+'%)')
}
console.log('  🏆 A最优: ['+bestA.w.join(',')+'] f6='+bestA.f6.toFixed(4)+' (+'+((bestA.f6/v26-1)*100).toFixed(2)+'%)')

// 方案B: V26+F8 (6权重)
let bestB = {w:[23,29,20,7,6,0], f6:0, v:0}
console.log('\n  B: V26 [重号,隔期,邻号,转移,状态,和值均衡]')
for (let i=0; i<2000; i++) {
  const w = [23+Math.floor(rng.next()%11)-5, 29+Math.floor(rng.next()%11)-5, 20+Math.floor(rng.next()%11)-5,
             7+Math.floor(rng.next()%11)-5, 6+Math.floor(rng.next()%11)-5, Math.floor(rng.next()%21)+3]
  const ws = w.map(x=>Math.max(1,Math.min(30,x)))
  const f6 = evaluate(ws)
  if (f6 > bestB.f6) { bestB.w = ws; bestB.f6 = f6; bestB.v = f6 }
  if (f6 > v26*1.005) console.log('    ['+ws.join(',')+'] f6='+f6.toFixed(4)+' (+'+((f6/v26-1)*100).toFixed(2)+'%)')
}
console.log('  🏆 B最优: ['+bestB.w.join(',')+'] f6='+bestB.f6.toFixed(4)+' (+'+((bestB.f6/v26-1)*100).toFixed(2)+'%)')

// 方案C: V26+F7+F8 (7权重)
let bestC = {w:[23,29,20,7,6,0,0], f6:0, v:0}
console.log('\n  C: V26+ [重号,隔期,邻号,转移,状态,间隔偏离,和值均衡]')
for (let i=0; i<2000; i++) {
  const w = [23+Math.floor(rng.next()%11)-5, 29+Math.floor(rng.next()%11)-5, 20+Math.floor(rng.next()%11)-5,
             7+Math.floor(rng.next()%11)-5, 6+Math.floor(rng.next()%11)-5, Math.floor(rng.next()%21)+3, Math.floor(rng.next()%21)+3]
  const ws = w.map(x=>Math.max(1,Math.min(30,x)))
  const f6 = evaluate(ws)
  if (f6 > bestC.f6) { bestC.w = ws; bestC.f6 = f6; bestC.v = f6 }
  if (f6 > v26*1.005) console.log('    ['+ws.join(',')+'] f6='+f6.toFixed(4)+' (+'+((f6/v26-1)*100).toFixed(2)+'%)')
}
console.log('  🏆 C最优: ['+bestC.w.join(',')+'] f6='+bestC.f6.toFixed(4)+' (+'+((bestC.f6/v26-1)*100).toFixed(2)+'%)')

// ===== 精搜 =====
console.log('\n=== 精搜 ===')
for (const candidate of [bestA, bestB, bestC]) {
  if (candidate.f6 <= v26) continue
  console.log('\n  A/B/C最优 ['+candidate.w.join(',')+'] f6='+candidate.f6.toFixed(4))
  let rw = [...candidate.w], rv = candidate.f6
  for (let it=0; it<8; it++) {
    let improved = false
    for (let d=0; d<rw.length; d++) {
      for (const delta of [-4,-3,-2,-1,1,2,3,4]) {
        const nw = [...rw]; nw[d] = Math.max(1, Math.min(30, nw[d] + delta))
        const f6 = evaluate(nw)
        if (f6 > rv + 0.0003) { rw = nw; rv = f6; improved = true }
      }
    }
    if (improved) console.log('    精搜'+it+': ['+rw.join(',')+'] f6='+rv.toFixed(4)+' (+'+((rv/v26-1)*100).toFixed(2)+'%)')
    else break
  }
}

// ===== 总结 =====
console.log('\n'+'='.repeat(60))
console.log('总结')
console.log('='.repeat(60))
console.log('  随机:         f6=' + rnd.toFixed(4))
console.log('  V26:          f6=' + v26.toFixed(4) + ' (+'+((v26/rnd-1)*100).toFixed(2)+'%)')
if (bestA.f6 > v26) console.log('  A (V26+间隔):  f6=' + bestA.f6.toFixed(4) + ' ['+bestA.w.join(',')+'] (+'+((bestA.f6/v26-1)*100).toFixed(2)+'% vs V26)')
if (bestB.f6 > v26) console.log('  B (V26+和值):  f6=' + bestB.f6.toFixed(4) + ' ['+bestB.w.join(',')+'] (+'+((bestB.f6/v26-1)*100).toFixed(2)+'% vs V26)')
if (bestC.f6 > v26) console.log('  C (V26+全部):  f6=' + bestC.f6.toFixed(4) + ' ['+bestC.w.join(',')+'] (+'+((bestC.f6/v26-1)*100).toFixed(2)+'% vs V26)')
