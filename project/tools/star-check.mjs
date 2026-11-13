// 《星穹塔》地图草稿校验：尺寸、字符、实体计数、从入口的连通性（门与假墙视为可通过）
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const MAPS = (await import(pathToFileURL(resolve(process.argv[2] ?? 'src/game/star/maps/floors-01-04.js')).href)).default
const TERR = new Set(['.', '#', '%', 'w', '~', '*', 'y', 'b', 'r', 'a', '^', 'v'])
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]
for (const f of MAPS) {
  const probs = []
  if (f.grid.length !== 11 || f.grid.some((r) => r.length !== 11)) probs.push('尺寸不是 11×11')
  const counts = {}
  f.grid.forEach((r, y) => [...r].forEach((c, x) => {
    if (TERR.has(c)) return
    const id = f.legend[c]
    if (!id) probs.push(`(${x},${y}) 字符 ${c} 无图例`)
    else counts[id] = (counts[id] ?? 0) + 1
  }))
  // 连通性：从入口出发，墙、虚空不可过，熔岩与其余（门、假墙、裂墙、机关门、怪物、NPC）都视为可达
  const seen = new Set([`${f.entry.x},${f.entry.y}`])
  const q = [f.entry]
  while (q.length) {
    const { x, y } = q.shift()
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx > 10 || ny > 10) continue
      const c = f.grid[ny][nx]
      // 按规格 §8.4 第 10 条：裂墙、门、假墙、机关门都视为可达，只有墙与虚空不可过
      if ('#*'.includes(c) || seen.has(`${nx},${ny}`)) continue
      seen.add(`${nx},${ny}`); q.push({ x: nx, y: ny })
    }
  }
  let unreachable = []
  f.grid.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '#' && c !== '*' && !seen.has(`${x},${y}`)) unreachable.push(`${x},${y}${c}`) }))
  if (unreachable.length) probs.push(`不可达格：${unreachable.join(' ')}`)
  const doors = [...f.grid.join('')].reduce((a, c) => ({ ...a, [c]: (a[c] ?? 0) + 1 }), {})
  console.log(`第 ${f.index} 层：${JSON.stringify(counts)} 门 y${doors.y ?? 0} b${doors.b ?? 0} r${doors.r ?? 0}`)
  console.log(probs.length ? '  问题：' + probs.join('；') : '  尺寸/图例/连通 OK')
}
