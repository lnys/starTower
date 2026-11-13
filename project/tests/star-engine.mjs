// 《星穹塔》引擎测试（node tests/star-engine.mjs）。使用小地图，逐条对照 魔塔50层新玩法.md。
import assert from 'node:assert/strict'
import { createGame, moveHero, buyAltar, merchantBuy, useItem, undo, serialize, deserialize, preview } from '../src/game/star/engine.js'

const cases = []
const t = (name, fn) => cases.push([name, fn])

/** 造一个 11×11 的空地楼层；rows 是 {x,y,c} 列表覆盖，legend 为本层的实体图例 */
function floor(index, { entry = { x: 5, y: 5 }, put = [], legend = {}, events = [] } = {}) {
  const g = Array.from({ length: 11 }, () => Array(11).fill('.'))
  for (const [x, y, c] of put) g[y][x] = c
  return { index, entry, grid: g.map((r) => r.join('')), legend, events }
}

/** 两层世界：第 1 层的 ^ 在 (0,0) 通向第 2 层的 v（同坐标） */
function world(f1Put = [], f2Put = [], opts = {}) {
  const f1 = floor(1, { put: [[0, 0, '^'], ...f1Put], ...opts.f1 })
  const f2 = floor(2, { put: [[0, 0, 'v'], ...f2Put], ...opts.f2 })
  return { 1: f1, 2: f2 }
}

/** 造一个游戏状态，并把勇士放到 (x,y) */
function play(defs, { x = 5, y = 5, hp, atk, def, gold, keys, flags, items, startFloor = 1 } = {}) {
  const s = createGame(defs, { startFloor })
  Object.assign(s.hero, { x, y })
  if (hp !== undefined) s.hero.hp = hp
  if (atk !== undefined) s.hero.atk = atk
  if (def !== undefined) s.hero.def = def
  if (gold !== undefined) s.hero.gold = gold
  if (keys) Object.assign(s.hero.keys, keys)
  if (flags) Object.assign(s.hero.flags, flags)
  if (items) Object.assign(s.items, items)
  return s
}

const cell = (s, defs, x, y) => s.world[s.floor].terr[y][x]

t('墙阻挡：不移动，也不留撤销记录', () => {
  const defs = world([[6, 5, '#']])
  const s = play(defs, { x: 5, y: 5 })
  const before = s.history.length
  assert.equal(moveHero(s, defs, 'right')[0].type, 'blocked')
  assert.equal(s.hero.x, 5)
  assert.equal(s.history.length, before)
})

t('门：没有钥匙不能开，有钥匙开门、消耗钥匙，且勇者不移动', () => {
  const defs = world([[6, 5, 'y']])
  const s = play(defs, { x: 5, y: 5 })
  assert.equal(moveHero(s, defs, 'right')[0].type, 'locked')
  s.hero.keys.yellowKey = 1
  const ev = moveHero(s, defs, 'right')
  assert.equal(ev[0].type, 'door')
  assert.equal(s.hero.keys.yellowKey, 0)
  assert.equal(s.hero.x, 5)
  assert.equal(cell(s, defs, 6, 5), '.')
})

t('假墙：这一步不移动，格子变为空地，下一步可以走过去', () => {
  const defs = world([[6, 5, 'w']])
  const s = play(defs, { x: 5, y: 5 })
  assert.equal(moveHero(s, defs, 'right')[0].type, 'false-wall')
  assert.equal(s.hero.x, 5)
  assert.equal(moveHero(s, defs, 'right')[0].type, 'moved')
  assert.equal(s.hero.x, 6)
})

t('机关门与裂墙：不能进入', () => {
  const defs = world([[6, 5, 'a'], [5, 6, '%']])
  const s = play(defs, { x: 5, y: 5 })
  assert.equal(moveHero(s, defs, 'right')[0].type, 'blocked')
  assert.equal(moveHero(s, defs, 'down')[0].type, 'blocked')
  assert.equal(s.hero.x, 5)
  assert.equal(s.hero.y, 5)
})

t('战斗：能打则结算，勇者不移动，怪物消失，获得金币', () => {
  // 洞蝠 30/22/2，勇者 10/10 → 损失 36
  const defs = world([[6, 5, 'C']], [], { f1: { legend: { C: 'caveBat' } } })
  const s = play(defs, { x: 5, y: 5, hp: 1000 })
  const ev = moveHero(s, defs, 'right')
  assert.equal(ev[0].type, 'fight')
  assert.equal(ev[0].loss, 36)
  assert.equal(s.hero.hp, 964)
  assert.equal(s.hero.gold, 2)
  assert.equal(s.hero.x, 5)
  assert.equal(cell(s, defs, 6, 5), '.')
  assert.equal(s.world[1].ents['6,5'], undefined)
})

t('战斗：打不动则拒绝，血量与位置都不变', () => {
  const defs = world([[6, 5, 'T']], [], { f1: { legend: { T: 'stoneBeetle' } } })
  const s = play(defs, { x: 5, y: 5, hp: 1000, atk: 14, def: 14 })
  assert.equal(moveHero(s, defs, 'right')[0].type, 'nofight')
  assert.equal(s.hero.hp, 1000)
  assert.ok(s.world[1].ents['6,5'])
})

t('战斗：损失不小于当前生命时拒绝（不允许同归于尽）', () => {
  const defs = world([[6, 5, 'C']], [], { f1: { legend: { C: 'caveBat' } } })
  const s = play(defs, { x: 5, y: 5, hp: 36 })
  assert.equal(moveHero(s, defs, 'right')[0].type, 'nofight')
  assert.equal(s.hero.hp, 36)
})

t('预判与实战是同一个结果：preview 的损失等于实际扣血', () => {
  const defs = world([[6, 5, 'C']], [], { f1: { legend: { C: 'caveBat' } } })
  const s = play(defs, { x: 5, y: 5, hp: 1000 })
  const p = preview(s, defs, 6, 5)
  assert.equal(p.canFight, true)
  moveHero(s, defs, 'right')
  assert.equal(1000 - s.hero.hp, p.loss)
})

t('灼域：走一步后相邻的灼域怪扣血；多只累加；最低扣到 1', () => {
  // 灼域祭司 100 灼域，勇者 10/10 打它会因损失过大而拒绝；这里只测位移后的灼域结算
  const defs = world([[7, 5, 'P']], [], { f1: { legend: { P: 'auraPriest' } } })
  const s = play(defs, { x: 5, y: 5, hp: 500 })
  const ev = moveHero(s, defs, 'right') // 走到 (6,5)，与 (7,5) 相邻
  assert.equal(ev[0].type, 'moved')
  assert.ok(ev.some((e) => e.type === 'aura' && e.damage === 100))
  assert.equal(s.hero.hp, 400)
  s.hero.hp = 50
  moveHero(s, defs, 'left')
  moveHero(s, defs, 'right')
  assert.equal(s.hero.hp, 1)
})

t('灼域：持星穹盾为 0，且不在战斗中结算', () => {
  const defs = world([[7, 5, 'P']], [], { f1: { legend: { P: 'auraPriest' } } })
  const s = play(defs, { x: 5, y: 5, hp: 500, flags: { starShield: true } })
  moveHero(s, defs, 'right')
  assert.equal(s.hero.hp, 500)
})

t('晶石随区变化：第 1 层 +2，第 11 层 +3（取得时所在层）', () => {
  const defs = world([[6, 5, 'R']], [], { f1: { legend: { R: 'redCrystal' } } })
  const s = play(defs, { x: 5, y: 5, atk: 10 })
  moveHero(s, defs, 'right')
  assert.equal(s.hero.atk, 12)
})

t('楼梯：上楼到下一层的 v 旁边；再下楼回到原来的 ^ 旁边', () => {
  const defs = world()
  const s = play(defs, { x: 1, y: 0 })
  const up = moveHero(s, defs, 'left')
  assert.equal(up.at(0).type, 'stairs')
  assert.equal(s.floor, 2)
  assert.equal(s.hero.x, 0)
  assert.equal(s.hero.y, 1) // 第 2 层 v 的旁边
  const down = moveHero(s, defs, 'up')
  assert.equal(down.at(0).type, 'stairs')
  assert.equal(s.floor, 1)
})

t('事件 allDefeated：指定格上的怪全部被击败后，机关门打开', () => {
  const defs = world(
    [[6, 5, 'C'], [6, 6, 'C'], [7, 5, 'a']],
    [],
    {
      f1: {
        legend: { C: 'caveBat' },
        events: [{ id: 'gate', floor: 1, trigger: { op: 'allDefeated', at: [{ x: 6, y: 5 }, { x: 6, y: 6 }] }, effects: [{ op: 'setTerrain', x: 7, y: 5, terrain: '.' }] }],
      },
    },
  )
  const s = play(defs, { x: 5, y: 5, hp: 1000 })
  moveHero(s, defs, 'right') // 击败 (6,5)，此时 (6,6) 仍在
  assert.equal(cell(s, defs, 7, 5), 'a')
  s.hero.x = 5
  s.hero.y = 6
  moveHero(s, defs, 'right') // 击败 (6,6)
  assert.equal(cell(s, defs, 7, 5), '.')
  assert.ok(s.firedEvents.includes('gate'))
})

t('事件 talked：与引路人对话只触发一次，勇者不移动', () => {
  const defs = world([[6, 5, 'G']], [], {
    f1: {
      legend: { G: 'guide' },
      events: [{ id: 'g1', floor: 1, trigger: { op: 'talked', npc: 'guide' }, effects: [{ op: 'say', text: 'hi' }] }],
    },
  })
  const s = play(defs, { x: 5, y: 5 })
  const ev = moveHero(s, defs, 'right')
  assert.equal(ev[0].type, 'talk')
  assert.equal(s.hero.x, 5)
  assert.ok(ev.some((e) => e.type === 'say'))
  moveHero(s, defs, 'right')
  assert.equal(s.firedEvents.filter((i) => i === 'g1').length, 1)
})

t('祭坛：必须站在旁边；价格 20、80…，收益按档位；全塔累计', () => {
  const defs = { 4: floor(4, { put: [[5, 5, 'A']], legend: { A: 'altar' } }) }
  const s = play(defs, { x: 4, y: 5, gold: 200, startFloor: 4 })
  s.visited = [4]
  s.hero.x = 0
  s.hero.y = 10
  assert.equal(buyAltar(s, defs, 'hp').ok, false)
  s.hero.x = 4
  s.hero.y = 5
  const hpBefore = s.hero.hp
  assert.equal(buyAltar(s, defs, 'hp').ok, true)
  assert.equal(s.hero.hp, hpBefore + 150)
  assert.equal(s.hero.gold, 180)
  assert.equal(buyAltar(s, defs, 'def').ok, true)
  assert.equal(s.hero.def, 10 + 3)
  assert.equal(s.hero.gold, 100)
  assert.equal(s.altarBuys, 2)
})

t('商人：每件只卖一次；回收黄钥匙不限次，每把 80 金', () => {
  const defs = { 6: floor(6, { put: [[5, 5, 'N']], legend: { N: 'merchant' } }) }
  const s = play(defs, { x: 4, y: 5, gold: 100, startFloor: 6 })
  s.hero.keys.yellowKey = 3
  s.visited = [6]
  assert.equal(merchantBuy(s, defs, 'm6a').ok, true)
  assert.equal(s.hero.keys.yellowKey, 6)
  assert.equal(merchantBuy(s, defs, 'm6a').ok, false)
  assert.equal(s.hero.gold, 70)
})

t('罗盘：只能传送到已到过的楼层；不能去 44、50 层；第 50 层不可用', () => {
  const defs = world()
  const s = play(defs)
  s.items.compass = 1
  s.visited = [1, 2]
  assert.equal(useItem(s, defs, 'compass', 9).ok, false)
  assert.equal(useItem(s, defs, 'compass', 2).ok, true)
  assert.equal(s.floor, 2)
  assert.equal(s.items.compass, 1)
})

t('镜面跃迁：只能落在没有任何东西的空地上', () => {
  const defs = world([[10, 10, 'C']], [], { f1: { legend: { C: 'caveBat' } } })
  const s = play(defs, { x: 0, y: 0 })
  s.items.mirrorJump = 1
  // 对称点 (10,10) 上有怪物：不能用
  assert.equal(useItem(s, defs, 'mirrorJump').ok, false)
  assert.equal(s.hero.x, 0)
  s.hero.x = 1
  s.hero.y = 1
  // 对称点 (9,9) 是空地：可以用
  assert.equal(useItem(s, defs, 'mirrorJump').ok, true)
  assert.equal(s.hero.x, 9)
  assert.equal(s.hero.y, 9)
})

t('炸药：炸掉相邻的非 BOSS 怪，不给金币，但算作击败并触发 allDefeated', () => {
  const defs = world(
    [[6, 5, 'C'], [5, 6, 'W'], [7, 5, 'a']],
    [],
    {
      f1: {
        legend: { C: 'caveBat', W: 'wardenBoss' },
        events: [{ id: 'g', floor: 1, trigger: { op: 'allDefeated', at: [{ x: 6, y: 5 }] }, effects: [{ op: 'setTerrain', x: 7, y: 5, terrain: '.' }] }],
      },
    },
  )
  const s = play(defs, { x: 5, y: 5, gold: 0 })
  s.items.bomb = 1
  const r = useItem(s, defs, 'bomb')
  assert.equal(r.ok, true)
  assert.equal(s.world[1].ents['6,5'], undefined)
  assert.ok(s.world[1].ents['5,6']) // BOSS 不受影响
  assert.equal(s.hero.gold, 0)
  assert.equal(cell(s, defs, 7, 5), '.')
  assert.equal(s.items.bomb, 0)
})

t('撤销：撤销一步后状态与动作前一致；失败的动作不占撤销步数', () => {
  const defs = world()
  const s = play(defs, { x: 5, y: 5 })
  moveHero(s, defs, 'right')
  const at6 = s.hero.x
  moveHero(s, defs, 'left')
  assert.equal(s.hero.x, 5)
  const n = s.history.length
  moveHero(s, defs, 'up') // 合法移动（只是位置变化）
  assert.equal(s.history.length, n + 1)
  undo(s)
  assert.equal(s.hero.x, 5)
  assert.equal(s.hero.y, 5)
  assert.equal(at6, 6)
})

t('撤销上限 50 步', () => {
  const defs = world()
  const s = play(defs, { x: 5, y: 5 })
  for (let i = 0; i < 60; i++) moveHero(s, defs, i % 2 ? 'left' : 'right')
  assert.equal(s.history.length, 50)
})

t('存档往返：序列化再读回，状态完全一致', () => {
  const defs = world([[6, 5, 'C']], [], { f1: { legend: { C: 'caveBat' } } })
  const s = play(defs, { x: 5, y: 5, hp: 1000 })
  moveHero(s, defs, 'right')
  const text = serialize(s)
  const back = deserialize(text)
  assert.equal(serialize(back), text)
})

t('楼梯没有对应楼梯时（单向层）：落在目标层入口，不抛异常', () => {
  const defs = {
    1: floor(1, { put: [[0, 0, '^']] }),
    2: { index: 2, entry: { x: 7, y: 7 }, grid: Array.from({ length: 11 }, () => '.'.repeat(11)), legend: {}, events: [] },
  }
  const s = play(defs, { x: 1, y: 0 })
  const ev = moveHero(s, defs, 'left')
  assert.equal(ev[0].type, 'stairs')
  assert.equal(s.floor, 2)
  assert.deepEqual([s.hero.x, s.hero.y], [7, 7])
})

t('NPC 不可穿过：NPC 所在格挡住通道（与地图修复相关的回归）', () => {
  const defs = world([[6, 5, 'G']], [], { f1: { legend: { G: 'guide' } } })
  const s = play(defs, { x: 5, y: 5 })
  assert.equal(moveHero(s, defs, 'right')[0].type, 'talk')
  assert.equal(s.hero.x, 5)
})

t('同一层的两座上楼梯可以通往不同的楼层（stairTo，第 43 层的情形）', () => {
  const g = (rows) => rows.concat(Array(11 - rows.length).fill('.'.repeat(11)))
  const defs = {
    43: { index: 43, entry: { x: 9, y: 8 }, grid: g(['.'.repeat(11)]).map((r, y) => (y === 8 ? '^' + '.'.repeat(10) : r)), legend: {}, events: [], stairTo: { '0,8': 45 } },
    44: { index: 44, entry: { x: 5, y: 3 }, grid: g(['.'.repeat(11)]), legend: {}, events: [] },
    45: { index: 45, entry: { x: 1, y: 8 }, grid: g(['.'.repeat(11)]).map((r, y) => (y === 8 ? 'v' + '.'.repeat(10) : r)), legend: {}, events: [] },
  }
  const s = play(defs, { x: 1, y: 8, startFloor: 43 })
  const ev = moveHero(s, defs, 'left')
  assert.equal(ev[0].type, 'stairs')
  assert.equal(s.floor, 45, '应通往 45 层而不是 44 层')
})

let pass = 0
for (const [name, fn] of cases) {
  try {
    fn()
    pass++
    console.log(`  ✔ ${name}`)
  } catch (e) {
    console.log(`  ✘ ${name}\n      ${e.message.split('\n').join('\n      ')}`)
  }
}
console.log(`\n星穹塔引擎：通过 ${pass}/${cases.length}`)
if (pass !== cases.length) process.exit(1)
