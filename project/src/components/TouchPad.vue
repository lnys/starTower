<script setup>
import { onBeforeUnmount } from 'vue'
import { actions, store } from '../stores/star.js'
import { createHoldRepeat } from '../engine/repeat.js'

// 按住方向键会连续移动；撞墙或弹出窗口时自动停止
function stepper(dir) {
  return () => {
    const g = store.game
    if (!g) return false
    const { x, y } = g.hero
    actions.move(dir)
    return !store.modal && (g.hero.x !== x || g.hero.y !== y)
  }
}

const repeaters = {}
function holdStart(dir) {
  if (!repeaters[dir]) repeaters[dir] = createHoldRepeat(stepper(dir))
  repeaters[dir].start()
}
function holdStop(dir) {
  repeaters[dir]?.stop()
}

onBeforeUnmount(() => Object.values(repeaters).forEach((r) => r.stop()))
</script>

<template>
  <div class="pad" aria-label="方向控制">
    <button class="key up" aria-label="上" @pointerdown.prevent="holdStart('up')" @pointerup="holdStop('up')" @pointerleave="holdStop('up')" @pointercancel="holdStop('up')">▲</button>
    <button class="key left" aria-label="左" @pointerdown.prevent="holdStart('left')" @pointerup="holdStop('left')" @pointerleave="holdStop('left')" @pointercancel="holdStop('left')">◀</button>
    <button class="key scroll" aria-label="撤销一步" @pointerdown.prevent="actions.undo()">↶</button>
    <button class="key right" aria-label="右" @pointerdown.prevent="holdStart('right')" @pointerup="holdStop('right')" @pointerleave="holdStop('right')" @pointercancel="holdStop('right')">▶</button>
    <button class="key down" aria-label="下" @pointerdown.prevent="holdStart('down')" @pointerup="holdStop('down')" @pointerleave="holdStop('down')" @pointercancel="holdStop('down')">▼</button>
  </div>
</template>

<style scoped>
.pad {
  position: relative;
  flex: none;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  user-select: none;
  background: radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.35) 70%);
  border: 1.5px solid rgba(255, 213, 107, 0.45);
  box-shadow: inset 0 0 22px rgba(0, 0, 0, 0.55), 0 6px 18px rgba(0, 0, 0, 0.45);
}
.key {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-soft);
  font-size: 18px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  touch-action: none;
  -webkit-user-select: none;
}
.key:active { transform: scale(0.9); }
.key.up { top: 6px; left: 50%; width: 44px; height: 40px; margin-left: -22px; }
.key.down { bottom: 6px; left: 50%; width: 44px; height: 40px; margin-left: -22px; }
.key.left { left: 6px; top: 50%; width: 40px; height: 44px; margin-top: -22px; }
.key.right { right: 6px; top: 50%; width: 40px; height: 44px; margin-top: -22px; }
.key.scroll {
  left: 50%;
  top: 50%;
  width: 50px;
  height: 50px;
  margin: -25px 0 0 -25px;
  border-radius: 50%;
  font-size: 18px;
  border: 1.5px solid rgba(255, 213, 107, 0.6);
  background: radial-gradient(circle at 35% 30%, #5a4a22, #2a2412);
  color: var(--gold);
  box-shadow: 0 0 14px rgba(255, 213, 107, 0.18);
}
.key.scroll:disabled { opacity: 0.4; }
</style>
