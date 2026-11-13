<script setup>
// 通关特效：旋转光芒 + 闪光 + 烟花粒子。隐藏结局使用紫蓝色调。
// 尊重系统的"减少动态效果"设置：开启时只保留静态光芒。
import { onMounted, onBeforeUnmount, ref } from 'vue'

const props = defineProps({ hidden: { type: Boolean, default: false } })
const canvas = ref(null)
const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const DURATION = 5000
let raf = 0
let parts = []
let startT = 0
let lastBurst = 0
let lastSpark = 0
let W = 0
let H = 0
let dpr = 1

function palette() {
  return props.hidden
    ? ['#8fd3ff', '#c7a2ff', '#ffffff', '#ff9ee6', '#7af5ff']
    : ['#ffe58a', '#ffd54a', '#fff6c8', '#ffb347', '#ff8a5c', '#9bffb8']
}

function burst(x, y, n) {
  const cols = palette()
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 1.6 + Math.random() * 4.8
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      decay: 0.011 + Math.random() * 0.012,
      size: 1.4 + Math.random() * 2.6,
      c: cols[(Math.random() * cols.length) | 0],
      trail: Math.random() < 0.35,
    })
  }
}

function spark() {
  const cols = palette()
  parts.push({
    x: Math.random() * W, y: -8,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 1.2 + Math.random() * 1.6,
    life: 1,
    decay: 0.004 + Math.random() * 0.004,
    size: 1 + Math.random() * 1.6,
    c: cols[(Math.random() * cols.length) | 0],
    trail: false,
  })
}

function frame(t) {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  const el = t - startT

  // 烟花：前 3.5 秒持续绽放，之后逐渐停止
  if (el < 3500 && t - lastBurst > (el < 1500 ? 420 : 680)) {
    lastBurst = t
    burst(W * (0.15 + Math.random() * 0.7), H * (0.12 + Math.random() * 0.4), 36 + ((Math.random() * 26) | 0))
  }
  // 星光雨：全程轻柔落下
  if (el < DURATION - 600 && t - lastSpark > 90) {
    lastSpark = t
    spark()
  }

  ctx.globalCompositeOperation = 'lighter'
  parts = parts.filter((p) => p.life > 0 && p.y < H + 20)
  for (const p of parts) {
    p.vx *= 0.985
    p.vy = p.vy * 0.985 + 0.045
    p.x += p.vx
    p.y += p.vy
    p.life -= p.decay
    const alpha = Math.max(0, p.life)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.c
    ctx.shadowColor = p.c
    ctx.shadowBlur = p.trail ? 10 : 6
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.4), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
  ctx.globalCompositeOperation = 'source-over'

  if (el < DURATION || parts.length) {
    raf = requestAnimationFrame(frame)
  } else {
    raf = 0
    ctx.clearRect(0, 0, W, H)
  }
}

function resize() {
  const c = canvas.value
  if (!c) return
  const rect = c.parentElement.getBoundingClientRect()
  W = rect.width
  H = rect.height
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.round(W * dpr)
  c.height = Math.round(H * dpr)
  c.style.width = `${W}px`
  c.style.height = `${H}px`
}

onMounted(() => {
  if (reduced) return
  resize()
  window.addEventListener('resize', resize)
  startT = performance.now()
  // 开场先来一簇烟花
  burst(W / 2, H * 0.35, 60)
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="ending-fx" :class="{ hidden, reduced }" aria-hidden="true">
    <div class="rays"></div>
    <div class="flash"></div>
    <canvas v-if="!reduced" ref="canvas" class="fx-canvas"></canvas>
  </div>
</template>

<style scoped>
.ending-fx {
  position: absolute;
  inset: 0;
  z-index: 51;
  pointer-events: none;
  overflow: hidden;
}
.rays {
  position: absolute;
  left: 50%;
  top: 34%;
  width: 180%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 213, 107, 0.2) 0deg 6deg,
    transparent 6deg 18deg
  );
  -webkit-mask: radial-gradient(circle, #000 0%, transparent 62%);
  mask: radial-gradient(circle, #000 0%, transparent 62%);
  animation: raySpin 36s linear infinite, rayIn 1.4s ease-out both;
}
.ending-fx.hidden .rays {
  background: repeating-conic-gradient(
    from 0deg,
    rgba(143, 211, 255, 0.22) 0deg 6deg,
    rgba(199, 162, 255, 0.12) 6deg 12deg,
    transparent 12deg 22deg
  );
}
.flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 35%, rgba(255, 246, 200, 0.85), rgba(255, 213, 107, 0) 60%);
  animation: flash 1.1s ease-out forwards;
}
.ending-fx.hidden .flash {
  background: radial-gradient(circle at 50% 35%, rgba(199, 162, 255, 0.85), rgba(143, 211, 255, 0) 60%);
}
.fx-canvas {
  position: absolute;
  left: 0;
  top: 0;
}
.ending-fx.reduced .rays { animation: none; opacity: 0.6; }
.ending-fx.reduced .flash { display: none; }

@keyframes raySpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes rayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes flash {
  0% { opacity: 0; }
  12% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
