const fs = require('fs')

const path = '/home/admin/.openclaw/workspace/super-lotto-trend/src/data/lottery.js'
let js = fs.readFileSync(path, 'utf-8')

// 最新两期（从官方公告获取）
const latestDraws = [
  { period: 26071, date: '2026-6-27', day: '六', front: [5, 13, 22, 26, 32], back: [2, 3], prize: 10000000, pool: 844492276, sales: 332658791 },
  { period: 26070, date: '2026-6-24', day: '三', front: [4, 5, 15, 21, 32], back: [2, 11], prize: 10000000, pool: 814894461, sales: 312722588 },
]

// 生成最新两期数据行
let newLines = ''
for (const d of latestDraws) {
  newLines += `  { period: ${d.period}, date: '${d.date}', day: '${d.day}', frontNumbers: [${d.front.join(', ')}], backNumbers: [${d.back.join(', ')}], firstPrize: ${d.prize}, sales: ${d.sales}, pool: ${d.pool} },\n`
}

// 插入到开头的第一行数据前
js = js.replace(
  'export const lotteryData = [\n',
  'export const lotteryData = [\n' + newLines
)

// 更新注释中的最新期号
js = js.replace(
  /最新: \d+/,
  `最新: ${latestDraws[0].period}`
)
js = js.replace(
  /最新期号\d+/,
  `最新期号${latestDraws[0].period}`
)

// 更新 count
const match = js.match(/共 (\d+) 期/)
if (match) {
  const oldCount = parseInt(match[1])
  const newCount = oldCount + latestDraws.length
  js = js.replace(`共 ${oldCount} 期`, `共 ${newCount} 期`)
}

fs.writeFileSync(path, js, 'utf-8')
console.log(`Updated: ${path}`)

// 验证最新几行
const lines = js.split('\n')
const latestLines = lines.filter(l => l.includes('period: 2607') || l.includes('period: 2606'))
console.log('\nLatest entries:')
latestLines.slice(0, 6).forEach(l => console.log(l.trim()))
