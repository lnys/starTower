<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { store, actions, applyAudioSettings } from './stores/star.js'
import TitleScreen from './components/TitleScreen.vue'
import GameScreen from './components/GameScreen.vue'
import Modals from './components/Modals.vue'
import { createHoldRepeat } from './engine/repeat.js'
import EndingFx from './components/EndingFx.vue'
import IntroPanel from './components/IntroPanel.vue'

const MOVE_KEYS = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
}

function isTyping(e) {
  const tag = e.target?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable
}

// 键盘长按：按住方向键连续移动（不依赖系统的按键重复，节奏更稳定）
function keyStepper(dir) {
  return () => {
    const g = store.game
    if (!g) return false
    const { x, y } = g.hero
    actions.move(dir)
    return !store.modal && (g.hero.x !== x || g.hero.y !== y)
  }
}
let heldKey = null
const hold = createHoldRepeat(() => (heldKey ? keyStepper(heldKey)() : false))

function onKeyUp(e) {
  if (MOVE_KEYS[e.key] && MOVE_KEYS[e.key] === heldKey) {
    heldKey = null
    hold.stop()
  }
}

function onKeyDown(e) {
  if (isTyping(e)) return
  if (store.screen !== 'playing') return

  if (e.key === 'Escape') {
    e.preventDefault()
    if (store.modal?.type === 'pause') actions.closeModal()
    else if (!store.modal) actions.openModal({ type: 'pause' })
    return
  }
  if (store.modal) return

  const dir = MOVE_KEYS[e.key]
  if (dir) {
    e.preventDefault()
    // 系统自动重复的 keydown 忽略，由 hold 统一连续移动
    if (e.repeat) return
    heldKey = dir
    hold.start()
    return
  }
  if (e.key === 'z' || e.key === 'Z') actions.undo()
  if (e.key === 'm' || e.key === 'M') actions.setMuted(!store.meta.muted)
}

// 浏览器（尤其是 iPhone Safari）要求音频必须在用户手势中启动：
// 任何一次点击、触摸或按键都会解锁音频，并在标题页播放背景音乐。
const GESTURES = ['pointerdown', 'touchend', 'keydown']
function onGesture() {
  actions.playTitleMusic()
}

onMounted(() => {
  applyAudioSettings()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', () => { heldKey = null; hold.stop() })
  for (const ev of GESTURES) window.addEventListener(ev, onGesture, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  hold.stop()
  for (const ev of GESTURES) window.removeEventListener(ev, onGesture)
})
</script>

<template>
  <div class="device-stage">
    <div class="device">
      <!-- 仅在电脑上显示的 iPhone 外壳装饰；手机上访问时不显示 -->
      <div class="island" aria-hidden="true"></div>
      <div class="status-bar" aria-hidden="true">
        <span class="sb-time">9:41</span>
        <span class="sb-icons"><i class="sb-signal"></i><i class="sb-wifi"></i><i class="sb-battery"></i></span>
      </div>

      <div class="app screen">
        <TitleScreen v-if="store.screen === 'title'" />
        <GameScreen v-else />

        <div class="toasts" aria-live="polite">
          <TransitionGroup name="toast">
            <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.tone">{{ t.text }}</div>
          </TransitionGroup>
        </div>

        <Transition name="fade">
          <div v-if="store.transition" :key="store.transition.key" class="floor-transition">
            <div class="ft-line"></div>
            <div class="ft-title">{{ store.transition.title }}</div>
            <div class="ft-line"></div>
          </div>
        </Transition>

        <EndingFx v-if="store.modal?.type === 'ending'" :hidden="!!store.modal.hidden" />

        <Modals />
      </div>

      <div class="home-indicator" aria-hidden="true"></div>
    </div>

    <!-- 电脑端：右侧的游戏介绍与玩法 -->
    <div class="intro-side"><IntroPanel /></div>
  </div>
</template>

<style>
/* ---------- 外层：手机直接全屏；电脑上放进 iPhone 外壳 ---------- */
.device-stage {
  min-height: 100vh;
  min-height: 100dvh;
}
.device {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
}
.status-bar,
.island,
.home-indicator {
  display: none;
}
.intro-side { display: none; }
.intro-side > .intro { min-height: 0; }

/* 屏幕本身：所有浮层（弹窗、提示、转场）都相对它定位 */
.app.screen {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  container-type: inline-size;
  overflow-x: hidden;
}

/* 浮层统一用绝对定位，保证手机外壳里只在屏幕内显示 */
.toasts {
  /* 提示放在屏幕正中间，不挡住点击 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: min(92%, 480px);
  pointer-events: none;
}
.toast {
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--text);
  background: rgba(14, 14, 34, 0.88);
  border: 1px solid var(--line);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  text-align: center;
}
.toast.gold { color: #ffe58a; border-color: var(--line-gold); }
.toast.good { color: #aef5c8; }
.toast.warn { color: #ffc27a; border-color: rgba(255, 179, 71, 0.45); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-10px); }
.toast-leave-to { opacity: 0; transform: translateY(-8px); }

.floor-transition {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(10, 8, 26, 0.5), rgba(3, 3, 10, 0.92));
  animation: ftFade 1.6s ease forwards;
}
.ft-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 8cqw, 44px);
  letter-spacing: 6px;
  color: var(--gold);
  text-shadow: 0 0 30px rgba(255, 213, 107, 0.45);
  animation: ftIn 1.6s ease forwards;
}
.ft-line {
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  animation: lineGrow 1.6s ease forwards;
}
@keyframes ftFade {
  0% { opacity: 0; }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes ftIn {
  0% { transform: translateY(12px); letter-spacing: 16px; }
  30% { transform: translateY(0); letter-spacing: 6px; }
}
@keyframes lineGrow {
  0% { width: 0; }
  30% { width: 60%; }
  100% { width: 60%; }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.god-badge {
  position: absolute;
  top: 56px;
  right: 14px;
  z-index: 55;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 2px;
  color: #2a1a00;
  background: linear-gradient(135deg, #fff0a8, #e6a817);
  box-shadow: 0 0 22px rgba(255, 213, 107, 0.7);
  animation: godPulse 2.4s ease-in-out infinite;
  pointer-events: none;
}
.god-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2a1a00;
  animation: blink 1s steps(2) infinite;
}
@keyframes godPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(255, 213, 107, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 213, 107, 0.9); }
}
@keyframes blink { 50% { opacity: 0.2; } }

/* ---------- 电脑端：iPhone 模拟器外壳（触屏/手机不启用） ---------- */
@media (min-width: 700px) and (pointer: fine) {
  .device-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(40px, 5vw, 88px);
    padding: 24px clamp(24px, 4vw, 64px);
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background:
      radial-gradient(60% 50% at 50% 30%, rgba(120, 90, 255, 0.18), transparent 70%),
      #050510;
  }
  .intro-side { display: flex; flex: 0 1 600px; min-width: 0; max-width: 600px; max-height: min(94vh, 980px); }
  .device {
    /* 按屏幕高度等比放大（iPhone 15 Pro 比例 393:852），最大 980px 高 */
    height: min(94vh, 980px);
    aspect-ratio: 393 / 852;
    width: auto;
    min-height: 0;
    flex: none;
    padding: 12px;
    border-radius: 62px;
    background: linear-gradient(145deg, #3a3a40, #0b0b0e 40%, #1c1c22);
    box-shadow:
      0 0 0 2px #2a2a30,
      0 0 0 4px #0a0a0c,
      0 40px 90px rgba(0, 0, 0, 0.7),
      inset 0 0 0 1.5px rgba(255, 255, 255, 0.08);
  }
  .device::before {
    /* 侧边按键 */
    content: '';
    position: absolute;
    left: -3px;
    top: 180px;
    width: 3px;
    height: 64px;
    border-radius: 2px;
    background: #2c2c33;
    box-shadow: 0 90px 0 #2c2c33, 0 -60px 0 #2c2c33;
  }
  .island {
    display: block;
    position: absolute;
    top: 22px;
    left: 50%;
    transform: translateX(-50%);
    width: 118px;
    height: 34px;
    border-radius: 20px;
    background: #000;
    z-index: 70;
    pointer-events: none;
  }
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    top: 14px;
    left: 30px;
    right: 26px;
    height: 34px;
    z-index: 65;
    padding-top: 6px;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    font-family: -apple-system, 'SF Pro Text', 'PingFang SC', system-ui, sans-serif;
    pointer-events: none;
  }
  .sb-icons { display: inline-flex; gap: 6px; align-items: center; }
  .sb-signal, .sb-wifi, .sb-battery { display: inline-block; background: #fff; }
  .sb-signal { width: 16px; height: 10px; border-radius: 2px; clip-path: polygon(0 100%, 25% 100%, 25% 70%, 50% 70%, 50% 45%, 75% 45%, 75% 20%, 100% 20%, 100% 100%, 0 100%); }
  .sb-wifi { width: 14px; height: 10px; border-radius: 50% 50% 0 0; background: #fff; opacity: 0.95; }
  .sb-battery { width: 24px; height: 11px; border-radius: 3px; border: 1px solid #fff; background: linear-gradient(90deg, #fff 80%, transparent 80%); position: relative; }
  .home-indicator {
    display: block;
    position: absolute;
    bottom: 9px;
    left: 50%;
    transform: translateX(-50%);
    width: 134px;
    height: 5px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.85);
    z-index: 70;
    pointer-events: none;
  }
  .app.screen {
    position: absolute;
    inset: 12px;
    min-height: 0;
    height: auto;
    border-radius: 50px;
    overflow: hidden;
    background: var(--bg);
  }
  /* 屏幕内容区可滚动；顶部留出状态栏与刘海的位置 */
  .app.screen > .game,
  .app.screen > .title {
    position: absolute;
    inset: 0;
    height: auto;
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: 62px !important;
    /* 隐藏滚动条，仍可滚动 */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .app.screen > .game::-webkit-scrollbar,
  .app.screen > .title::-webkit-scrollbar {
    display: none;
  }
  .app.screen > .title { padding-top: 62px; }
}

/* 手机真机：避开刘海与 Home 条 */
@supports (padding: env(safe-area-inset-top)) {
  @media (max-width: 699px), (pointer: coarse) {
    .app.screen > .game { padding-top: max(12px, env(safe-area-inset-top)) !important; }
  }
}
</style>
