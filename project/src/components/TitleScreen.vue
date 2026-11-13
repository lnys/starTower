<script setup>
import { computed } from 'vue'
import { store, actions, zoneName } from '../stores/star.js'
import { img } from '../engine/images.js'
import { AUTO_SLOT } from '../engine/storage.js'
import { unlockAudio } from '../engine/audio.js'

const hasAuto = computed(() => !!store.slots.find((s) => s.name === AUTO_SLOT)?.entry)
const autoInfo = computed(() => {
  const e = store.slots.find((s) => s.name === AUTO_SLOT)?.entry
  return e ? `第 ${e.floor} 层 · ${zoneName(e.floor)}` : ''
})

// 背景漂浮光点（固定布局，避免每次渲染抖动）
const motes = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 0.53) % 9).toFixed(2),
  dur: (7 + ((i * 0.71) % 6)).toFixed(2),
  size: 2 + (i % 4),
  drift: (i % 2 ? 1 : -1) * (10 + (i % 5) * 6),
}))

function go(fn) {
  unlockAudio()
  fn()
}
</script>

<template>
  <div class="title" :style="{ backgroundImage: `url(${img('bg/menu')})` }">
    <div class="veil"></div>
    <div class="motes" aria-hidden="true">
      <span
        v-for="(m, i) in motes"
        :key="i"
        class="mote"
        :style="{
          left: m.left + '%',
          width: m.size + 'px',
          height: m.size + 'px',
          animationDelay: m.delay + 's',
          animationDuration: m.dur + 's',
          '--drift': m.drift + 'px',
        }"
      />
    </div>

    <div class="content">
      <div class="logo">
        <div class="logo-ring"></div>
        <div class="logo-cn">星穹塔</div>
        <div class="logo-en">STAR DOME TOWER · 50 层</div>
      </div>

      <nav class="menu">
        <button class="menu-btn primary" @click="go(() => actions.newGame())">
          星穹塔
          <small>新的冒险</small>
        </button>
        <button class="menu-btn" :disabled="!hasAuto" @click="go(() => actions.continueAuto())">
          继续冒险
          <small v-if="hasAuto">{{ autoInfo }}</small>
        </button>
        <button class="menu-btn" @click="go(() => actions.openModal({ type: 'saves', mode: 'load' }))">读取存档</button>
        <button class="menu-btn" @click="go(() => actions.openModal({ type: 'settings' }))">设置</button>
        <button class="menu-btn" @click="go(() => actions.openModal({ type: 'help' }))">操作说明</button>
      </nav>

      <footer class="foot">
        <span>方向键 / 滑动 移动 · 预判卡片显示战斗损失</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.title {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: #08071a;
}
.veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 50% at 50% 35%, rgba(255, 213, 107, 0.12), transparent 70%),
    linear-gradient(180deg, rgba(8, 7, 26, 0.2) 0%, rgba(8, 7, 26, 0.85) 100%);
}
.motes { position: absolute; inset: 0; pointer-events: none; }
.mote {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff6c8 0%, rgba(255, 213, 107, 0) 70%);
  box-shadow: 0 0 8px rgba(255, 213, 107, 0.7);
  opacity: 0;
  animation: rise linear infinite;
}
@keyframes rise {
  0% { transform: translate(0, 0); opacity: 0; }
  15% { opacity: 0.9; }
  100% { transform: translate(var(--drift), -110vh); opacity: 0; }
}

.content {
  position: relative;
  z-index: 1;
  width: min(420px, calc(100% - 32px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 40px 0 24px;
}

.logo {
  position: relative;
  text-align: center;
  cursor: default;
  user-select: none;
  padding: 26px 0 8px;
}
.logo-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 240px;
  height: 240px;
  transform: translate(-50%, -52%);
  border-radius: 50%;
  border: 1px solid rgba(255, 213, 107, 0.25);
  box-shadow: inset 0 0 60px rgba(255, 213, 107, 0.08), 0 0 60px rgba(255, 213, 107, 0.12);
  animation: spin 40s linear infinite;
  background: conic-gradient(from 0deg, transparent, rgba(255, 213, 107, 0.15), transparent 40%);
}
@keyframes spin { to { transform: translate(-50%, -52%) rotate(360deg); } }
.logo-cn {
  position: relative;
  white-space: nowrap;
  font-family: var(--font-display);
  font-size: min(96px, 16vh);
  line-height: 1;
  letter-spacing: 16px;
  padding-left: 16px;
  background: linear-gradient(180deg, #fff6c8 0%, #ffd54a 45%, #c98a12 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 6px 18px rgba(255, 180, 60, 0.35));
  animation: glow 3.6s ease-in-out infinite;
}
@keyframes glow {
  0%, 100% { filter: drop-shadow(0 6px 18px rgba(255, 180, 60, 0.3)); }
  50% { filter: drop-shadow(0 6px 26px rgba(255, 200, 90, 0.6)); }
}
.logo-en {
  position: relative;
  margin-top: 14px;
  font-size: 12px;
  letter-spacing: 6px;
  color: var(--gold-soft);
  opacity: 0.85;
}

.menu {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.menu-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font: inherit;
  font-size: 17px;
  letter-spacing: 2px;
  color: var(--text);
  padding: 15px 22px;
  border-radius: 16px;
  cursor: pointer;
  border: 1px solid var(--line);
  background: rgba(14, 14, 36, 0.55);
  backdrop-filter: blur(8px);
  transition: transform 0.14s ease, border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.menu-btn small { font-size: 12px; letter-spacing: 1px; color: var(--muted); }
.menu-btn:hover:not(:disabled) {
  border-color: var(--line-gold);
  background: rgba(255, 213, 107, 0.1);
  box-shadow: 0 0 24px rgba(255, 213, 107, 0.15);
  transform: translateX(4px);
}
.menu-btn:active:not(:disabled) { transform: scale(0.98); }
.menu-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.menu-btn.primary {
  border: none;
  color: #2a1a00;
  font-weight: 700;
  background: linear-gradient(135deg, #ffe58a, #e6a817);
  box-shadow: 0 10px 30px rgba(230, 168, 23, 0.3);
}
.menu-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #fff0a8, #f0b52a);
  box-shadow: 0 12px 36px rgba(230, 168, 23, 0.45);
}
.menu-btn.primary small { color: #5a3a00; }

.foot { font-size: 12px; color: var(--muted); letter-spacing: 1px; text-align: center; }

@media (max-width: 480px) {
  .logo-cn { font-size: 72px; letter-spacing: 10px; padding-left: 10px; }
  .logo-ring { width: 200px; height: 200px; }
}
</style>
