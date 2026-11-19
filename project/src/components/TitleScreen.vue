<script setup>
import { computed } from 'vue'
import { store, actions, zoneName, tr } from '../stores/star.js'
import { img } from '../engine/images.js'
import { AUTO_SLOT } from '../engine/storage.js'
import { unlockAudio } from '../engine/audio.js'

const hasAuto = computed(() => !!store.slots.find((s) => s.name === AUTO_SLOT)?.entry)
const autoInfo = computed(() => {
  const e = store.slots.find((s) => s.name === AUTO_SLOT)?.entry
  return e ? tr('第 {0} 层 · {1}', e.floor, zoneName(e.floor)) : ''
})

const landscape = computed(() => {
  const id = store.meta.style
  return 'url(' + JSON.stringify(img(id === 'classic' ? 'bg/menu' : `bg/style-${id}`)) + ')'
})

// 固定星点分布，负延迟让动画一进页面就有层次。
const stars = Array.from({ length: 26 }, (_, i) => ({
  x: 5 + (i * 37 + 11) % 91,
  y: 4 + (i * 53 + 3) % 88,
  delay: -(i * 1.37) % 15,
  duration: 10 + (i % 7) * 1.3,
  size: 2 + (i % 3),
  drift: i % 2 ? 16 : -16,
}))

function go(fn) {
  unlockAudio()
  fn()
}
</script>

<template>
  <div class="title" :class="{ 'is-pixel': store.meta.style === 'pixel', 'motion-paused': store.modal }">
    <div class="title-backdrop" aria-hidden="true">
      <div class="landscape" :style="{ backgroundImage: landscape }"></div>
      <div class="sky-glow"></div>
      <div class="veil"></div>
      <div class="stars">
        <span
          v-for="(star, i) in stars"
          :key="i"
          class="star"
          :style="{
            left: star.x + '%', top: star.y + '%',
            width: star.size + 'px', height: star.size + 'px',
            animationDelay: star.delay + 's', animationDuration: star.duration + 's',
            '--drift': star.drift + 'px',
          }"
        />
      </div>
      <div class="meteor-track"><div class="meteor"></div></div>
    </div>

    <div class="content">
      <div class="logo">
        <div class="logo-ring"></div>
        <div class="logo-cn">{{ tr("星穹塔") }}</div>
        <div class="logo-en">{{ tr("STAR DOME TOWER · 50 层") }}</div>
      </div>

      <p class="quest">{{ tr("登上五十层，救回你的女神。") }}</p>
      <nav class="menu">
        <button class="menu-btn primary" @click="go(() => actions.newGame())">
          {{ tr("星穹塔") }}
          <small>{{ tr("新的冒险") }}</small>
        </button>
        <button class="menu-btn" :disabled="!hasAuto" @click="go(() => actions.continueAuto())">
          {{ tr("继续冒险") }}
          <small v-if="hasAuto">{{ autoInfo }}</small>
        </button>
        <button class="menu-btn" @click="go(() => actions.openModal({ type: 'saves', mode: 'load' }))">{{ tr("读取存档") }}</button>
        <button class="menu-btn" @click="go(() => actions.openModal({ type: 'settings' }))">{{ tr("设置") }}</button>
        <button class="menu-btn" @click="go(() => actions.openModal({ type: 'help' }))">{{ tr("操作说明") }}</button>
      </nav>

      <footer class="foot">
        <span>{{ tr("方向键 / 滑动 移动 · 预判卡片显示战斗损失") }}</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
:global(html[lang="en"]) .logo-cn {
  font-size: clamp(27px, min(10cqw, 7vh), 49px);
  letter-spacing: .02em;
  padding-left: 0;
}
:global(html[lang="ja"]) .logo-cn {
  font-size: clamp(40px, min(17cqw, 12vh), 72px);
  letter-spacing: .06em;
  padding-left: 0;
}
.title {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #08071a;
}
.title-backdrop { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.landscape, .sky-glow, .veil, .stars { position: absolute; inset: 0; }
.landscape {
  background-size: cover;
  background-position: center;
  transform: scale(1.08);
  animation: title-pan 26s ease-in-out infinite alternate;
}
@keyframes title-pan {
  from { transform: translate(-1.2%, 1%) scale(1.08); }
  to { transform: translate(1.4%, -1.3%) scale(1.19); }
}
.sky-glow {
  background:
    radial-gradient(ellipse at 34% 25%, color-mix(in srgb, var(--gold) 32%, transparent), transparent 49%),
    radial-gradient(ellipse at 78% 35%, color-mix(in srgb, var(--muted) 28%, transparent), transparent 47%);
  opacity: .58;
  transform: scale(1.11);
  animation: sky-breathe 12s ease-in-out infinite alternate;
}
@keyframes sky-breathe {
  from { opacity: .28; transform: translateX(-4%) scale(1.11); }
  to { opacity: .72; transform: translateX(4%) scale(1.16); }
}
.veil {
  background: linear-gradient(180deg, transparent 10%, #08071580 57%, #080715db 100%);
}
.star {
  position: absolute;
  border-radius: 50%;
  background: var(--gold-soft);
  box-shadow: 0 0 8px var(--gold);
  opacity: .35;
  animation: star-drift ease-in-out infinite alternate;
}
@keyframes star-drift {
  from { opacity: .17; transform: translate(0, 12px) scale(.7); }
  to { opacity: .83; transform: translate(var(--drift), -30px) scale(1.1); }
}
.meteor-track { position: absolute; left: 73%; top: 9%; }
.meteor {
  width: clamp(40px, 18vw, 90px);
  height: 2px;
  background: linear-gradient(90deg, var(--gold-soft), transparent);
  opacity: 0;
  animation: meteor-pass 16s linear infinite;
}
@keyframes meteor-pass {
  0%, 22% { opacity: 0; transform: translate(0, 0) rotate(-33deg); }
  24% { opacity: .85; }
  29%, 100% { opacity: 0; transform: translate(-32vw, 20vw) rotate(-33deg); }
}
.is-pixel :is(.star, .meteor) { border-radius: 0; box-shadow: none; }
.is-pixel .star { animation-timing-function: steps(10); }
.motion-paused :is(.landscape, .sky-glow, .star, .meteor, .logo-ring, .logo-cn) { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .title :is(.landscape, .sky-glow, .star, .meteor, .logo-ring, .logo-cn) { animation: none; }
  .menu-btn { transition: none; }
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

<style scoped>
:global(html[lang="en"]) .logo-cn {
  font-size: clamp(27px, min(10cqw, 7vh), 49px);
  letter-spacing: .02em;
  padding-left: 0;
}
:global(html[lang="ja"]) .logo-cn {
  font-size: clamp(40px, min(17cqw, 12vh), 72px);
  letter-spacing: .06em;
  padding-left: 0;
}
.quest { color: #e8c6da; text-align: center; font-size: 13px; margin: 20px 0; }
</style>
