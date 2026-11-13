// 《星穹塔》全程通关模拟（node tests/star-playthrough.mjs）。
// 依据：魔塔50层新玩法.md §3–§5、§9、§11、§13 第 15–18 条。
// 只读引擎与地图：本脚本不修改 src/ 下任何文件，地图与数值原样使用。
//
// 环境变量（反向检查，§13 第 17 条）：
//   NO_ALTAR=1      禁用祭坛（应在第 20 层之前卡住）
//   DOUBLE_KEYS=1   每把拾取到的钥匙计作两把（通关时剩余生命应明显更高）
//
// ---------------- 贪心机器人策略 ----------------
// 每一步重新规划（不做长期计划），规划在「全塔已到过的楼层」上做一次多层 BFS。
// BFS 状态 = (楼层, x, y, 黄/蓝/红钥匙数)。可通行的格子与实际引擎规则一致：
//   - 墙、虚空、机关门：不可通行；裂墙仅在持有矿镐时可凿；熔岩仅在持有霜核时可清除
//   - 假墙：可撞开（一步），门：有对应钥匙才可开（一步）
//   - 怪物：仅当「预判可打」且 血量 − 损失 ≥ RESERVE(100) 时可通行（打完才能走过）
//   - 道具：可拾取；钥匙拾取后计入 BFS 状态
//   - 楼梯：按引擎同样的规则传送到另一层的落点（含引擎的 ±1 层、坐标邻域匹配）
//   - 罗盘：持有时可跳到任意已到过的楼层入口（不含 44、50，且不在第 50 层使用）
//   - 镜面跃迁器：持有时可跳到中心对称格（空地且无实体）
// 目标按优先级选择：
//   C 祭坛：金币 ≥ 下一次价格时，去档位最高的可达已到祭坛买防御；被「打不动」阻塞时买攻击
//   D 商人：按 §5.2 购买（见 merchantWants）；多余黄钥匙回收
//   A 道具：最近的可达道具（晶石、药水、钥匙、剑盾、特殊道具）
//   B 怪物：可打的怪中损失最小的先打（同损失取最近）；打不动的怪不进入，攻/防提升后自动重新评估（数值门回头）
//   F 炸药：前进路线被「打不动」的怪堵住时，去相邻格引爆（只用于堵路的非 BOSS 怪）
//   E 前进：去往「尚未到过的下一层」的上楼梯；第 50 层则是击败终焉之主
// 钥匙保留：先算出前进路线 E（不保留钥匙），统计其上各色门数 need；A/B 候选只有在抵达时手上的钥匙仍不少于 need 才会被选中。
// 承诺（commit）：选中的道具/怪物在仍可达时保持目标，避免来回摇摆。
// 金币保留：12 层商人的红钥匙（800）未买且没有红钥匙时，祭坛购买不动用这笔钱（§9、§13.18）。
// 药水是拾取即用（§7.1），背包里没有药水，因此没有「血低时主动用药水」一步；
//   蓄能瓶只在前进被「损失/余量」阻塞且金币不够买防御时使用。
// 循环检测：完整状态（不含撤销历史）出现 4 次即判为卡住。
// 卡住时不修改地图与数值，输出诊断（打不动的怪、被阻塞的前进路线、钥匙不足的门）后退出。

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createGame, moveHero, buyAltar, merchantBuy, useItem } from '../src/game/star/engine.js'
import { combat, altarPrice, ALTAR_TIER } from '../src/game/star/rules.js'
import { MONSTERS, KEYS, GEAR, HOLD, ACTIVE, CONSUMABLES, MERCHANTS, LAST_FLOOR } from '../src/game/star/data.js'
import mapsA from '../src/game/star/maps/floors-01-04.js'
import mapsB from '../src/game/star/maps/floors-05-15.js'
import mapsC from '../src/game/star/maps/floors-16-27.js'
import mapsD from '../src/game/star/maps/floors-28-39.js'
import mapsE from '../src/game/star/maps/floors-29-32.js'
import mapsF from '../src/game/star/maps/floors-33-36.js'
import mapsG from '../src/game/star/maps/floors-37-39.js'
import mapsH from '../src/game/star/maps/floors-40-50.js'

/* ---------------- 常量 ---------------- */

const TERR = new Set(['.', '#', '%', 'w', '~', '*', 'y', 'b', 'r', 'a', '^', 'v'])
const NPC_IDS = new Set(['guide', 'merchant', 'altar'])
const DIRS = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]] // 与引擎 DIRS 顺序一致
const DOOR_IDX = { y: 0, b: 1, r: 2 }
const KEY_IDX = { yellowKey: 0, blueKey: 1, redKey: 2 }
const RESERVE = 100 // 机器人的血量余量：打完某只怪后至少保留的生命
const SNAP_FLOORS = [10, 20, 30, 40, 49] // 每 10 层的快照（离开该层时）
const STEP_LIMIT = 200000
const NO_ALTAR = process.env.NO_ALTAR === '1'
const KEY_MULT = process.env.DOUBLE_KEYS === '1' ? 2 : 1
const EXPECT_CRACKS = { 19: 1, 28: 1, 37: 4, 41: 1, 44: 1, 46: 1, 48: 1 } // §8.4 第 9 条、§9

const inB = (x, y) => x >= 0 && y >= 0 && x < 11 && y < 11
const ck = (x, y) => `${x},${y}`
const nk = (f, x, y, k) => `${f},${x},${y},${k[0]},${k[1]},${k[2]}`

/* ---------------- 合并地图（以层号为准） ---------------- */

const SHARDS = [
  ['floors-01-04.js', mapsA],
  ['floors-05-15.js', mapsB],
  ['floors-16-27.js', mapsC],
  ['floors-28-39.js', mapsD],
  ['floors-29-32.js', mapsE],
  ['floors-33-36.js', mapsF],
  ['floors-37-39.js', mapsG],
  ['floors-40-50.js', mapsH],
]
const defs = {}
const mergeErrors = []
for (const [name, list] of SHARDS) {
  for (const d of list) {
    if (defs[d.index]) mergeErrors.push(`第 ${d.index} 层在 ${name} 中重复定义`)
    defs[d.index] = d
  }
}
for (let n = 1; n <= LAST_FLOOR; n++) if (!defs[n]) mergeErrors.push(`缺少第 ${n} 层`)
if (process.env.DIAG_OLD_G5 === '1') {
  const g = defs[5].grid.map((r) => [...r])
  g[0][6] = '.'
  g[5][9] = 'G'
  defs[5] = { ...defs[5], grid: g.map((r) => r.join('')) }
}
if (mergeErrors.length) {
  for (const m of mergeErrors) console.log(`[合并错误] ${m}`)
  process.exit(1)
}

/* ---------------- 数据检查（不修改地图，只报告） ---------------- */

function idKnown(id) {
  return !!(MONSTERS[id] || CONSUMABLES[id] || KEYS[id] || GEAR[id] || HOLD[id] || ACTIVE[id] || NPC_IDS.has(id))
}

function stairCells(d, dir) {
  const ch = dir === 'up' ? '^' : 'v'
  const out = []
  d.grid.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push({ x, y }) }))
  for (const e of d.events ?? []) {
    for (const f of e.effects) if (f.op === 'addStair' && f.dir === dir) out.push({ x: f.x, y: f.y })
  }
  return out
}

const near = (cells, x, y) => cells.some((c) => Math.abs(c.x - x) + Math.abs(c.y - y) <= 1)

/** 连通性（§13 第 15 条的前置检查）：假设所有钥匙、道具、机关门都可用，怪物可穿过，NPC 视为墙；只看结构性断路 */
function upStairReachable(d, targets) {
  const seen = new Set([ck(d.entry.x, d.entry.y)])
  const q = [[d.entry.x, d.entry.y]]
  const cells = d.grid.map((row) => [...row])
  const legendAt = (x, y) => d.legend[cells[y][x]]
  while (q.length) {
    const [x, y] = q.shift()
    if (targets.some((t) => t.x === x && t.y === y)) return true
    if (d.index === 24) { // 规格 §9：24 层左右两半只能靠镜面跃迁器互通，此处假设已拿到
      const mx = 10 - x
      const my = 10 - y
      if (cells[my][mx] === '.' && !seen.has(ck(mx, my))) { seen.add(ck(mx, my)); q.push([mx, my]) }
    }
    for (const [, dx, dy] of DIRS) {
      const nx = x + dx
      const ny = y + dy
      if (!inB(nx, ny) || seen.has(ck(nx, ny))) continue
      const c = cells[ny][nx]
      if (c === '#' || c === '*') continue // 假设已拿到全部道具（矿镐、霜核）且机关门已开
      if (!TERR.has(c) && NPC_IDS.has(legendAt(nx, ny))) continue
      seen.add(ck(nx, ny))
      q.push([nx, ny])
    }
  }
  return false
}

function checkData() {
  const issues = []
  const cracks = {}
  let grantsCompass = false
  for (let n = 1; n <= LAST_FLOOR; n++) {
    const d = defs[n]
    if (d.index !== n) issues.push(`第 ${n} 层 index 字段为 ${d.index}`)
    if (d.grid.length !== 11) issues.push(`第 ${n} 层共 ${d.grid.length} 行（应为 11）`)
    d.grid.forEach((row, y) => {
      if ([...row].length !== 11) issues.push(`第 ${n} 层第 ${y} 行长 ${[...row].length}（应为 11）`)
    })
    const at = (x, y) => (inB(x, y) ? d.grid[y]?.[x] : undefined)
    d.grid.forEach((row, y) => [...row].forEach((c, x) => {
      if (!TERR.has(c)) {
        const id = d.legend[c]
        if (!id) issues.push(`第 ${n} 层 (${x},${y}) 字符 "${c}" 没有图例`)
        else if (!idKnown(id)) issues.push(`第 ${n} 层图例 "${c}" 对应未知 id "${id}"`)
      }
      if (c === '%') cracks[n] = (cracks[n] ?? 0) + 1
      if (c === 'a') {
        const opened = (d.events ?? []).some((e) => e.effects.some((f) => f.op === 'setTerrain' && f.x === x && f.y === y && f.terrain === '.'))
        if (!opened) issues.push(`第 ${n} 层机关门 (${x},${y}) 没有任何事件把它改为空地`)
      }
    }))
    if (!inB(d.entry.x, d.entry.y) || at(d.entry.x, d.entry.y) !== '.' || d.legend[at(d.entry.x, d.entry.y)]) {
      issues.push(`第 ${n} 层入口 (${d.entry.x},${d.entry.y}) 不是空地`)
    }
    for (const e of d.events ?? []) {
      const t = e.trigger
      if (t.op === 'allDefeated' || t.op === 'defeated') {
        const pts = Array.isArray(t.at) ? t.at : [t.at]
        for (const p of pts) {
          const c = at(p.x, p.y)
          const id = c ? d.legend[c] : undefined
          if (!id || !MONSTERS[id]) issues.push(`第 ${n} 层事件 ${e.id}：触发坐标 (${p.x},${p.y}) 上没有怪物（当前为 "${c ?? '越界'}"）`)
        }
      }
      for (const f of e.effects) {
        if (f.op === 'grantItem' && f.id === 'compass') grantsCompass = true
      }
    }
    if (Object.values(d.legend).includes('compass')) grantsCompass = true
    if (n < LAST_FLOOR) {
      const ups = stairCells(d, 'up')
      if (ups.length && !upStairReachable(d, ups)) {
        issues.push(`第 ${n} 层：从入口 (${d.entry.x},${d.entry.y}) 无法走到任何上楼梯（忽略钥匙与怪物，NPC 视为墙），上楼梯位于 ${ups.map((u) => `(${u.x},${u.y})`).join('、')}`)
      }
    }
    // 楼梯对：上楼梯的落点楼层必须在邻域内有对应的下楼梯（引擎只支持 ±1 层）
    if (n < LAST_FLOOR) {
      for (const s of stairCells(d, 'up')) {
        if (!near(stairCells(defs[n + 1], 'down'), s.x, s.y)) {
          const note = n === 43 ? '（规格 §8.4：43 层明处的上楼梯应通往第 45 层）' : ''
          issues.push(`第 ${n} 层上楼梯 (${s.x},${s.y}) 在引擎中通往第 ${n + 1} 层，但该层邻域没有下楼梯；引擎 engine.js 的 step() 在此回退分支会抛 TypeError（return 处读取 cp.floor）${note}`)
        }
      }
    }
    if (n > 1) {
      for (const s of stairCells(d, 'down')) {
        if (!near(stairCells(defs[n - 1], 'up'), s.x, s.y)) {
          const note = n === 45 ? '（规格 §8.4：45 层下楼梯应通往第 43 层）' : ''
          issues.push(`第 ${n} 层下楼梯 (${s.x},${s.y}) 在引擎中通往第 ${n - 1} 层，但该层邻域没有上楼梯；引擎 step() 在此回退分支会抛 TypeError${note}`)
        }
      }
    }
  }
  if (!grantsCompass) issues.push('全塔没有罗盘来源（规格 §10：第 3 层引路人对话应授予传送罗盘；第 3 层事件列表为空）')
  const crackFloors = new Set([...Object.keys(cracks), ...Object.keys(EXPECT_CRACKS)].map(Number))
  const crackTotal = Object.values(cracks).reduce((a, b) => a + b, 0)
  for (const n of [...crackFloors].sort((a, b) => a - b)) {
    if ((cracks[n] ?? 0) !== (EXPECT_CRACKS[n] ?? 0)) {
      issues.push(`裂墙数量：第 ${n} 层 实际 ${cracks[n] ?? 0} 处，规格 ${EXPECT_CRACKS[n] ?? 0} 处`)
    }
  }
  issues.push(`（信息）全塔裂墙合计 ${crackTotal} 处，规格 §8.4 为 10 处`)
  return issues
}

/* 规格 §9 的晶石、药水、钥匙、门、怪物数量：运行时从 魔塔50层新玩法.md 的 §9 表解析（不手抄） */
const SPEC_MD = readFileSync(new URL('../魔塔50层新玩法.md', import.meta.url), 'utf8')

function parseSpec9(text) {
  const a = text.indexOf('## 9. 五十层蓝图')
  const b = text.indexOf('### 分区钥匙收支')
  const rows = {}
  for (const line of text.slice(a, b).split('\n')) {
    const c = line.split('|').map((s) => s.trim())
    if (c.length < 10 || !/^\d+$/.test(c[1])) continue
    const [r1, b1] = c[5].split('/').map(Number)
    const [rp, bp] = c[6].split('/').map(Number)
    const [ky, kb, kr] = c[7].split('/').map(Number)
    const [dy, db, dr] = c[8].split('/').map(Number)
    const mons = {}
    for (const part of c[4].split('、')) {
      const m = part.match(/^(.+?)×(\d+)$/)
      if (m) mons[m[1]] = Number(m[2])
    }
    rows[Number(c[1])] = { vec: [r1, b1, rp, bp, ky, kb, kr, dy, db, dr], mons }
  }
  return rows
}

const SPEC9 = parseSpec9(SPEC_MD)
// 规格 §9 表注「不计入上表」的小库，按其注释补入期望值（字段索引 → 增量）
const SPEC9_LIBRARY = { 18: { 4: 4, 3: 3 }, 25: { 4: 2, 3: 2 }, 37: { 4: 6, 5: 2 }, 48: { 3: 2, 5: 1 } }
const FIELD_NAMES = ['红晶', '蓝晶', '红药', '蓝药', '黄钥', '蓝钥', '红钥', '黄门', '蓝门', '红门']

// 数据指纹：8 个地图分片 + 规格文件。运行开始与结束各算一次，若不一致说明运行期间数据被改动
const MAP_NAMES = ['floors-01-04.js', 'floors-05-15.js', 'floors-16-27.js', 'floors-28-39.js', 'floors-29-32.js', 'floors-33-36.js', 'floors-37-39.js', 'floors-40-50.js']
function dataHash() {
  const h = createHash('sha1')
  for (const name of MAP_NAMES) h.update(readFileSync(new URL(`../src/game/star/maps/${name}`, import.meta.url)))
  h.update(SPEC_MD)
  return h.digest('hex').slice(0, 12)
}
const DATA_HASH_START = dataHash()

function countsCheck() {
  const out = []
  if (Object.keys(SPEC9).length !== LAST_FLOOR) out.push(`§9 表解析只得到 ${Object.keys(SPEC9).length} 层（应为 50）`)
  const idx = { redCrystal: 0, blueCrystal: 1, redPotion: 2, bluePotion: 3, yellowKey: 4, blueKey: 5, redKey: 6 }
  for (let n = 1; n <= LAST_FLOOR; n++) {
    const d = defs[n]
    const spec = SPEC9[n]
    if (!spec) continue
    const c = new Array(10).fill(0)
    const mon = {}
    d.grid.forEach((row) => [...row].forEach((ch) => {
      if (TERR.has(ch)) {
        if (ch === 'y') c[7]++
        if (ch === 'b') c[8]++
        if (ch === 'r') c[9]++
      } else {
        const id = d.legend[ch]
        if (id in idx) c[idx[id]]++
        if (MONSTERS[id]) mon[MONSTERS[id].name] = (mon[MONSTERS[id].name] ?? 0) + 1
      }
    }))
    for (const e of d.events ?? []) for (const f of e.effects) if (f.op === 'spawnItem' && f.id in idx) c[idx[f.id]]++
    const exp = [...spec.vec]
    for (const [i, add] of Object.entries(SPEC9_LIBRARY[n] ?? {})) exp[Number(i)] += add
    const diffs = []
    exp.forEach((v, i) => { if (v !== c[i]) diffs.push(`${FIELD_NAMES[i]} 实际 ${c[i]} 规格 ${v}`) })
    for (const name of new Set([...Object.keys(spec.mons), ...Object.keys(mon)])) {
      const want = spec.mons[name] ?? 0
      const got = mon[name] ?? 0
      if (want !== got) diffs.push(`${name} 实际 ${got} 规格 ${want}`)
    }
    if (diffs.length) out.push(`第 ${n} 层：${diffs.join('；')}`)
  }
  return out
}

/* ---------------- 视图（与引擎一致；未访问楼层用地图定义临时还原） ---------------- */

const viewCache = new Map()
function view(state, f) {
  if (state.world[f]) return state.world[f]
  if (!viewCache.has(f)) {
    const def = defs[f]
    const terr = def.grid.map((row) => [...row].map((c) => (TERR.has(c) ? c : '.')))
    const ents = {}
    def.grid.forEach((row, y) => [...row].forEach((c, x) => {
      if (TERR.has(c)) return
      const id = def.legend[c]
      const kind = MONSTERS[id] ? 'monster' : NPC_IDS.has(id) ? 'npc' : 'item'
      ents[ck(x, y)] = { kind, id }
    }))
    viewCache.set(f, { terr, ents })
  }
  return viewCache.get(f)
}

/** 与引擎 counterpart() + landing() 相同的楼梯规则；返回 null 表示引擎会报错 */
function stairDest(state, f, dir, x, y) {
  const t = dir === 'up' ? f + 1 : f - 1
  if (t < 1 || t > LAST_FLOOR) return null
  const want = dir === 'up' ? 'v' : '^'
  const w = view(state, t)
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const cx = x + dx
    const cy = y + dy
    if (inB(cx, cy) && w.terr[cy][cx] === want) {
      for (const [, ax, ay] of DIRS) {
        const lx = cx + ax
        const ly = cy + ay
        if (inB(lx, ly) && w.terr[ly][lx] === '.' && !w.ents[ck(lx, ly)]) return { floor: t, x: lx, y: ly }
      }
      return null
    }
  }
  const e = defs[t].entry // 引擎的回退：落到目标层入口
  return { floor: t, x: e.x, y: e.y }
}

function pillarCount(state) {
  return Object.values(view(state, 49).ents).filter((e) => e.id === 'pillarGuard').length
}

function evalMon(state, id, pillars) {
  return combat(state.hero, MONSTERS[id], { pillarsAlive: id === 'endLord' ? pillars : 0 })
}

/** strict：正常可打（预判可打且留有余量）；piercing：只要不是「打不动」；any：全部视为可通行 */
function accepts(mode, r, hp) {
  if (mode === 'strict') return r.canFight && hp - r.loss >= RESERVE
  if (mode === 'piercing') return r.reason !== 'unpierceable'
  return true
}

/* ---------------- 商人策略（§5.2） ---------------- */

function merchantWants(state, shop) {
  if (!shop.unlimited && state.soldOut.includes(shop.id)) return false
  const h = state.hero
  const g = h.gold
  const ys = h.keys.yellowKey
  const bs = h.keys.blueKey
  const rs = h.keys.redKey
  switch (shop.id) {
    case 'm6a': return g >= 30 && ys < 5
    case 'm12a': return g >= 800 && rs < 2
    case 'm15a': return g >= 150 && bs < 2
    case 'm27a': return g >= 300 && bs < 2
    case 'm27b': return ys > 3
    case 'm31a': return g >= 800 && ys < 3
    case 'm38a': return g >= 400 && ys < 3
    case 'm45a': return g >= 1000
    case 'm47a': return g >= 1500 && (state.items.bomb ?? 0) < 1
    default: return false
  }
}

/* ---------------- 多层 BFS ---------------- */

/**
 * mode: 'strict' | 'piercing' | 'any'；reserve: [黄,蓝,红] 保留的钥匙数；opts.wantE: 记录前进目标 E。
 * 返回 { nodes, start, eNode, firstStep(node) }；节点 act: 'move'(含 dir) | 'mirror' | 'compass'(含 to)。
 */
function search(state, mode, reserve, opts = {}) {
  const hp = state.hero.hp
  const pillars = pillarCount(state)
  const memo = new Map()
  const evalCached = (id) => {
    if (!memo.has(id)) memo.set(id, evalMon(state, id, pillars))
    return memo.get(id)
  }
  const k0 = [state.hero.keys.yellowKey, state.hero.keys.blueKey, state.hero.keys.redKey]
  const start = { key: nk(state.floor, state.hero.x, state.hero.y, k0), f: state.floor, x: state.hero.x, y: state.hero.y, k: k0, d: 0, parent: null, act: null }
  const nodes = new Map([[start.key, start]])
  const q = [start]
  const maxF = Math.max(...state.visited)
  let eNode = null
  // 支配剪枝：同一格若已以不少于当前钥匙数到达过（距离不更远），则丢弃本节点
  const dom = new Map([[`${start.f},${start.x},${start.y}`, [k0]]])
  const add = (node) => {
    if (nodes.has(node.key)) return
    const ce = `${node.f},${node.x},${node.y}`
    const list = dom.get(ce) ?? []
    if (list.some((w) => w[0] >= node.k[0] && w[1] >= node.k[1] && w[2] >= node.k[2])) return
    list.push(node.k)
    dom.set(ce, list)
    nodes.set(node.key, node)
    q.push(node)
  }
  // 同一条路线上同一格的钥匙只能拾取一次（否则来回走会无限加钥匙）
  const pickedOnPath = (u, x, y) => {
    let c = u
    while (c) {
      if (c.f === u.f && c.x === x && c.y === y) return true
      c = c.parent ? nodes.get(c.parent) : null
    }
    return false
  }

  for (let qi = 0; qi < q.length; qi++) {
    const u = q[qi]
    const v = view(state, u.f)
    for (const [dname, dx, dy] of DIRS) {
      const x = u.x + dx
      const y = u.y + dy
      if (!inB(x, y)) continue
      const t = v.terr[y][x]
      const e = v.ents[ck(x, y)]
      if (t === '#' || t === '*' || t === 'a') continue
      if (t === '%' && !(state.items.pickaxe > 0)) continue
      if (t === '~' && !(state.items.frostCore > 0)) continue
      let nf = u.f
      let nx = x
      let ny = y
      let k = u.k
      if (t in DOOR_IDX) {
        const i = DOOR_IDX[t]
        if (u.k[i] - reserve[i] < 1) continue
        k = k.slice()
        k[i] -= 1
      } else if (t === '^' || t === 'v') {
        const dest = stairDest(state, u.f, t === '^' ? 'up' : 'down', x, y)
        if (!dest) continue
        // 前进目标 E 只记录第一次出现的那一步；这一步本身仍是普通移动（楼梯照常传送）
        if (t === '^' && opts.wantE && dest.floor === maxF + 1 && !eNode) {
          eNode = { key: 'E', f: u.f, x, y, k: u.k, d: u.d + 1, parent: u.key, act: 'move', dir: dname }
          nodes.set('E', eNode)
        }
        nf = dest.floor
        nx = dest.x
        ny = dest.y
      } else if (e && e.kind === 'monster') {
        const r = evalCached(e.id)
        if (!accepts(mode, r, hp)) continue
        if (e.id === 'endLord' && opts.wantE && !eNode) {
          eNode = { key: 'E', f: u.f, x, y, k: u.k, d: u.d + 1, parent: u.key, act: 'move', dir: dname }
          nodes.set('E', eNode)
        }
      } else if (e && e.kind === 'npc') {
        continue
      } else if (e && e.kind === 'item' && KEY_IDX[e.id] !== undefined && !pickedOnPath(u, x, y)) {
        k = k.slice()
        k[KEY_IDX[e.id]] += KEY_MULT
      }
      add({ key: nk(nf, nx, ny, k), f: nf, x: nx, y: ny, k, d: u.d + 1, parent: u.key, act: 'move', dir: dname })
    }
    if (state.items.mirrorJump > 0) {
      const mx = 10 - u.x
      const my = 10 - u.y
      if (v.terr[my][mx] === '.' && !v.ents[ck(mx, my)]) {
        add({ key: nk(u.f, mx, my, u.k), f: u.f, x: mx, y: my, k: u.k, d: u.d + 1, parent: u.key, act: 'mirror' })
      }
    }
    if (state.items.compass > 0 && u.f !== LAST_FLOOR) {
      for (const g of state.visited) {
        if (g === u.f || g === 44 || g === LAST_FLOOR) continue
        const en = defs[g].entry
        add({ key: nk(g, en.x, en.y, u.k), f: g, x: en.x, y: en.y, k: u.k, d: u.d + 1, parent: u.key, act: 'compass', to: g })
      }
    }
  }
  const firstStep = (node) => {
    let cur = node
    while (cur.parent !== start.key) cur = nodes.get(cur.parent)
    return cur
  }
  return { nodes, start, eNode, firstStep }
}

/** 路线上每种颜色的门数（用于保留钥匙） */
function doorsOn(state, S, node) {
  const need = [0, 0, 0]
  let cur = node
  while (cur && cur.parent) {
    const p = S.nodes.get(cur.parent)
    if (cur.act === 'move' && cur.f === p.f) {
      const t = view(state, p.f).terr[cur.y][cur.x]
      if (t in DOOR_IDX) need[DOOR_IDX[t]]++
    }
    cur = p
  }
  return need
}

/* ---------------- 诊断（只在卡住时输出） ---------------- */

function diagnose(state, R0, blockedLoss, blockedUnpierce) {
  const h = state.hero
  const lines = []
  const maxF = Math.max(...state.visited)
  lines.push(`位置：第 ${state.floor} 层 (${h.x},${h.y})；hp ${h.hp} 攻 ${h.atk} 防 ${h.def} 金 ${h.gold}；钥匙 黄${h.keys.yellowKey} 蓝${h.keys.blueKey} 红${h.keys.redKey}；祭坛 ${state.altarBuys} 次；道具 ${JSON.stringify(state.items)}`)
  lines.push(`已到过的楼层：${[...state.visited].sort((a, b) => a - b).join(',')}；最高层 ${maxF}`)
  const why = R0.eNode
    ? '可达（但没有其它目标）'
    : blockedLoss
      ? '被「会死或余量不足」的怪阻塞'
      : blockedUnpierce
        ? '被「打不动」（攻 ≤ 防）的怪阻塞'
        : '不可达：墙、门、钥匙不足，或缺少通往下一层的楼梯'
  lines.push(`前进目标（${maxF === LAST_FLOOR ? '击败终焉之主' : `通往第 ${maxF + 1} 层的上楼梯`}）：${why}`)
  const mons = []
  for (const f of [...state.visited].sort((a, b) => a - b)) {
    const w = view(state, f)
    for (const [key, e] of Object.entries(w.ents)) {
      if (e.kind !== 'monster') continue
      const [x, y] = key.split(',').map(Number)
      const r = evalMon(state, e.id, pillarCount(state))
      const label = r.reason === 'unpierceable'
        ? `打不动（有效攻击 ${r.perHit}，攻 ≤ 防）`
        : !r.canFight
          ? `会死（损失 ${r.loss} ≥ 当前血量）`
          : r.loss > h.hp - RESERVE
            ? `余量不足（损失 ${r.loss}，打完仅剩 ${h.hp - r.loss}）`
            : `可打（损失 ${r.loss}）`
      mons.push(`  第 ${f} 层 (${x},${y}) ${MONSTERS[e.id].name} ${label}`)
    }
  }
  lines.push(`剩余怪物（已访问楼层）${mons.length} 只：`)
  lines.push(...mons.slice(0, 30))
  if (mons.length > 30) lines.push(`  …其余 ${mons.length - 30} 只省略`)
  return lines.join('\n')
}

/* ---------------- 主循环 ---------------- */

const snap = (s) => ({
  floor: s.floor,
  hp: s.hero.hp,
  atk: s.hero.atk,
  def: s.hero.def,
  gold: s.hero.gold,
  keys: [s.hero.keys.yellowKey, s.hero.keys.blueKey, s.hero.keys.redKey],
  altar: s.altarBuys,
  items: { ...s.items },
  flags: { ...s.hero.flags },
})

/** 引路人对话：该层还有未触发、且会授予道具的对话事件（如第 3 层授予罗盘） */
function guideWanted(state, f) {
  return (defs[f].events ?? []).some((ev) => ev.trigger.op === 'talked' && ev.trigger.npc === 'guide' && !state.firedEvents.includes(ev.id) && ev.effects.some((e) => e.op === 'grantItem'))
}

/** 与相邻的引路人对话（进入其格子即对话，不移动） */
function talkAdjacentGuide(state) {
  for (const [name] of DIRS) {
    const [, dx, dy] = DIRS.find(([n]) => n === name)
    const e = view(state, state.floor).ents[ck(state.hero.x + dx, state.hero.y + dy)]
    if (e?.id === 'guide') return moveHero(state, defs, name)
  }
  return [{ type: 'blocked', reason: '相邻没有引路人' }]
}

function planStep(state, bad, commit) {
  const price = altarPrice(state.altarBuys + 1)
  const gold = state.hero.gold
  const ZERO = [0, 0, 0]
  const R0 = search(state, 'strict', ZERO, { wantE: true })
  // 钥匙保留：主路（到 E）上每色门数为 need；A/B 候选抵达时手上的钥匙必须仍够 need。
  // 不在 BFS 里直接扣减保留，否则支路门后面的钥匙（可以补回来的）会被误判为不可取。
  let need = ZERO
  if (R0.eNode) need = doorsOn(state, R0, R0.eNode)
  const R1 = R0
  const keysOk = (n) => n.k[0] >= need[0] && n.k[1] >= need[1] && n.k[2] >= need[2]
  // 承诺：上一步选定的道具/怪物仍在且可达时继续去那里，避免 keysOk 边界处来回摇摆
  if (commit.cur) {
    const { kind, f, x, y } = commit.cur
    const e = view(state, f).ents[ck(x, y)]
    const alive = e && ((kind === 'A' && e.kind === 'item') || (kind === 'B' && e.kind === 'monster'))
    if (alive) {
      let best = null
      for (const n of R0.nodes.values()) {
        if (n.f === f && n.x === x && n.y === y && n.d > 0 && (!best || n.d < best.d)) best = n
      }
      if (best) return { kind, n: best, search: R0 }
    }
    commit.cur = null
  }

  let blockedLoss = false
  let blockedUnpierce = false
  if (!R0.eNode) {
    if (search(state, 'piercing', ZERO, { wantE: true }).eNode) blockedLoss = true
    else if (search(state, 'any', ZERO, { wantE: true }).eNode) blockedUnpierce = true
  }
  if (blockedLoss && state.items.flask > 0 && gold < price) return { kind: 'flask' }

  // 金币留给 12 层商人的红钥匙（800，§9 / §13.18）：未买且没有红钥匙时，祭坛购买不得动用这笔钱
  const reserveGold = !state.soldOut.includes('m12a') && state.hero.keys.redKey < 1 ? 800 : 0
  const bombOK = blockedUnpierce && state.items.bomb > 0
  const pillars = pillarCount(state)
  const C = []
  const D = []
  const A = []
  const B = []
  const F = []
  const T = []
  for (const n of R1.nodes.values()) {
    if (n.key === 'E') continue
    const v = view(state, n.f)
    if (n.d > 0 && n.act === 'move') {
      const e = v.ents[ck(n.x, n.y)]
      if (e?.kind === 'item' && keysOk(n)) A.push({ n, pri: n.d })
      else if (e?.kind === 'monster' && keysOk(n)) B.push({ n, pri: n.d, loss: evalMon(state, e.id, pillars).loss })
    }
    let altar = false
    let shop = null
    let bomb = false
    let guide = false
    for (const [, dx, dy] of DIRS) {
      const e = v.ents[ck(n.x + dx, n.y + dy)]
      if (!e) continue
      if (e.id === 'guide' && guideWanted(state, n.f)) guide = true
      if (e.id === 'altar' && !NO_ALTAR && ALTAR_TIER[n.f] && state.visited.includes(n.f) && gold - price >= reserveGold) altar = true
      if (e.id === 'merchant' && !shop) {
        const s = (MERCHANTS[n.f] ?? []).find((m) => merchantWants(state, m))
        if (s) shop = s.id
      }
      if (bombOK && e.kind === 'monster' && !MONSTERS[e.id].boss && evalMon(state, e.id, pillars).reason === 'unpierceable') bomb = true
    }
    if (altar) C.push({ n, pri: n.d, tier: ALTAR_TIER[n.f] })
    if (shop) D.push({ n, pri: n.d, shop })
    if (bomb) F.push({ n, pri: n.d })
    if (guide) T.push({ n, pri: n.d })
  }
  const ok = (kind, c) => !bad.has(`${kind}|${c.n.f},${c.n.x},${c.n.y}`)
  const byPri = (a, b) => a.pri < b.pri
  const pick = (arr, better) => {
    let best = null
    for (const c of arr) if (!best || better(c, best)) best = c
    return best
  }
  const needAtk = blockedUnpierce
  commit.cur = null
  const cT = pick(T.filter((c) => ok('T', c)), byPri)
  if (cT) return { kind: 'T', n: cT.n, search: R1 }
  const cD = pick(D.filter((c) => ok('D', c)), byPri)
  if (cD) return { kind: 'D', n: cD.n, search: R1, shop: cD.shop }
  const cC = pick(C.filter((c) => ok('C', c)), (a, b) => a.tier > b.tier || (a.tier === b.tier && a.pri < b.pri))
  if (cC) return { kind: 'C', n: cC.n, search: R1, needAtk }
  const cA = pick(A.filter((c) => ok('A', c)), byPri)
  if (cA) {
    commit.cur = { kind: 'A', f: cA.n.f, x: cA.n.x, y: cA.n.y }
    return { kind: 'A', n: cA.n, search: R1 }
  }
  const cB = pick(B.filter((c) => ok('B', c)), (a, b) => a.loss < b.loss || (a.loss === b.loss && a.pri < b.pri))
  if (cB) {
    commit.cur = { kind: 'B', f: cB.n.f, x: cB.n.x, y: cB.n.y }
    return { kind: 'B', n: cB.n, search: R1 }
  }
  const cF = pick(F.filter((c) => ok('F', c)), byPri)
  if (cF) return { kind: 'F', n: cF.n, search: R1 }
  if (R0.eNode) return { kind: 'E', n: R0.eNode, search: R0 }
  return { kind: null, diag: diagnose(state, R0, blockedLoss, blockedUnpierce) }
}

/** 引擎异常记录（引擎缺陷，不修改引擎；异常时状态已部分变更，按变更后的状态继续） */
const engineErrors = []

function guarded(state, fn) {
  const floorBefore = state.floor
  const pos = `${state.hero.x},${state.hero.y}`
  try {
    return fn()
  } catch (err) {
    engineErrors.push({ floor: floorBefore, pos, message: String(err.message ?? err), floorAfter: state.floor })
    return [{ type: 'engine-error' }]
  }
}

function execStep(state, s) {
  if (s.act === 'mirror') return useItem(state, defs, 'mirrorJump')
  if (s.act === 'compass') return useItem(state, defs, 'compass', s.to)
  const [, dx, dy] = DIRS.find(([n]) => n === s.dir)
  const t = view(state, state.floor).terr[state.hero.y + dy][state.hero.x + dx]
  if (t === '%') return useItem(state, defs, 'pickaxe')
  if (t === '~') return useItem(state, defs, 'frostCore')
  return guarded(state, () => moveHero(state, defs, s.dir))
}

const won = { v: false }
const fightLog = { count: 0, loss: 0 }
const minHp = {}
const notes = []
const note = (s) => notes.push(s)

function absorb(events, state) {
  if (events.some((e) => e.type === 'win')) won.v = true
  for (const e of events) {
    if (e.type === 'fight') {
      fightLog.count++
      fightLog.loss += e.loss
    }
    if (e.type === 'pickup' && KEY_IDX[e.id] !== undefined && KEY_MULT > 1) {
      state.hero.keys[e.id] += KEY_MULT - 1
    }
  }
}

function run() {
  const state = createGame(defs)
  const bad = new Set()
  const commit = { cur: null }
  const seen = new Map()
  const snaps = {}
  let actions = 0
  let maxFloor = 1
  let prevFloor = state.floor
  let stuck = null

  while (!state.ended && !state.dead) {
    if (actions >= STEP_LIMIT) {
      stuck = `超过 ${STEP_LIMIT} 步上限`
      break
    }
    const sig = createHash('sha1').update(JSON.stringify({ ...state, history: undefined })).digest('hex')
    const times = (seen.get(sig) ?? 0) + 1
    seen.set(sig, times)
    if (times >= 4) {
      stuck = '循环：同一完整状态反复出现，机器人在原地打转'
      break
    }

    const plan = planStep(state, bad, commit)
    if (process.env.TRACE) {
      const n = plan.n
      console.log(`[trace ${actions}] F${state.floor} (${state.hero.x},${state.hero.y}) hp ${state.hero.hp} 钥 ${state.hero.keys.yellowKey}/${state.hero.keys.blueKey}/${state.hero.keys.redKey} -> ${plan.kind} ${n ? `F${n.f} (${n.x},${n.y}) d${n.d}` : ''}`)
    }
    if (plan.kind === null) {
      stuck = `没有可执行的目标\n${plan.diag}`
      break
    }

    let res
    if (plan.kind === 'flask') {
      res = useItem(state, defs, 'flask')
      note(`F${state.floor}: 前进被损失阻塞且金币不足，使用蓄能瓶（${res.text}）`)
    } else if (plan.kind === 'C') {
      const choice = plan.needAtk ? 'atk' : 'def'
      res = plan.n.d === 0 ? buyAltar(state, defs, choice) : execStep(state, plan.search.firstStep(plan.n))
      if (plan.n.d === 0 && res.ok) note(`F${state.floor} 祭坛(${choice}): ${res.text}`)
    } else if (plan.kind === 'D') {
      res = plan.n.d === 0 ? merchantBuy(state, defs, plan.shop) : execStep(state, plan.search.firstStep(plan.n))
      if (plan.n.d === 0 && res.ok) note(`F${state.floor} 商人(${plan.shop}): ${res.text}`)
    } else if (plan.kind === 'T') {
      const fired0 = state.firedEvents.length
      res = plan.n.d === 0 ? talkAdjacentGuide(state) : execStep(state, plan.search.firstStep(plan.n))
      if (plan.n.d === 0 && state.firedEvents.length === fired0) {
        bad.add(`T|${plan.n.f},${plan.n.x},${plan.n.y}`)
        continue
      }
      if (Array.isArray(res) && res.some((e) => e.type === 'pickup' && e.id === 'compass')) note(`F${state.floor} 引路人对话：获得传送罗盘`)
    } else if (plan.kind === 'F') {
      res = plan.n.d === 0 ? useItem(state, defs, 'bomb') : execStep(state, plan.search.firstStep(plan.n))
      if (plan.n.d === 0 && res.ok) note(`F${state.floor} 炸药: ${res.text}`)
    } else {
      res = execStep(state, plan.search.firstStep(plan.n))
    }
    actions++

    if (Array.isArray(res)) {
      const t0 = res[0].type
      if (['blocked', 'nofight', 'locked'].includes(t0)) {
        stuck = `机器人与引擎不一致（目标 ${plan.kind}，引擎返回 ${t0}：${res[0].reason ?? ''}）`
        break
      }
      absorb(res, state)
    } else if (!res.ok) {
      if (['C', 'D', 'F'].includes(plan.kind) && plan.n.d === 0) {
        bad.add(`${plan.kind}|${plan.n.f},${plan.n.x},${plan.n.y}`)
        continue
      }
      stuck = `动作失败（目标 ${plan.kind}）：${res.text}`
      break
    } else {
      absorb(res.events ?? [], state)
    }

    minHp[state.floor] = Math.min(minHp[state.floor] ?? Infinity, state.hero.hp)
    bad.clear()
    if (state.floor !== prevFloor) {
      if (state.floor > prevFloor && SNAP_FLOORS.includes(prevFloor) && !snaps[prevFloor]) snaps[prevFloor] = snap(state)
      if (state.floor > maxFloor) {
        maxFloor = state.floor
        note(`到达第 ${state.floor} 层（hp ${state.hero.hp} 攻 ${state.hero.atk} 防 ${state.hero.def} 金 ${state.hero.gold}）`)
      }
      prevFloor = state.floor
    }
  }
  snaps.final = snap(state)
  return { state, stuck, actions, maxFloor, snaps }
}

/* ---------------- 运行与报告 ---------------- */

const dataIssues = [...checkData(), ...countsCheck()]
const result = run()
const { state, stuck, actions, maxFloor, snaps } = result
const h = state.hero
const pad = (s, n) => String(s).padEnd(n)

console.log('=== 星穹塔 全程通关模拟（贪心机器人）===')
if (process.env.DIAG_OLD_G5 === '1') console.log('[诊断] 内存覆盖：第 5 层引路人 (6,0)→(9,5)（未写入文件；结论以默认模式为准）')
console.log(`模式: ${NO_ALTAR ? '禁用祭坛 ' : ''}${KEY_MULT > 1 ? '钥匙加倍 ' : ''}${!NO_ALTAR && KEY_MULT === 1 ? '默认' : ''}`)
console.log(`合并地图: ${Object.keys(defs).length} 层（8 个分片，层号无重复）`)
console.log(`数据指纹（地图分片 + 规格）: ${DATA_HASH_START}`)
console.log('')
console.log(`[数据检查] ${dataIssues.length} 条说明`)
for (const s of dataIssues) console.log(`  - ${s}`)
console.log('')
console.log(`[引擎异常] ${engineErrors.length} 次（引擎缺陷；异常后按变更后的状态继续）`)
for (const e of engineErrors) console.log(`  第 ${e.floor} 层 (${e.pos}) 移动时抛出：${e.message} → 之后位于第 ${e.floorAfter} 层`)
console.log('')
console.log('[进程]')
for (const s of notes) console.log(`  ${s}`)
console.log('')
console.log('[结果]')
console.log(`  通关: ${won.v && state.ended ? '是（终焉之主被击败，win 事件已触发）' : '否'}`)
console.log(`  到达的最高层: ${maxFloor}`)
console.log(`  停在: 第 ${state.floor} 层 (${h.x},${h.y})  hp ${h.hp} 攻 ${h.atk} 防 ${h.def} 金 ${h.gold}`)
console.log(`  钥匙 黄${h.keys.yellowKey} 蓝${h.keys.blueKey} 红${h.keys.redKey}；祭坛购买 ${state.altarBuys} 次；道具 ${JSON.stringify(state.items)}`)
console.log(`  持有特殊道具: ${Object.entries(h.flags).filter(([, v]) => v).map(([k]) => k).join(', ') || '无'}；已售商品 ${state.soldOut.join(',') || '无'}`)
console.log(`  动作 ${actions} 步；战斗 ${fightLog.count} 次，累计损失 ${fightLog.loss}`)
if (stuck) {
  console.log('')
  console.log('[卡住]')
  console.log(`  ${stuck.split('\n').join('\n  ')}`)
}
console.log('')
console.log('[每 10 层快照（离开该层时的属性）]')
console.log(`  ${pad('层', 6)}${pad('hp', 8)}${pad('攻', 6)}${pad('防', 6)}${pad('金', 10)}${pad('黄/蓝/红', 12)}${pad('祭坛', 6)}`)
for (const k of [...SNAP_FLOORS, 'final']) {
  const s = snaps[k]
  if (!s) {
    console.log(`  ${pad(k === 'final' ? '末' : `${k}`, 6)}（未到达）`)
    continue
  }
  const label = k === 'final' ? `末(${s.floor})` : `${k}`
  console.log(`  ${pad(label, 6)}${pad(s.hp, 8)}${pad(s.atk, 6)}${pad(s.def, 6)}${pad(s.gold, 10)}${pad(s.keys.join('/'), 12)}${pad(s.altar, 6)}`)
}
console.log('')
console.log('[与 §11 检查点对照]（规格：攻/防/生命/祭坛）')
const REF = { 10: [40, 49, 500, 3], 20: [90, 117, 2600, 6], 30: [153, 189, 2100, 8], 40: [268, 337, 6700, 12], 49: [396, 492, 11000, 15], 50: [396, 507, 4000, 16] }
for (const k of [10, 20, 30, 40, 49]) {
  const s = snaps[k]
  const r = REF[k]
  if (!s) {
    console.log(`  第 ${k} 层: 未到达（规格 ${r.join('/')}）`)
    continue
  }
  console.log(`  第 ${k} 层: 实际 ${s.atk}/${s.def}/${s.hp}/${s.altar}  规格 ${r.join('/')}`)
}
if (snaps.final && won.v) {
  const r = REF[50]
  console.log(`  第 50 层（通关）: 实际 ${snaps.final.atk}/${snaps.final.def}/${snaps.final.hp}/${snaps.final.altar}  规格 ${r.join('/')}`)
}
console.log('')
console.log('[各层最低生命]')
const minLine = Object.keys(minHp).map(Number).sort((a, b) => a - b).map((f) => `${f}:${minHp[f]}`)
for (let i = 0; i < minLine.length; i += 10) console.log(`  ${minLine.slice(i, i + 10).join('  ')}`)

const DATA_HASH_END = dataHash()
if (DATA_HASH_END !== DATA_HASH_START) console.log(`[警告] 运行期间地图或规格被修改（${DATA_HASH_START} → ${DATA_HASH_END}），本次结果只对应开始时的数据`)
process.exit(won.v && state.ended ? 0 : 1)
