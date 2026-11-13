// 本地存储封装：所有读写都做了 try/catch，存储不可用时游戏仍可正常运行（只是无法存档）
// 《星穹塔》使用独立的前缀 star-v1:，旧 20 层版本的存档不会被误读。

const PREFIX = 'star-v1:'
export const MANUAL_SLOTS = ['0', '1', '2']
export const AUTO_SLOT = 'auto'

function getRaw(key) {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

function setRaw(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, value)
    return true
  } catch {
    return false
  }
}

function removeRaw(key) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* 忽略 */
  }
}

const DEFAULT_META = { volume: 0.9, muted: false, seenHelp: false }

/* ---------- 玩家设置 ---------- */

export function loadMeta() {
  try {
    const raw = getRaw('meta')
    const o = raw ? JSON.parse(raw) : {}
    return {
      volume: typeof o.volume === 'number' ? o.volume : DEFAULT_META.volume,
      muted: !!o.muted,
      seenHelp: !!o.seenHelp,
    }
  } catch {
    return { ...DEFAULT_META }
  }
}

export function saveMeta(meta) {
  return setRaw('meta', JSON.stringify(meta))
}

/* ---------- 存档槽位 ---------- */

/**
 * 写入槽位。撤销历史（history）不写入存档：它很大，读档后撤销栈从空开始。
 * state 是引擎的纯数据对象，直接存 JSON。
 */
export function writeSlot(name, state) {
  try {
    const { history, ...body } = JSON.parse(JSON.stringify(state))
    const entry = {
      savedAt: Date.now(),
      floor: state.floor,
      state: { ...body, history: [] },
    }
    return setRaw(`slot-${name}`, JSON.stringify(entry))
  } catch {
    return false
  }
}

/** 读取槽位原始记录，无效时返回 null */
export function readSlot(name) {
  const raw = getRaw(`slot-${name}`)
  if (!raw) return null
  try {
    const entry = JSON.parse(raw)
    if (!entry || !entry.state) return null
    return entry
  } catch {
    return null
  }
}

export function deleteSlot(name) {
  removeRaw(`slot-${name}`)
}

/** 所有槽位（手动 0-2 + 自动存档）的概要，供界面显示 */
export function listSlots() {
  const manual = MANUAL_SLOTS.map((name) => ({ name, entry: readSlot(name) }))
  return [...manual, { name: AUTO_SLOT, entry: readSlot(AUTO_SLOT) }]
}
