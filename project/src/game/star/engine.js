// 《星穹塔》引擎（纯 JS，不依赖 Vue / DOM）。依据：魔塔50层新玩法.md §3–§5、§8、§10、§12。
// 地图由调用方传入 defs：{ [层号]: { index, entry:{x,y}, grid: string[11], legend:{字符: id}, events:[...] } }。
// 引擎本身不含任何地图内容，便于用小地图做单元测试。
import { combat, auraDamage, consumableEffect, altarPrice, altarGain, zoneOf, ALTAR_TIER } from './rules.js'
import { MONSTERS, CONSUMABLES, KEYS, GEAR, HOLD, ACTIVE, MERCHANTS, LAST_FLOOR } from './data.js'

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
export const SIZE = 11
const DOORS = { y: 'yellowKey', b: 'blueKey', r: 'redKey' }
const TERRAIN = new Set(['.', '#', '%', 'w', '~', '*', 'y', 'b', 'r', 'a', '^', 'v'])
const HISTORY_LIMIT = 50

const inBounds = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE
const key = (x, y) => `${x},${y}`
const neighbours = (x, y) => Object.values(DIRS).map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => inBounds(a, b))

/* ---------------- 楼层实例（可变，存在 state.world 里） ---------------- */

function instantiate(def) {
  const terr = def.grid.map((row) => [...row].map((c) => (TERRAIN.has(c) ? c : '.')))
  const ents = {}
  def.grid.forEach((row, y) => {
    ;[...row].forEach((c, x) => {
      if (TERRAIN.has(c)) return
      const id = def.legend[c]
      if (!id) throw new Error(`第 ${def.index} 层 (${x},${y}) 的字符 "${c}" 没有图例`)
      const kind = MONSTERS[id] ? 'monster' : ['guide', 'merchant', 'altar'].includes(id) ? 'npc' : 'item'
      ents[key(x, y)] = { kind, id }
    })
  })
  return { terr, ents }
}

function ensureFloor(state, defs, n) {
  if (!state.world[n]) {
    const def = defs[n]
    if (!def) throw new Error(`没有第 ${n} 层的定义`)
    state.world[n] = instantiate(def)
  }
  return state.world[n]
}

/** 目标层上与当前楼梯对应的另一端楼梯：坐标相同或相邻（§8.4 第 2 条） */
function counterpart(state, defs, target, want, x, y) {
  const w = ensureFloor(state, defs, target)
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const cx = x + dx
    const cy = y + dy
    if (inBounds(cx, cy) && w.terr[cy][cx] === want) return { floor: target, x: cx, y: cy }
  }
  return null
}

/** 楼梯的落点：另一端楼梯旁的第一个空地（§8.4 第 2 条） */
function landing(state, defs, floor, sx, sy) {
  const w = ensureFloor(state, defs, floor)
  for (const [x, y] of neighbours(sx, sy)) {
    if (w.terr[y][x] === '.' && !w.ents[key(x, y)]) return { x, y }
  }
  throw new Error(`第 ${floor} 层楼梯 (${sx},${sy}) 旁没有空地可以落脚`)
}

/* ---------------- 状态、快照、撤销 ---------------- */

export function createGame(defs, { startFloor = 1 } = {}) {
  const def = defs[startFloor]
  const state = {
    version: 1,
    floor: startFloor,
    hero: {
      x: def.entry.x,
      y: def.entry.y,
      hp: 1000,
      atk: 10,
      def: 10,
      gold: 0,
      keys: { yellowKey: 0, blueKey: 0, redKey: 0 },
      flags: { tideSpear: false, charm: false, dragonFang: false, starShield: false },
    },
    items: {},
    altarBuys: 0,
    world: {},
    firedEvents: [],
    visited: [startFloor],
    soldOut: [],
    dead: false,
    ended: false,
    history: [], // 每个元素是一次动作前的 JSON 快照（最多 50 个）
  }
  ensureFloor(state, defs, startFloor)
  return state
}

/** 不含 history 的当前状态 JSON */
function bodyJson(state) {
  const { history, ...rest } = state
  return JSON.stringify(rest)
}

function pushSnapshot(state, before) {
  state.history.push(before)
  if (state.history.length > HISTORY_LIMIT) state.history.shift()
}

/** 动作结束后：若状态没有变化，撤掉这次快照（失败的动作不占撤销步数） */
function settle(state, before) {
  if (bodyJson(state) === before) state.history.pop()
  else pushSnapshot(state, before)
}

export function undo(state) {
  const prev = state.history.pop()
  if (prev === undefined) return { ok: false, text: '没有可以撤销的操作' }
  const history = state.history
  const restored = JSON.parse(prev)
  for (const k of Object.keys(state)) delete state[k]
  Object.assign(state, restored, { history })
  return { ok: true, text: '已撤销一步' }
}

/* ---------------- 查询 ---------------- */

export function entityAt(state, defs, x, y) {
  return ensureFloor(state, defs, state.floor).ents[key(x, y)] ?? null
}

/** 第 49 层还活着的星柱守卫数（0–4）。第 49 层不存在时按 4 计 */
export function livingPillars(state, defs) {
  if (!defs[49]) return 4
  const w = ensureFloor(state, defs, 49)
  return Object.values(w.ents).filter((e) => e.id === 'pillarGuard').length
}

/** 战斗预判（不改变状态）。界面与实战都走 rules.combat() */
export function preview(state, defs, x, y) {
  const e = entityAt(state, defs, x, y)
  if (!e || e.kind !== 'monster') return null
  const pillars = e.id === 'endLord' ? livingPillars(state, defs) : 0
  return { id: e.id, monster: MONSTERS[e.id], ...combat(state.hero, MONSTERS[e.id], { pillarsAlive: pillars }) }
}

/* ---------------- 事件（§10） ---------------- */

/**
 * 检查本层的事件。ctx 可以包含：
 *   talked: 对话的 NPC id；entered: {x,y} 走到的格子；defeated: {x,y} 被击败的怪物格。
 * allDefeated 在每次检查时都会判断。每个事件只触发一次。
 */
function checkEvents(state, defs, ctx, out) {
  const events = defs[state.floor]?.events ?? []
  for (const ev of events) {
    if (state.firedEvents.includes(ev.id)) continue
    const t = ev.trigger
    let ok = false
    if (t.op === 'talked') ok = ctx.talked === t.npc
    if (t.op === 'enterTile') ok = !!ctx.entered && ctx.entered.x === t.at.x && ctx.entered.y === t.at.y
    if (t.op === 'defeated') ok = !!ctx.defeated && ctx.defeated.x === t.at.x && ctx.defeated.y === t.at.y
    if (t.op === 'allDefeated') {
      const w = ensureFloor(state, defs, state.floor)
      ok = t.at.every(({ x, y }) => !(w.ents[key(x, y)]?.kind === 'monster'))
    }
    if (!ok) continue
    state.firedEvents.push(ev.id)
    for (const eff of ev.effects) applyEffect(state, defs, eff, out)
  }
}

function applyEffect(state, defs, eff, out) {
  const w = ensureFloor(state, defs, state.floor)
  switch (eff.op) {
    case 'setTerrain':
      w.terr[eff.y][eff.x] = eff.terrain
      break
    case 'addStair':
      w.terr[eff.y][eff.x] = eff.dir === 'up' ? '^' : 'v'
      out.push({ type: 'stair-created', x: eff.x, y: eff.y, dir: eff.dir })
      break
    case 'spawnItem':
      w.ents[key(eff.x, eff.y)] = { kind: 'item', id: eff.id }
      break
    case 'grantItem':
      grantItem(state, eff.id, out)
      break
    case 'say':
      out.push({ type: 'say', text: eff.text })
      break
    case 'win':
      state.ended = true
      out.push({ type: 'win' })
      break
    default:
      throw new Error(`未知事件效果 ${eff.op}`)
  }
}

/* ---------------- 拾取 ---------------- */

function grantItem(state, id, out) {
  const { hero } = state
  if (CONSUMABLES[id]) {
    const e = consumableEffect(id, state.floor)
    if (e.atk) hero.atk += e.atk
    if (e.def) hero.def += e.def
    if (e.hp) hero.hp += e.hp
  } else if (KEYS[id]) {
    hero.keys[id] += 1
  } else if (GEAR[id]) {
    const g = GEAR[id]
    if (g.atk) hero.atk += g.atk
    if (g.def) hero.def += g.def
    if (g.immuneAura) hero.flags.starShield = true
  } else if (HOLD[id]) {
    hero.flags[HOLD[id].flag] = true
  } else if (ACTIVE[id]) {
    state.items[id] = (state.items[id] ?? 0) + 1
  } else {
    throw new Error(`未知道具 ${id}`)
  }
  out.push({ type: 'pickup', id })
}

/* ---------------- 移动（§3.4） ---------------- */

function auraStep(state, defs, out) {
  const w = ensureFloor(state, defs, state.floor)
  const { x, y } = state.hero
  const adj = []
  for (const [dx, dy] of Object.values(DIRS)) {
    const e = w.ents[key(x + dx, y + dy)]
    if (e && e.kind === 'monster') adj.push(MONSTERS[e.id])
  }
  const raw = auraDamage(state.hero, adj)
  if (raw > 0) {
    const before = state.hero.hp
    state.hero.hp = Math.max(1, before - raw) // 灼域最低扣到 1，不致死
    out.push({ type: 'aura', damage: before - state.hero.hp, raw })
  }
}

/** 移动一步。返回事件数组，events[0] 为本步的主要结果 */
export function moveHero(state, defs, dir) {
  if (state.dead || state.ended) return [{ type: 'blocked', reason: '游戏已结束' }]
  const delta = DIRS[dir]
  if (!delta) return [{ type: 'blocked', reason: '无效方向' }]
  const before = bodyJson(state)
  const out = []
  const result = step(state, defs, delta, out)
  settle(state, before)
  return [result, ...out.filter((o) => o !== result)]
}

function step(state, defs, [dx, dy], out) {
  const { hero } = state
  const nx = hero.x + dx
  const ny = hero.y + dy
  if (!inBounds(nx, ny)) return { type: 'blocked', reason: '边界外' }
  const w = ensureFloor(state, defs, state.floor)
  const t = w.terr[ny][nx]
  const e = w.ents[key(nx, ny)]

  // 1. 墙、裂墙、熔岩、虚空：不能进入
  if (t === '#' || t === '%' || t === '~' || t === '*') return { type: 'blocked', reason: '前方不能通行' }

  // 2. 假墙：变成空地，这一步不移动
  if (t === 'w') {
    w.terr[ny][nx] = '.'
    return { type: 'false-wall', x: nx, y: ny }
  }

  // 3. 门：有对应钥匙则消耗，这一步不移动
  if (t in DOORS) {
    const k = DOORS[t]
    if (hero.keys[k] <= 0) return { type: 'locked', key: k, reason: `需要${KEYS[k].name}才能打开` }
    hero.keys[k] -= 1
    w.terr[ny][nx] = '.'
    return { type: 'door', key: k }
  }

  // 4. 机关门：只能由事件打开
  if (t === 'a') return { type: 'blocked', reason: '机关门，需要触发机关' }

  // 5. 怪物：预判能打则结算战斗，勇者不移动
  if (e && e.kind === 'monster') {
    const p = preview(state, defs, nx, ny)
    if (!p.canFight) {
      return { type: 'nofight', reason: p.reason === 'unpierceable' ? '无法破防：攻击不大于防御' : '会死亡：损失不小于当前生命' }
    }
    hero.hp -= p.loss
    const gold = MONSTERS[e.id].gold * (hero.flags.charm ? 2 : 1)
    hero.gold += gold
    delete w.ents[key(nx, ny)]
    out.push({ type: 'defeated', id: e.id, x: nx, y: ny })
    if (e.id === 'endLord') {
      state.ended = true
      out.push({ type: 'win' })
    }
    checkEvents(state, defs, { defeated: { x: nx, y: ny } }, out)
    return { type: 'fight', id: e.id, loss: p.loss, gold }
  }

  // 6. NPC：对话或交易，不移动
  if (e && e.kind === 'npc') {
    if (e.id === 'guide') {
      checkEvents(state, defs, { talked: 'guide' }, out)
      return { type: 'talk', npc: 'guide' }
    }
    return { type: 'shop', npc: e.id }
  }

  // 7–9. 道具、楼梯、空地：移动过去
  hero.x = nx
  hero.y = ny
  if (e && e.kind === 'item') {
    delete w.ents[key(nx, ny)]
    grantItem(state, e.id, out)
  }
  checkEvents(state, defs, { entered: { x: nx, y: ny } }, out)

  if (t === '^' || t === 'v') {
    const dir = t === '^' ? 'up' : 'down'
    // 楼梯默认通向相邻层；第 43、45 层的个别楼梯由层定义 stairTo 指定目标层（§8.4 第 2 条）
    const override = defs[state.floor].stairTo?.[key(nx, ny)]
    const target = override ?? (dir === 'up' ? state.floor + 1 : state.floor - 1)
    const want = dir === 'up' ? 'v' : '^'
    const cp = counterpart(state, defs, target, want, nx, ny)
    const at = cp ? landing(state, defs, cp.floor, cp.x, cp.y) : defs[target].entry
    const newFloor = target
    ensureFloor(state, defs, newFloor)
    state.floor = newFloor
    if (!state.visited.includes(newFloor)) state.visited.push(newFloor)
    hero.x = at.x
    hero.y = at.y
    auraStep(state, defs, out)
    return { type: 'stairs', floor: newFloor, dir }
  }

  auraStep(state, defs, out)
  return { type: 'moved' }
}

/* ---------------- 祭坛与商人（需要站在旁边） ---------------- */

function adjacentNpc(state, defs, id) {
  const w = ensureFloor(state, defs, state.floor)
  return neighbours(state.hero.x, state.hero.y).some(([x, y]) => w.ents[key(x, y)]?.id === id)
}

/** 祭坛购买（全塔累计计次）。choice: 'hp' | 'atk' | 'def' */
export function buyAltar(state, defs, choice) {
  const t = ALTAR_TIER[state.floor]
  if (!t || !adjacentNpc(state, defs, 'altar')) return { ok: false, text: '需要站在祭坛旁边' }
  if (!['hp', 'atk', 'def'].includes(choice)) return { ok: false, text: '未知选项' }
  const price = altarPrice(state.altarBuys + 1)
  if (state.hero.gold < price) return { ok: false, text: `金币不足，需要 ${price}` }
  const before = bodyJson(state)
  state.hero.gold -= price
  state.altarBuys += 1
  const g = altarGain(t, choice)
  if (g.hp) state.hero.hp += g.hp
  if (g.atk) state.hero.atk += g.atk
  if (g.def) state.hero.def += g.def
  settle(state, before)
  return { ok: true, text: `第 ${state.altarBuys} 次购买，花费 ${price}`, gain: g }
}

/** 商人交易（§5.2）：每件只卖一次；回收钥匙不限次 */
export function merchantBuy(state, defs, shopId) {
  const list = MERCHANTS[state.floor] ?? []
  const item = list.find((s) => s.id === shopId)
  if (!item) return { ok: false, text: '这里没有这件商品' }
  if (!adjacentNpc(state, defs, 'merchant')) return { ok: false, text: '需要站在商人旁边' }
  if (!item.unlimited && state.soldOut.includes(shopId)) return { ok: false, text: '已经售完' }
  const before = bodyJson(state)
  if (item.recycle) {
    if (state.hero.keys[item.recycle] <= 0) return { ok: false, text: '没有可以回收的钥匙' }
    state.hero.keys[item.recycle] -= 1
    state.hero.gold += item.gold
    settle(state, before)
    return { ok: true, text: `回收了一把钥匙，获得 ${item.gold} 金币` }
  }
  if (state.hero.gold < item.price) return { ok: false, text: `金币不足，需要 ${item.price}` }
  state.hero.gold -= item.price
  state.soldOut.push(shopId)
  if (item.hp) state.hero.hp += item.hp
  for (const [k, n] of Object.entries(item.items ?? {})) {
    if (KEYS[k]) state.hero.keys[k] += n
    else state.items[k] = (state.items[k] ?? 0) + n
  }
  settle(state, before)
  return { ok: true, text: `购买成功，花费 ${item.price}` }
}

/* ---------------- 主动道具（§7.3） ---------------- */

/**
 * 使用主动道具。target 仅用于传送罗盘（目标层号）。
 * 所有道具都必须已持有（items[id] > 0）；有限次数的道具用完即减少。
 */
export function useItem(state, defs, id, target = null) {
  const def = ACTIVE[id]
  if (!def) return { ok: false, text: '这件道具不能主动使用' }
  if (!(state.items[id] > 0)) return { ok: false, text: `没有${def.name}` }
  const before = bodyJson(state)
  const w = ensureFloor(state, defs, state.floor)
  const { hero } = state
  const out = []
  let text = ''

  switch (id) {
    case 'compass': {
      if (state.floor === LAST_FLOOR) return { ok: false, text: '第 50 层不能使用传送罗盘' }
      if (!state.visited.includes(target)) return { ok: false, text: '只能传送到已到过的楼层' }
      if (target === 44 || target === LAST_FLOOR) return { ok: false, text: '罗盘不能传送到第 44、50 层' }
      ensureFloor(state, defs, target)
      state.floor = target
      hero.x = defs[target].entry.x
      hero.y = defs[target].entry.y
      text = `传送到第 ${target} 层`
      break
    }
    case 'pickaxe': {
      const hit = neighbours(hero.x, hero.y).find(([x, y]) => w.terr[y][x] === '%')
      if (!hit) return { ok: false, text: '周围没有裂墙' }
      w.terr[hit[1]][hit[0]] = '.'
      text = '凿开了一面裂墙'
      break
    }
    case 'flask': {
      hero.hp *= 2
      text = `生命翻倍，现为 ${hero.hp}`
      break
    }
    case 'mirrorJump': {
      const nx = SIZE - 1 - hero.x
      const ny = SIZE - 1 - hero.y
      if (w.terr[ny][nx] !== '.' || w.ents[key(nx, ny)]) return { ok: false, text: '对称位置不是没有东西的空地' }
      hero.x = nx
      hero.y = ny
      text = `镜面跃迁到 (${nx}, ${ny})`
      break
    }
    case 'frostCore': {
      let n = 0
      w.terr.forEach((row, y) => row.forEach((c, x) => { if (c === '~') { row[x] = '.'; n++ } }))
      if (!n) return { ok: false, text: '本层没有熔岩' }
      text = `清除了 ${n} 格熔岩`
      break
    }
    case 'bomb': {
      let n = 0
      for (const [x, y] of neighbours(hero.x, hero.y)) {
        const e = w.ents[key(x, y)]
        if (e && e.kind === 'monster' && !MONSTERS[e.id].boss) {
          delete w.ents[key(x, y)]
          n++
          out.push({ type: 'defeated', id: e.id, x, y, bomb: true })
          checkEvents(state, defs, { defeated: { x, y } }, out)
        }
      }
      if (!n) return { ok: false, text: '周围没有可以炸的怪物' }
      checkEvents(state, defs, {}, out)
      text = `炸掉了 ${n} 只怪物（不给金币）`
      break
    }
    default:
      return { ok: false, text: '未实现' }
  }

  if (def.uses !== Infinity) state.items[id] -= 1
  settle(state, before)
  return { ok: true, text, events: out }
}

/* ---------------- 存档 ---------------- */

export function serialize(state) {
  return JSON.stringify(state)
}

export function deserialize(text) {
  try {
    const obj = typeof text === 'string' ? JSON.parse(text) : text
    if (!obj || obj.version !== 1 || !obj.hero || !obj.world) return null
    return obj
  } catch {
    return null
  }
}
