const fs = require('fs')
const path = require('path')

const csvPath = '/home/admin/shared-resources/01_用户提供/数据.csv'
const outputPath = '/home/admin/.openclaw/workspace/super-lotto-trend/src/data/lottery.js'

// 读取 CSV（UTF-8）
const text = fs.readFileSync(csvPath, 'utf-8')
const lines = text.split(/\r?\n/).filter(l => l.trim())

let data = []
let skipped = 0

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',')
  if (cols.length < 9) { skipped++; continue }

  const period = parseInt(cols[0])
  if (isNaN(period) || period < 20001) { skipped++; continue }

  const dateStr = cols[1]
  if (!dateStr || dateStr === '-') { skipped++; continue }

  // 前区5个号码
  const front = cols.slice(2, 7).map(Number)
  // 后区2个号码
  const back = cols.slice(7, 9).map(Number)

  if (front.some(isNaN) || back.some(isNaN)) { skipped++; continue }
  if (front.length !== 5 || back.length !== 2) { skipped++; continue }

  // 计算星期
  const parts = dateStr.split('/')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  const days = ['日', '一', '二', '三', '四', '五', '六']

  data.push({
    period,
    date: dateStr.replace(/\//g, '-'),
    day: days[d.getDay()],
    frontNumbers: front,
    backNumbers: back,
  })
}

// 按期号降序（最新在前）
data.sort((a, b) => b.period - a.period)

console.log(`总行数: ${lines.length - 1}`)
console.log(`有效数据: ${data.length} 期`)
console.log(`跳过: ${skipped} 行`)
console.log(`最早: ${data[data.length - 1].period} (${data[data.length - 1].date})`)
console.log(`最新: ${data[0].period} (${data[0].date})`)

// 生成 lottery.js
let js = `// 大乐透历史开奖数据（自动从 CSV 生成）
// 共 ${data.length} 期，最新: ${data[0].period} (${data[0].date})
export const lotteryData = [\n`

for (const row of data) {
  js += `  { period: ${row.period}, date: '${row.date}', day: '${row.day}', frontNumbers: [${row.frontNumbers.join(', ')}], backNumbers: [${row.backNumbers.join(', ')}] },\n`
}

js += `]

export function getLatestDraw() {
  return lotteryData[0]
}

export function getDraws(n = null) {
  if (n) return lotteryData.slice(0, n)
  return lotteryData
}

export function getTotalPeriods() {
  return lotteryData.length
}
`

fs.writeFileSync(outputPath, js, 'utf-8')
console.log(`\n写入完成: ${outputPath}`)
console.log(`文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
