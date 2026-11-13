<script setup>
// 打字机式剧情框：逐字显示，点击可跳过本句；全部显示后可继续
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  lines: { type: Array, required: true },
  buttonText: { type: String, default: '继续' },
  speed: { type: Number, default: 34 },
  // 是否响应全局 Enter/空格键。结局等需要玩家明确操作的场景应关闭
  keyboard: { type: Boolean, default: true },
  // 点击文字区域是否推进。结局场景关闭，只能通过按钮推进
  clickToAdvance: { type: Boolean, default: true },
  // 是否显示「跳过全部」（结局场景不需要）
  skippable: { type: Boolean, default: true },
})
const emit = defineEmits(['done', 'skip'])

const index = ref(0)
const shown = ref('')
const typing = ref(false)
let timer = null

const current = computed(() => props.lines[index.value] ?? '')
const isLast = computed(() => index.value >= props.lines.length - 1)
const progress = computed(() => `${index.value + 1} / ${props.lines.length}`)

function stopTimer() {
  clearInterval(timer)
  timer = null
}

function startLine() {
  stopTimer()
  const full = current.value
  let i = 0
  shown.value = ''
  typing.value = true
  if (!full) {
    typing.value = false
    return
  }
  timer = setInterval(() => {
    i++
    shown.value = full.slice(0, i)
    if (i >= full.length) finishLine()
  }, props.speed)
}

function finishLine() {
  stopTimer()
  typing.value = false
  shown.value = current.value
}

function next() {
  if (typing.value) {
    finishLine()
    return
  }
  if (!isLast.value) {
    index.value++
    startLine()
  } else {
    emit('done')
  }
}

function onKey(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    next()
  }
}

watch(() => props.lines, () => {
  index.value = 0
  startLine()
})

onMounted(() => {
  startLine()
  if (props.keyboard) window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  stopTimer()
  if (props.keyboard) window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="story" :class="{ 'no-click': !clickToAdvance }" @click="clickToAdvance && next()">
    <div v-if="title" class="story-title">{{ title }}</div>
    <p class="story-text">
      {{ shown }}<span v-if="typing" class="caret">▍</span>
    </p>
    <div class="story-foot">
      <div class="foot-left">
        <span class="progress">{{ progress }}</span>
        <button v-if="skippable" class="skip-btn" @click.stop="emit('skip')">跳过全部</button>
      </div>
      <button class="story-btn" @click.stop="next">
        {{ typing ? '看完本句' : isLast ? buttonText : '下一句 ▸' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.story {
  cursor: pointer;
  padding: 6px 4px 2px;
}
.story.no-click { cursor: default; }
.story-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--gold);
  letter-spacing: 2px;
  text-shadow: 0 0 16px rgba(255, 213, 107, 0.4);
  margin-bottom: 14px;
}
.story-text {
  min-height: 96px;
  margin: 0;
  font-size: 17px;
  line-height: 1.9;
  color: var(--text);
}
.caret {
  color: var(--gold);
  animation: blink 0.8s steps(2) infinite;
  margin-left: 2px;
}
@keyframes blink { 50% { opacity: 0; } }
.story-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}
.foot-left { display: flex; align-items: center; gap: 12px; }
.progress { font-size: 12px; color: var(--muted); letter-spacing: 1px; }
.skip-btn {
  font: inherit;
  font-size: 12px;
  color: var(--muted);
  background: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
}
.skip-btn:hover { color: var(--gold); border-color: var(--line-gold); }
.story-btn {
  font: inherit;
  font-size: 14px;
  padding: 9px 18px;
  border-radius: 999px;
  color: #2a1a00;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #ffe58a, #e6a817);
  box-shadow: 0 6px 18px rgba(230, 168, 23, 0.35);
  font-weight: 700;
}
.story-btn:active { transform: scale(0.96); }
</style>
