// 《星穹塔》全塔校验：读取所有分片，检查楼梯链、入口、楼梯四邻无怪、事件的机关门配对。
// 用法：node tools/star-verify.mjs
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const FILES = ['floors-01-04.js', 'floors-05-15.js', 'floors-16-27.js', 'floors-28-39.js', 'floors-29-32.js', 'floors-33-36.js', 'floors-37-39.js', 'floors-40-50.js']
const DIR = new URL('../src/game/star/maps/', import.meta.url)
const TERR = new Set(['.', '#', '%', 'w', '~', '*', 'y', 'b', 'r', 'a', '^', 'v'])
const SPECIAL_NO_DOWN = new Set([1, 26]) // 第 1 层入口在 (5,10)、没有下楼梯；第 26 层是单向层
const EVENT_UP = new Set([10, 20, 30, 40]) // 由 BOSS 击败事件生成上楼梯
const problems = []
const byIndex = new Map()

for (const f of FILES) {
  const path = new URL(f, DIR)
  if (!existsSync(path)) {
    problems.push(`缺少分片文件 ${f}`)
    continue
  }
  const mod = await import(pathToFileURL(path.pathname).href)
  for (const def of mod.default) {
    if (byIndex.has(def.index)) problems.push(`第 ${def.index} 层重复定义`)
    byIndex.set(def.index, def)
  }
}

const at = (def, x, y) => def.grid[y]?.[x]
const monsterAt = (def, x, y) => {
  const c = at(def, x, y)
  return c !== undefined && !TERR.has(c) && def.legend[c] && /^(mossBlob|caveBat|boneSoldier|sporeMage|stoneBeetle|boneGuard|jailer|wardenBoss|tideCrab|cogPuppet|tideWitch|sharkGuard|deepWarrior|ironClam|twinBlade|clawFiend|tideBoss|mirrorShade|echoMage|twinShade|glassGolem|mirrorBoss|slagSoldier|magmaHound|forgeMage|ironKnight|hammerLord|coreGolem|lavaDrake|forgeBoss|stardustWraith|auraPriest|voidBlade|highAuraPriest|astralMage|domeGuard|pillarGuard|endLord)$/.test(def.legend[c])
}

for (let n = 1; n <= 50; n++) {
  const def = byIndex.get(n)
  if (!def) {
    problems.push(`缺少第 ${n} 层`)
    continue
  }
  const ups = []
  const downs = []
  def.grid.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '^') ups.push({ x, y })
    if (c === 'v') downs.push({ x, y })
  }))
  if (def.grid.length !== 11 || def.grid.some((r) => r.length !== 11)) problems.push(`第 ${n} 层尺寸不是 11×11`)
  // 入口必须是空地（或事件生成之前的占位空地）
  if (at(def, def.entry.x, def.entry.y) !== '.') problems.push(`第 ${n} 层入口 (${def.entry.x},${def.entry.y}) 不是空地`)
  // 楼梯四邻不能有怪物
  for (const s of [...ups, ...downs]) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (monsterAt(def, s.x + dx, s.y + dy)) problems.push(`第 ${n} 层楼梯 (${s.x},${s.y}) 四邻有怪物`)
    }
  }
  // 下楼梯：第 1 层没有，第 26 层没有，其余必须有且只有一个
  if (n === 1 && downs.length) problems.push('第 1 层不应有下楼梯')
  if (!SPECIAL_NO_DOWN.has(n) && n !== 1 && downs.length !== 1 && n !== 43) problems.push(`第 ${n} 层下楼梯数量 ${downs.length}，应为 1`)
  if (n === 26 && downs.length) problems.push('第 26 层应没有下楼梯')
  // 上楼梯：第 50 层没有；10/20/30/40 由事件生成（这里允许没有）；43 层两座；44 层没有
  if (n === 50 && ups.length) problems.push('第 50 层不应有上楼梯')
  if (n === 44 && ups.length) problems.push('第 44 层不应有上楼梯')
  if (!EVENT_UP.has(n) && n !== 50 && n !== 44 && ups.length !== (n === 43 ? 2 : 1)) problems.push(`第 ${n} 层上楼梯数量 ${ups.length}`)
  // 事件：每个机关门恰有一条 setTerrain 把它改成空地
  const gates = []
  def.grid.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'a') gates.push(`${x},${y}`) }))
  for (const g of gates) {
    const [gx, gy] = g.split(',').map(Number)
    const opens = (def.events ?? []).filter((e) => e.effects?.some((f) => f.op === 'setTerrain' && f.x === gx && f.y === gy && f.terrain === '.'))
    if (opens.length !== 1) problems.push(`第 ${n} 层机关门 (${g}) 有 ${opens.length} 条开门事件，应为 1`)
  }
}

// 楼梯链：第 n 层的 ^ 与第 n+1 层的 v 同坐标（事件生成的除外）
for (let n = 1; n < 50; n++) {
  const a = byIndex.get(n)
  const b = byIndex.get(n + 1)
  if (!a || !b) continue
  const ups = []
  a.grid.forEach((row, y) => [...row].forEach((c, x) => { if (c === '^') ups.push({ x, y }) }))
  const downs = []
  b.grid.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'v') downs.push({ x, y }) }))
  if (EVENT_UP.has(n) || n === 43) continue
  // 第 26 层是单向层：25 层的 ^ 直接落在 26 层入口，不需要 v
  if (n + 1 === 26) continue
  for (const u of ups) {
    if (!downs.some((d) => d.x === u.x && d.y === u.y)) problems.push(`第 ${n} 层 ^ (${u.x},${u.y}) 在第 ${n + 1} 层没有同坐标的 v`)
  }
}

console.log(problems.length ? `发现 ${problems.length} 个问题：\n  ${problems.join('\n  ')}` : '全塔校验通过（楼梯链、入口、楼梯四邻、机关门配对）')
if (problems.length) process.exitCode = 1
