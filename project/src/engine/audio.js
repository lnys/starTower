// 程序化音频（Web Audio API）：音效 + 每层一首背景音乐，无需外部音频文件
let ctx = null
let master = null
let comp = null
let enabled = true
let volume = 0.9
let bgmTimer = null
let bgmTheme = null

// 整体增益：原先的音量参数偏小，这里统一放大；压缩器防止爆音
const BOOST = 2.4

function ensure() {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      // iOS Safari 16.4+：声明为"播放"类音频会话，这样即使开着静音键（响铃开关），游戏声音仍会播放
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback'
      } catch {
        /* 不支持则忽略 */
      }
      ctx = new AC()
      comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -10
      comp.ratio.value = 6
      master = ctx.createGain()
      master.gain.value = enabled ? volume : 0
      master.connect(comp)
      comp.connect(ctx.destination)
    }
    // iOS 会把上下文挂起或打断，每次用户手势都尝试恢复
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

/** 在用户手势（点击/触摸/按键）中调用，解除浏览器与 iOS 的播放限制 */
export function unlockAudio() {
  ensure()
}

export function isRunning() {
  return !!ctx && ctx.state === 'running'
}

export function setVolume(v) {
  volume = Math.min(1, Math.max(0, v))
  if (master) master.gain.value = enabled ? volume : 0
}

export function setMuted(muted) {
  enabled = !muted
  if (master) master.gain.value = enabled ? volume : 0
}

function tone(freq, { dur = 0.12, type = 'square', vol = 0.15, at = 0, slide = null } = {}) {
  const c = ensure()
  if (!c || !master) return
  try {
    const t = c.currentTime + at
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur)
    const peak = vol * BOOST
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(master)
    osc.start(t)
    osc.stop(t + dur + 0.03)
  } catch {
    /* 音频失败不影响游戏 */
  }
}

export const sfx = {
  move: () => tone(220, { dur: 0.04, vol: 0.04, type: 'triangle' }),
  hit: () => tone(180, { dur: 0.16, slide: 60, type: 'sawtooth', vol: 0.14 }),
  pick: () => {
    tone(880, { dur: 0.08, vol: 0.13 })
    tone(1320, { dur: 0.12, at: 0.07, vol: 0.13 })
  },
  door: () => tone(160, { dur: 0.26, slide: 320, type: 'triangle', vol: 0.18 }),
  stairs: () => [523, 659, 784].forEach((f, i) => tone(f, { dur: 0.14, at: i * 0.09, type: 'triangle', vol: 0.15 })),
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { dur: 0.22, at: i * 0.1, type: 'square', vol: 0.1 })),
  denied: () => tone(120, { dur: 0.18, type: 'square', vol: 0.11, slide: 90 }),
  death: () => tone(300, { dur: 1, slide: 40, type: 'sawtooth', vol: 0.16 }),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, { dur: 0.3, at: i * 0.16, type: 'triangle', vol: 0.16 })),
  click: () => tone(640, { dur: 0.05, vol: 0.08, type: 'triangle' }),
  buy: () => {
    tone(988, { dur: 0.08, vol: 0.12, type: 'triangle' })
    tone(1319, { dur: 0.12, at: 0.08, vol: 0.12, type: 'triangle' })
  },
}

/* ---------------- 背景音乐 ---------------- */

// 每层一首程序化旋律：层数决定调式、主音与节奏，保证相邻层听起来不同。
// Boss 层使用更快、更紧张的节奏。标题画面使用编号 0 的舒缓曲目。
const MODES = [
  [0, 2, 3, 5, 7, 8, 10], // 小调
  [0, 2, 3, 5, 7, 9, 10], // 多利亚
  [0, 1, 3, 5, 7, 8, 10], // 弗里吉亚（更暗）
  [0, 2, 4, 6, 7, 9, 11], // 利底亚（更梦幻）
  [0, 2, 4, 5, 7, 9, 11], // 大调
]

function makeRng(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function trackFor(floor, boss) {
  const r = makeRng(floor * 131 + 17)
  const mode = MODES[Math.floor(r() * MODES.length)]
  // 主音在 A2~G3 之间按层数错开，半音位移
  const root = 110 * Math.pow(2, ((floor * 3) % 12) / 12 + (boss ? 0 : 0.5))
  const scale = []
  for (let oct = 0; oct < 2; oct++) {
    for (const st of mode) scale.push(root * Math.pow(2, (st + 12 * oct) / 12))
  }
  const bpm = boss ? 150 + Math.floor(r() * 20) : 84 + Math.floor(r() * 36)
  const stepMs = Math.round(60000 / bpm / 2)
  const pattern = Array.from({ length: 8 }, () => Math.floor(r() * scale.length))
  return { scale, pattern, stepMs, boss }
}

function playTrack(key, { floor, boss, slow = false }) {
  if (bgmTheme === key && bgmTimer) return
  stopBgm()
  bgmTheme = key
  const track = trackFor(floor, boss)
  const { scale, pattern, boss: isBoss } = track
  // 标题曲目放慢一倍，听起来更舒缓
  const stepMs = slow ? track.stepMs * 2 : track.stepMs
  let step = 0
  bgmTimer = setInterval(() => {
    if (!enabled) return
    const idx = pattern[step % pattern.length]
    const dur = isBoss ? 0.3 : 0.46
    tone(scale[idx], { dur, vol: isBoss ? 0.04 : 0.035, type: isBoss ? 'sawtooth' : 'triangle' })
    if (step % 4 === 0) tone(scale[0] / 2, { dur: 0.9, vol: 0.035, type: 'sine' })
    if (isBoss && step % 2 === 1) tone(scale[idx] / 2, { dur: 0.2, vol: 0.02, type: 'square' })
    step++
  }, stepMs)
}

/** 每层的背景音乐（Boss 层使用快节奏版本） */
export function startBgm(floor = 1, boss = false) {
  playTrack(`${floor}-${boss ? 'b' : 'n'}`, { floor, boss })
}

/** 标题画面的背景音乐 */
export function startTitleBgm() {
  playTrack('title', { floor: 0, boss: false, slow: true })
}

export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer)
  bgmTimer = null
  bgmTheme = null
}
