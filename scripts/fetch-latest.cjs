const fs = require('fs')
const path = require('path')
const https = require('https')

const DATA_DIR = '/home/admin/.openclaw/workspace/super-lotto-trend/src/data'
const LOTTERY_JS = path.join(DATA_DIR, 'lottery.js')

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, r => {
      let d = ''
      r.on('data', c => d += c)
      r.on('end', () => resolve(d))
    }).on('error', reject)
  })
}

// 从开奖公告页面解析号码
function parseNumbers(html) {
  // 清理HTML标签，保留文本
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  
  const numMatch = text.match(/开奖号码[：:]\s*([\d\s]+?)\s*本期/)
  if (!numMatch) {
    // 备选：直接在HTML中找数字序列
    const parts = html.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)[^\d]*(\d+)\s+(\d+)/)
    if (!parts) return null
    return {
      front: parts.slice(1, 6).map(Number),
      back: parts.slice(6).map(Number)
    }
  }
  
  const nums = numMatch[1].trim().split(/\s+/).map(Number)
  if (nums.length < 7) return null
  return {
    front: nums.slice(0, 5),
    back: nums.slice(5, 7)
  }
}

// 从开奖公告页面解析财务数据
function parseFinancial(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  
  const dateMatch = text.match(/开课日期[：:]([^<]+)/)
  const salesMatch = text.match(/销售金额[：:]([\d,]+)/)
  const poolMatch = html.match(/([\d,]+\.?\d*)元奖金滚入下期奖池/)
  const prizeMatch = text.match(/一等奖[\s\S]*?([\d,]+)元/)
  
  return {
    date: dateMatch ? dateMatch[1].trim() : '',
    sales: salesMatch ? parseInt(salesMatch[1].replace(/,/g, '')) : null,
    pool: poolMatch ? parseFloat(poolMatch[1].replace(/,/g, '')) : null,
    prize: prizeMatch ? parseInt(prizeMatch[1].replace(/,/g, '')) : null
  }
}

// 读取现有数据
function readExistingData() {
  const js = fs.readFileSync(LOTTERY_JS, 'utf-8')
  const entries = []
  const regex = /{ period: (\d+), date: '([^']+)', day: '([^']+)', frontNumbers: \[([^\]]+)\], backNumbers: \[([^\]]+)\]([^}]+)}/g
  let match
  while ((match = regex.exec(js)) !== null) {
    const entry = {
      period: parseInt(match[1]),
      date: match[2],
      day: match[3],
      frontNumbers: match[4].split(',').map(Number),
      backNumbers: match[5].split(',').map(Number),
    }
    const extra = match[6]
    const p = extra.match(/firstPrize: (\d+)/)
    const s = extra.match(/sales: (\d+)/)
    const po = extra.match(/pool: ([\d.]+)/)
    if (p) entry.firstPrize = parseInt(p[1])
    if (s) entry.sales = parseInt(s[1])
    if (po) entry.pool = parseFloat(po[1])
    entries.push(entry)
  }
  return entries.sort((a, b) => b.period - a.period)
}

function entriesToJS(entries) {
  let js = `// 大乐透历史开奖数据
// 共 ${entries.length} 期，最新: ${entries[0].period} (${entries[0].date})
export const lotteryData = [\n`
  for (const d of entries) {
    let line = `  { period: ${d.period}, date: '${d.date}', day: '${d.day}', frontNumbers: [${d.frontNumbers.join(', ')}], backNumbers: [${d.backNumbers.join(', ')}]`
    if (d.firstPrize || d.sales || d.pool) {
      if (d.firstPrize) line += `, firstPrize: ${d.firstPrize}`
      if (d.sales) line += `, sales: ${d.sales}`
      if (d.pool) line += `, pool: ${d.pool}`
    }
    line += ' },\n'
    js += line
  }
  js += `]

export function getLatestDraw() { return lotteryData[0] }
export function getDraws(n = null) { return n ? lotteryData.slice(0, n) : lotteryData }
export function getTotalPeriods() { return lotteryData.length }
`
  return js
}

// ====== 主流程 ======
async function main() {
  console.log('=== 大乐透数据自动更新 ===')
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  console.log(`时间: ${now}`)

  // 读取现有数据
  const entries = readExistingData()
  const existingPeriods = new Set(entries.map(e => e.period))
  console.log(`现有: ${entries.length} 期，最新: ${entries[0].period}`)

  // 尝试抓取最新几期（从已知的开奖公告页面）
  const knownPostIds = ['147338', '147253'] // 26071, 26070
  let added = 0
  let updated = 0

  for (const postId of knownPostIds) {
    try {
      const html = await fetch(`https://www.js-lottery.com/cms/post-${postId}.html`)
      const nums = parseNumbers(html)
      if (!nums) { console.log(`  ⚠️ post-${postId}: 解析失败`); continue }
      
      // 从HTML中找出期号
      const periodMatch = html.match(/第(\d+)期/)
      if (!periodMatch) continue
      const period = parseInt(periodMatch[1])
      
      if (existingPeriods.has(period)) {
        // 检查是否需要更新financial数据
        const existing = entries.find(e => e.period === period)
        if (existing && !existing.firstPrize) {
          const fin = parseFinancial(html)
          if (fin.prize) existing.firstPrize = fin.prize
          if (fin.sales) existing.sales = fin.sales
          if (fin.pool) existing.pool = fin.pool
          if (fin.date) existing.date = fin.date
          console.log(`  ✓ post-${postId} (${period}期): 更新financial数据`)
          updated++
        } else {
          console.log(`  - post-${postId} (${period}期): 已存在`)
        }
      } else {
        // 新增
        const fin = parseFinancial(html)
        // 获取星期
        const d = new Date(fin.date)
        const days = ['日', '一', '二', '三', '四', '五', '六']
        entries.push({
          period,
          date: fin.date,
          day: days[d.getDay()],
          frontNumbers: nums.front,
          backNumbers: nums.back,
          firstPrize: fin.prize,
          sales: fin.sales,
          pool: fin.pool,
        })
        console.log(`  + post-${postId} (${period}期): ${nums.front.join(',')} + ${nums.back.join(',')}`)
        added++
      }
    } catch (e) {
      console.log(`  ❌ post-${postId}: ${e.message}`)
    }
  }

  if (added > 0 || updated > 0) {
    entries.sort((a, b) => b.period - a.period)
    fs.writeFileSync(LOTTERY_JS, entriesToJS(entries), 'utf-8')
    console.log(`\n✅ 更新完成! 新增${added}期, 更新${updated}条, 共${entries.length}期`)
  } else {
    console.log(`\n✅ 数据已最新`)
  }
}

main().catch(e => console.error('❌', e.message))
