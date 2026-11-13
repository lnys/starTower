// 《星穹塔》应用状态：把纯引擎（game/star/engine.js）接到 Vue 响应式 store，
// 并负责存档、音效、弹窗路由。规则全部在引擎里，这里不重算任何数值。
import { reactive } from 'vue'
import * as eng from '../game/star/engine.js'
import { ACTIVE, CONSUMABLES, KEYS, GEAR, HOLD, MONSTERS } from '../game/star/data.js'
import { zoneOf } from '../game/star/rules.js'
import * as storage from '../engine/storage.js'
import { sfx, setVolume, setMuted, startBgm, startTitleBgm, stopBgm, unlockAudio } from '../engine/audio.js'
import m0104 from '../game/star/maps/floors-01-04.js'
import m0515 from '../game/star/maps/floors-05-15.js'
import m1627 from '../game/star/maps/floors-16-27.js'
import m2839 from '../game/star/maps/floors-28-39.js'
import m2932 from '../game/star/maps/floors-29-32.js'
import m3336 from '../game/star/maps/floors-33-36.js'
import m3739 from '../game/star/maps/floors-37-39.js'
import m4050 from '../game/star/maps/floors-40-50.js'

const { AUTO_SLOT } = storage

/* ---------------- 地图定义（只读，按层号索引） ---------------- */

export const DEFS = {}
for (const shard of [m0104, m0515, m1627, m2839, m2932, m3336, m3739, m4050]) {
  for (const def of shard) DEFS[def.index] = def
}

export const ZONES = ['苔藓地窖', '潮汐机关城', '镜廊', '熔炉深处', '星穹']
export const BOSS_FLOORS = [10, 20, 30, 40, 50]
export const zoneName = (floor) => ZONES[zoneOf(floor) - 1] ?? ''

/** 道具中文名：在所有道具表中查找（怪物名也放在这里，供事件提示使用） */
export function itemName(id) {
  return CONSUMABLES[id]?.name ?? KEYS[id]?.name ?? GEAR[id]?.name ?? HOLD[id]?.name
    ?? ACTIVE[id]?.name ?? MONSTERS[id]?.name ?? id
}

const OPENING = [
  '很久以前，地底矿窖的尽头凿出了一座观星塔。塔一直修到星空里，顶端悬着一张星图。',
  '守塔人把星图锁进了塔顶，塔里的造物也随之失控。你是受雇的修塔匠，要一路上到塔顶，把星幕关掉。',
  '途中你会遇到一位被困的测绘员，她是引路人。她会给你提示，也会记下你走过的检查点。',
]

/* ---------------- 响应式状态 ---------------- */

export const store = reactive({
  screen: 'title', // title | playing
  game: null, // 引擎状态（就是 engine.createGame() 返回的纯数据对象）
  modal: null, // { type, ... } 见 Modals.vue
  toasts: [],
  floats: [],
  transition: null, // { title, key }
  shakeKey: 0,
  slots: storage.listSlots(),
  meta: storage.loadMeta(),
})

let uid = 0

function persistMeta() {
  storage.saveMeta(JSON.parse(JSON.stringify(store.meta)))
}

function refreshSlots() {
  store.slots = storage.listSlots()
}

export function toast(text, tone = 'info') {
  const id = ++uid
  store.toasts.push({ id, text, tone })
  if (store.toasts.length > 4) store.toasts.shift()
  setTimeout(() => {
    store.toasts = store.toasts.filter((t) => t.id !== id)
  }, 2600)
}

function floatAt(text, kind) {
  const g = store.game
  if (!g) return
  const id = ++uid
  store.floats.push({ id, text, kind, x: g.hero.x, y: g.hero.y })
  setTimeout(() => {
    store.floats = store.floats.filter((f) => f.id !== id)
  }, 1000)
}

function playFloorBgm(floor) {
  startBgm(floor, BOSS_FLOORS.includes(floor))
}

function autoSave() {
  if (!store.game) return
  storage.writeSlot(AUTO_SLOT, store.game)
  refreshSlots()
}

function fail(e) {
  console.error(e)
  toast(`出错了：${e?.message ?? e}`, 'warn')
  return false
}

export function gainText(g) {
  const parts = []
  if (g.hp) parts.push(`生命 +${g.hp}`)
  if (g.atk) parts.push(`攻击 +${g.atk}`)
  if (g.def) parts.push(`防御 +${g.def}`)
  return parts.join(' · ')
}

/* ---------------- 事件结果 → 界面反馈 ---------------- */

/**
 * 处理一次动作（移动、用道具）产生的事件，并根据是否换层、是否通关、是否有对话决定弹窗。
 * before: 动作前的 { floor }，用于判断是否换层。
 */
function afterAction(g, before, events) {
  const says = []
  let talked = false
  let won = false
  let shop = null

  for (const ev of events) {
    switch (ev.type) {
      case 'fight': {
        if (ev.loss > 0) {
          floatAt(`-${ev.loss}`, 'hurt')
          store.shakeKey++
        }
        toast(`击败 ${itemName(ev.id)} · 损失 ${ev.loss} 生命 · 金币 +${ev.gold}`, 'gold')
        sfx.hit()
        break
      }
      case 'nofight':
        toast(ev.reason, 'warn')
        sfx.denied()
        break
      case 'locked':
        toast(`需要${KEYS[ev.key]?.name ?? '钥匙'}才能打开`, 'warn')
        sfx.denied()
        break
      case 'door':
        sfx.door()
        break
      case 'false-wall':
        toast('这面墙是假的，已经打通')
        sfx.door()
        break
      case 'blocked':
        if (ev.reason !== '前方不能通行' && ev.reason !== '边界外') toast(ev.reason, 'warn')
        sfx.denied()
        break
      case 'pickup':
        toast(`获得 ${itemName(ev.id)}`, 'gold')
        sfx.pick()
        break
      case 'aura': {
        floatAt(`-${ev.damage}`, 'hurt')
        store.shakeKey++
        toast(`灼域灼伤 -${ev.damage} 生命（原始伤害 ${ev.raw}）`, 'warn')
        break
      }
      case 'stair-created':
        toast('一座楼梯出现了', 'gold')
        break
      case 'say':
        says.push(ev.text)
        break
      case 'talk':
        talked = true
        break
      case 'shop':
        shop = ev.npc
        break
      case 'win':
        won = true
        break
      default:
        break
    }
  }

  const floorChanged = g.floor !== before.floor
  if (floorChanged) {
    store.transition = { title: `第 ${g.floor} 层 · ${zoneName(g.floor)}`, key: ++uid }
    setTimeout(() => (store.transition = null), 1600)
    sfx.stairs()
    playFloorBgm(g.floor)
    autoSave()
  }

  if (won) {
    stopBgm()
    sfx.win()
    store.modal = { type: 'ending' }
  } else if (says.length) {
    store.modal = {
      type: 'story',
      title: talked ? '引路人' : '提示',
      lines: says,
      then: null,
    }
  } else if (talked) {
    // 引路人的对话只在第一次触发（引擎的事件只触发一次），之后没有新话
    toast('引路人：……这里我已经都告诉你了。')
  } else if (shop) {
    store.modal = { type: shop === 'altar' ? 'altar' : 'merchant' }
  }
}

/* ---------------- 查询（供界面使用） ---------------- */

/** 与勇士四邻相邻的怪物，并附上引擎的战斗预判（界面不重算公式） */
export function adjacentFights(g) {
  if (!g) return []
  const out = []
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
  for (const [dx, dy] of dirs) {
    const x = g.hero.x + dx
    const y = g.hero.y + dy
    if (x < 0 || y < 0 || x > 10 || y > 10) continue
    const pv = eng.preview(g, DEFS, x, y)
    if (pv) out.push({ x, y, pv })
  }
  return out
}

/** 任意一格的战斗预判（只读，用于棋盘上显示每只怪物的预计损失） */
export function previewAt(g, x, y) {
  if (!g) return null
  return eng.preview(g, DEFS, x, y)
}

/** 勇士四邻中是否有指定 NPC（altar / merchant / guide） */
export function nearNpc(g, id) {
  if (!g) return false
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
  return dirs.some(([dx, dy]) => {
    const x = g.hero.x + dx
    const y = g.hero.y + dy
    if (x < 0 || y < 0 || x > 10 || y > 10) return false
    return eng.entityAt(g, DEFS, x, y)?.id === id
  })
}

/** 罗盘可以去的楼层：到过的、不是当前层、不是 44 层与 50 层 */
export function compassTargets(g) {
  if (!g) return []
  return g.visited.filter((f) => f !== g.floor && f !== 44 && f !== 50).sort((a, b) => a - b)
}

/* ---------------- 动作 ---------------- */

export const actions = {
  newGame() {
    unlockAudio()
    store.game = eng.createGame(DEFS)
    store.screen = 'playing'
    const firstTime = !store.meta.seenHelp
    if (firstTime) {
      store.meta.seenHelp = true
      persistMeta()
    }
    store.modal = {
      type: 'story',
      title: '序章',
      lines: OPENING,
      then: firstTime ? () => (store.modal = { type: 'help' }) : null,
    }
    store.toasts = []
    store.floats = []
    store.transition = null
    playFloorBgm(1)
    autoSave()
  },

  continueAuto() {
    return actions.loadSlot(AUTO_SLOT)
  },

  /** 读档：检查存档结构与地图定义是否匹配，撤销栈从空开始 */
  loadSlot(name) {
    unlockAudio()
    const entry = storage.readSlot(name)
    const st = entry ? eng.deserialize(entry.state) : null
    const valid = st && DEFS[st.floor] && Object.keys(st.world ?? {}).every((k) => DEFS[k])
    if (!valid) {
      toast('这个存档无法读取', 'warn')
      return false
    }
    st.history = []
    store.game = st
    store.screen = 'playing'
    store.modal = null
    store.toasts = []
    store.floats = []
    store.transition = null
    playFloorBgm(st.floor)
    toast(`已读取存档 · 第 ${st.floor} 层`, 'good')
    return true
  },

  saveSlot(name) {
    if (!store.game) return
    const ok = storage.writeSlot(name, store.game)
    refreshSlots()
    toast(ok ? '存档成功' : '存档失败：浏览器存储不可用', ok ? 'good' : 'warn')
    sfx.click()
  },

  deleteSlot(name) {
    storage.deleteSlot(name)
    refreshSlots()
  },

  backToTitle() {
    stopBgm()
    startTitleBgm()
    store.screen = 'title'
    store.game = null
    store.modal = null
    store.toasts = []
    store.floats = []
    store.transition = null
    refreshSlots()
  },

  /** 移动一步。返回是否真的发生了位移（界面用它判断是否继续长按连续移动） */
  move(dir) {
    const g = store.game
    if (!g || store.screen !== 'playing' || store.modal || g.ended) return false
    const before = { x: g.hero.x, y: g.hero.y, floor: g.floor }
    let events
    try {
      events = eng.moveHero(g, DEFS, dir)
    } catch (e) {
      return fail(e)
    }
    const first = events[0]
    if (first.type === 'blocked') {
      afterAction(g, before, events)
      return false
    }
    const moved = g.hero.x !== before.x || g.hero.y !== before.y || g.floor !== before.floor
    if (moved) sfx.move()
    afterAction(g, before, events)
    return moved
  },

  /** 撤销一步（引擎保留最多 50 步） */
  undo() {
    const g = store.game
    if (!g || store.modal) return
    const floor = g.floor
    const r = eng.undo(g)
    toast(r.text, r.ok ? 'info' : 'warn')
    if (r.ok && g.floor !== floor) playFloorBgm(g.floor)
  },

  /** 使用主动道具。target 仅用于罗盘（目标层号） */
  useItem(id, target = null) {
    const g = store.game
    if (!g || store.modal || g.ended) return false
    const before = { x: g.hero.x, y: g.hero.y, floor: g.floor }
    let res
    try {
      res = eng.useItem(g, DEFS, id, target)
    } catch (e) {
      return fail(e)
    }
    if (!res.ok) {
      sfx.denied()
      toast(res.text, 'warn')
      return false
    }
    sfx.click()
    toast(res.text, 'good')
    afterAction(g, before, res.events ?? [])
    return true
  },

  buyAltar(choice) {
    const g = store.game
    if (!g) return false
    let res
    try {
      res = eng.buyAltar(g, DEFS, choice)
    } catch (e) {
      return fail(e)
    }
    if (!res.ok) {
      sfx.denied()
      toast(res.text, 'warn')
      return false
    }
    sfx.buy()
    toast(`${res.text} · ${gainText(res.gain)}`, 'gold')
    return true
  },

  merchantBuy(id) {
    const g = store.game
    if (!g) return false
    let res
    try {
      res = eng.merchantBuy(g, DEFS, id)
    } catch (e) {
      return fail(e)
    }
    if (!res.ok) {
      sfx.denied()
      toast(res.text, 'warn')
      return false
    }
    sfx.buy()
    toast(res.text, 'good')
    return true
  },

  openModal(modal) {
    store.modal = modal
  },

  closeModal() {
    const modal = store.modal
    store.modal = null
    if (modal?.then) modal.then()
  },

  setVolume(v) {
    store.meta.volume = v
    setVolume(v)
    persistMeta()
  },

  setMuted(m) {
    store.meta.muted = m
    setMuted(m)
    persistMeta()
  },

  /** 标题音乐：浏览器要求用户手势后才能出声，所以在第一次点击/按键时播放 */
  playTitleMusic() {
    unlockAudio()
    if (store.screen === 'title' && !store.game) startTitleBgm()
  },
}

export function applyAudioSettings() {
  setVolume(store.meta.volume)
  setMuted(store.meta.muted)
}
