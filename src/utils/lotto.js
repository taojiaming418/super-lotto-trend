// 大乐透工具函数

// 计算前区和值
export function frontSum(numbers) {
  return numbers.reduce((a, b) => a + b, 0)
}

// 计算跨度
export function span(numbers) {
  return Math.max(...numbers) - Math.min(...numbers)
}

// 计算AC值（算术复杂度）
export function acValue(numbers) {
  const diffs = new Set()
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      diffs.add(Math.abs(numbers[i] - numbers[j]))
    }
  }
  return diffs.size - (numbers.length - 1)
}

// 奇偶比
export function oddEvenRatio(numbers) {
  const odd = numbers.filter(n => n % 2 !== 0).length
  const even = numbers.length - odd
  return `${odd}:${even}`
}

// 大小比（前区18以上为大）
export function bigSmallRatio(numbers, threshold = 18) {
  const big = numbers.filter(n => n > threshold).length
  const small = numbers.length - big
  return `${big}:${small}`
}

// 质合比
export function primeCompositeRatio(numbers) {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]
  const prime = numbers.filter(n => primes.includes(n)).length
  return `${prime}:${numbers.length - prime}`
}

// 012路比
export function road012Ratio(numbers) {
  const r0 = numbers.filter(n => n % 3 === 0).length
  const r1 = numbers.filter(n => n % 3 === 1).length
  const r2 = numbers.filter(n => n % 3 === 2).length
  return `${r0}:${r1}:${r2}`
}

// 三区比（1-12, 13-24, 25-35）
export function zoneRatio(numbers) {
  const z1 = numbers.filter(n => n >= 1 && n <= 12).length
  const z2 = numbers.filter(n => n >= 13 && n <= 24).length
  const z3 = numbers.filter(n => n >= 25 && n <= 35).length
  return `${z1}:${z2}:${z3}`
}

// 连号对数
export function consecutivePairs(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b)
  let count = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) count++
  }
  return count
}

// 重号（与上一期相同的号码）
export function repeatNumbers(current, previous) {
  return current.filter(n => previous.includes(n)).length
}

// 斜连邻号
export function diagonalNeighbors(current, previous) {
  let count = 0
  for (const n of current) {
    if (previous.includes(n - 1) || previous.includes(n + 1)) count++
  }
  return count
}

// 计算遗漏值
export function calculateOmission(history, number, zone = 'front') {
  const maxNumber = zone === 'front' ? 35 : 12
  const key = zone === 'front' ? 'frontNumbers' : 'backNumbers'
  let omission = 0
  for (const draw of history) {
    if (draw[key].includes(number)) break
    omission++
  }
  return omission
}

// 计算近N期频次
export function calculateFrequency(history, number, n = 30, zone = 'front') {
  const key = zone === 'front' ? 'frontNumbers' : 'backNumbers'
  const recent = history.slice(0, n)
  return recent.filter(d => d[key].includes(number)).length
}

// 和值主区间（18%-82%分位）
export function sumRange(history, n = 50) {
  const recent = history.slice(0, n)
  const sums = recent.map(d => frontSum(d.frontNumbers)).sort((a, b) => a - b)
  const low = sums[Math.floor(sums.length * 0.18)]
  const high = sums[Math.floor(sums.length * 0.82)]
  return { low, high }
}

// 生成号码球HTML类名
export function getBallClass(num, zone) {
  return zone === 'front' ? 'ball-front' : 'ball-back'
}
