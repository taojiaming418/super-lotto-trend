const fs = require('fs')
const path = require('path')
const https = require('https')

const DATA_DIR = '/home/admin/.openclaw/workspace/super-lotto-trend/src/data'
const LOTTERY_JS = path.join(DATA_DIR, 'lottery.js')

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = ''
      r.on('data', c => d += c)
      r.on('end', () => resolve(d))
    }).on('error', reject)
  })
}

// 解析网易彩票页面
function parse163Page(html) {
  try {
    // 网易彩票页面里的 JSON 数据是 HTML 编码的 &quot;
    const dec = html.replace(/&quot;/g, '"')

    const deg = dec.match(/"degree":\[0,(\d+)\]/)
    if (!deg) return null
    const period = parseInt(deg[1])

    const red = dec.match(/"red":\[0,"([\d,]+)"\]/)
    if (!red) return null
    const frontNumbers = red[1].split(',').map(Number)

    const blue = dec.match(/"blue":\[0,"([\d,]+)"\]/)
    if (!blue) return null
    const backNumbers = blue[1].split(',').map(Number)

    const dateM = dec.match(/开奖日期:\s*(\d{4}-\d{2}-\d{2})/)
    if (!dateM) return null
    const dateStr = dateM[1]

    const salesM = dec.match(/"sales":\[0,(\d+)\]/)
    const sales = salesM ? parseInt(salesM[1]) : null

    const poolM = dec.match(/"poolMoney":\[0,([\d.]+)\]/)
    const pool = poolM ? parseFloat(poolM[1]) : null

    // 一等奖：取 items 数组第一个 amount
    const itemsIdx = dec.indexOf('"items":[1,[')
    let firstPrize = null
    if (itemsIdx >= 0) {
      const chunk = dec.substring(itemsIdx, itemsIdx + 500)
      const amt = chunk.match(/"amount":\[0,"([\d,]+)"\]/)
      if (amt) firstPrize = parseInt(amt[1].replace(/,/g, ''))
    }

    const d = new Date(dateStr)
    const days = ['日', '一', '二', '三', '四', '五', '六']
    const day = days[d.getDay()]

    return { period, date: dateStr, day, frontNumbers, backNumbers, firstPrize, sales, pool }
  } catch {
    return null
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
  let js = `// 大乐透历史开奖数据（自动从 163 彩票更新）
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

  const entries = readExistingData()
  const existingPeriods = new Set(entries.map(e => e.period))
  console.log(`现有: ${entries.length} 期，最新: ${entries[0].period}`)

  // 从最新一期+1开始往后扫，直到页面不含彩票数据为止
  let period = entries[0].period + 1
  let added = 0

  while (true) {
    const url = `https://sports.163.com/caipiao/lottery/dlt/${period}`
    try {
      const html = await fetch(url)

      const parsed = parse163Page(html)
      if (!parsed) {
        console.log(`  - ${period}期: 未开奖或页面不存在（停止）`)
        break
      }

      if (existingPeriods.has(parsed.period)) {
        console.log(`  - ${parsed.period}期: 已存在（停止）`)
        break
      }

      // 新增
      entries.push(parsed)
      console.log(`  + ${parsed.period}期 (${parsed.date}): [${parsed.frontNumbers.join(',')}] + [${parsed.backNumbers.join(',')}]` +
        (parsed.sales ? ` | 销售:${(parsed.sales / 1e8).toFixed(2)}亿 奖池:${(parsed.pool / 1e8).toFixed(2)}亿` : ''))
      added++
      period++
    } catch (e) {
      console.log(`  ❌ ${period}期: ${e.message}（网络错误，停止）`)
      break
    }
  }

  if (added > 0) {
    entries.sort((a, b) => b.period - a.period)
    fs.writeFileSync(LOTTERY_JS, entriesToJS(entries), 'utf-8')
    console.log(`\n✅ 更新完成! 新增${added}期, 共${entries.length}期`)
  } else {
    console.log(`\n✅ 数据已最新`)
  }
}

main().catch(e => console.error('❌', e.message))
