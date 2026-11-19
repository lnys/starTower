<script setup>
// 11×11 棋盘：地形来自引擎的 world[floor].terr，实体来自 world[floor].ents，战斗标记来自引擎的 preview()
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { store, actions, itemName, previewAt, tr } from '../stores/star.js'
import { img } from '../engine/images.js'
import { ZONE_TILES, TERRAIN_ART, NPC_ART, MONSTER_ART, ITEM_ART, UI_ICON } from '../engine/star-art.js'
import { zoneOf } from '../game/star/rules.js'
import { MONSTERS } from '../game/star/data.js'

const NPC_PH = { guide: '🧙', altar: '💎', merchant: '🏪' }
const TERRAIN_LABEL = { '%': '裂', a: '机关' }
const WALL_CH = new Set(['#', 'w', '%', 'a'])

const zone = computed(() => (store.game ? zoneOf(store.game.floor) : 1))

const boardArt = (key) => img(key, store.meta.style === 'pixel')

function phChar(name) {
  return [...name][0] ?? '?'
}

function entityView(ent) {
  if (!ent) return null
  if (ent.kind === 'monster') {
    const name = itemName(ent.id)
    return {
      kind: 'monster',
      boss: !!MONSTERS[ent.id]?.boss,
      finalBoss: ent.id === 'endLord',
      art: boardArt(MONSTER_ART[ent.id] ?? ''),
      ph: phChar(name),
      title: name + (MONSTERS[ent.id]?.boss ? tr('（BOSS）') : ''),
    }
  }
  if (ent.kind === 'npc') {
    return {
      kind: 'npc',
      boss: false,
      art: boardArt(NPC_ART[ent.id] ?? ''),
      ph: NPC_PH[ent.id] ?? '?',
      title: itemName(ent.id),
    }
  }
  return {
    kind: 'item',
    boss: false,
    art: boardArt(ITEM_ART[ent.id] ?? ''),
    ph: phChar(itemName(ent.id)),
    title: itemName(ent.id),
  }
}

const cells = computed(() => {
  const g = store.game
  if (!g) return []
  const w = g.world[g.floor]
  const tiles = ZONE_TILES[zone.value]
  const out = []
  for (let y = 0; y < 11; y++) {
    for (let x = 0; x < 11; x++) {
      const ch = w.terr[y][x]
      const k = `${x},${y}`
      const ent = w.ents[k] ?? null
      let base = WALL_CH.has(ch) ? tiles.wall : tiles.floor
      if (ch === '*') base = 'tiles/floor_void'
      if (ch === '~') base = 'tiles/floor_lava'
      const ev = entityView(ent)
      // 怪物头顶的伤害数字：能打且活下来为绿色（数字为预计损失），否则红色
      let badge = null
      if (ent && ent.kind === 'monster') {
        const p = previewAt(g, x, y)
        if (p) badge = p.canFight ? { text: String(p.loss), cls: 'ok' } : { text: p.reason === 'unpierceable' ? '×' : tr('死'), cls: 'bad' }
      }
      const cls = ch === '~' ? 'lava' : ''
      out.push({
        key: k,
        x,
        y,
        wall: WALL_CH.has(ch),
        tint: ch !== '*' && ch !== '~',
        cls,
        bg: g.floor === 50 ? 'none' : `url("${boardArt(base)}")`,
        overlay: g.floor === 50 && ch === '*' ? '' : boardArt(TERRAIN_ART[ch] ?? ''),
        label: TERRAIN_LABEL[ch] ?? '',
        ent: ev,
        badge,
        title: ev ? ev.title : '',
      })
    }
  }
  return out
})

const finalBoss = computed(() => cells.value.find(c => c.ent?.finalBoss))
const finalBossStyle = computed(() => finalBoss.value ? {
  left: `calc(${finalBoss.value.x - .75} * var(--cw))`,
  top: `calc(${finalBoss.value.y - .3} * var(--ch))`,
} : {})

const heroSrc = computed(() => boardArt(UI_ICON.hero))
const heroStyle = computed(() => ({
  left: `calc(${store.game.hero.x} * var(--cw))`,
  top: `calc(${store.game.hero.y} * var(--ch))`,
}))

function floatStyle(f) {
  return {
    left: `calc(${f.x} * var(--cw) + var(--cw) / 2)`,
    top: `calc(${f.y} * var(--ch) + var(--ch) * 0.1)`,
  }
}

/* 受击震动 */
const shaking = ref(false)
let shakeTimer = null
watch(
  () => store.shakeKey,
  () => {
    shaking.value = false
    requestAnimationFrame(() => {
      shaking.value = true
      clearTimeout(shakeTimer)
      shakeTimer = setTimeout(() => (shaking.value = false), 320)
    })
  },
)
onBeforeUnmount(() => clearTimeout(shakeTimer))

/* 点击相邻格子移动；滑动屏幕移动 */
function dirBetween(dx, dy) {
  if (dx === 1 && dy === 0) return 'right'
  if (dx === -1 && dy === 0) return 'left'
  if (dx === 0 && dy === 1) return 'down'
  if (dx === 0 && dy === -1) return 'up'
  return null
}

function onCellClick(x, y) {
  if (store.modal) return
  const preview = previewAt(store.game, x, y)
  if (preview) {
    actions.openModal({ type: 'battle', preview })
    return
  }
  const dir = dirBetween(x - store.game.hero.x, y - store.game.hero.y)
  if (dir) actions.move(dir)
}

let touch = null
function onTouchStart(e) {
  const t = e.touches[0]
  touch = { x: t.clientX, y: t.clientY }
}
function onTouchEnd(e) {
  if (!touch) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touch.x
  const dy = t.clientY - touch.y
  touch = null
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return
  if (Math.abs(dx) > Math.abs(dy)) actions.move(dx > 0 ? 'right' : 'left')
  else actions.move(dy > 0 ? 'down' : 'up')
}
</script>

<template>
  <div class="board-frame" :class="`zone-${zone}`" v-if="store.game">
    <div class="board" :class="{ shake: shaking, 'rescue-garden': store.game.floor === 50 }" :style="store.game.floor === 50 ? { backgroundImage: `url(${img('bg/rescue-garden')})` } : {}" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div class="grid">
        <div
          v-for="c in cells"
          :key="c.key"
          class="cell"
          :class="[{ wall: c.wall, 'skin-tint': c.tint }, c.cls]"
          :style="{ backgroundImage: c.bg }"
          :title="c.title"
          @click="onCellClick(c.x, c.y)"
        >
          <img v-if="c.overlay" class="ov" :src="c.overlay" alt="" draggable="false" />
          <span v-if="c.badge" class="dmg" :class="c.badge.cls">{{ c.badge.text }}</span>
          <span v-if="c.label" class="terr-label">{{ tr(c.label) }}</span>
          <template v-if="c.ent">
            <img
              v-if="c.ent.art && !c.ent.finalBoss"
              :src="c.ent.art"
              :class="c.ent.kind === 'monster' ? 'mon' : 'pop'"
              :title="c.ent.title"
              alt=""
              draggable="false"
            />
            <span v-else-if="!c.ent.finalBoss" class="ph" :class="[c.ent.kind, { boss: c.ent.boss }]">{{ c.ent.ph }}</span>
          </template>
        </div>
      </div>

      <div v-if="finalBoss" class="final-boss" :style="finalBossStyle" :aria-label="tr('终焉女妖')">
        <img :src="finalBoss.ent.art" :alt="tr('终焉女妖')" draggable="false" />
      </div>
      <img class="hero" :src="heroSrc" :style="heroStyle" :alt="tr('勇者')" draggable="false" />

      <div v-for="f in store.floats" :key="f.id" class="float" :class="f.kind" :style="floatStyle(f)">
        {{ f.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-frame {
  /* 与 Flutter 一样保持 11×11 正方形，按棋盘区的可用宽高取较小值。 */
  --cell: min(60px, calc((100cqw - 2px) / 11), calc((100cqh - 2px) / 11));
  --cw: var(--cell);
  --ch: var(--cell);
  position: relative;
  width: calc(var(--cw) * 11 + 2px);
  height: calc(var(--ch) * 11 + 2px);
  flex: none;
  border-radius: 12px;
  padding: 1px;
  background: #07070f;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.07), 0 8px 22px rgba(0, 0, 0, 0.5);
}

.board {
  position: relative;
  width: calc(var(--cw) * 11);
  height: calc(var(--ch) * 11);
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
  touch-action: manipulation;
}
.board.shake { animation: shake 0.32s ease; }
@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-3px, 2px); }
  40% { transform: translate(3px, -2px); }
  60% { transform: translate(-2px, -1px); }
  80% { transform: translate(2px, 1px); }
}

.grid {
  display: grid;
  grid-template-columns: repeat(11, var(--cw));
  grid-template-rows: repeat(11, var(--ch));
}
.cell {
  position: relative;
  width: var(--cw);
  height: var(--ch);
  background-size: 100% 100%;
  background-color: #1a1a2e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rescue-garden { background-size: 100% 100%; }
.rescue-garden .cell { background-color: transparent; }
.cell.wall { cursor: default; }
.cell:hover:not(.wall) { box-shadow: inset 0 0 0 2px rgba(255, 213, 107, 0.35); }
.cell.lava { box-shadow: inset 0 0 10px rgba(255, 110, 40, 0.7); }

.cell .ov {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.terr-label {
  position: absolute;
  top: 1px;
  left: 2px;
  font-size: calc(var(--cell) * 0.26);
  line-height: 1;
  font-weight: 800;
  color: #ffe9b0;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 3px;
  padding: 1px 2px;
  pointer-events: none;
}
.cell img {
  width: 84%;
  height: 84%;
  object-fit: contain;
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.45));
  pointer-events: none;
  position: relative;
}
.cell img.pop { animation: pop 2.8s ease-in-out infinite; }
.cell img.mon { width: 90%; height: 90%; animation: bob 2.4s ease-in-out infinite; }

/* 文字占位：没有对应素材时使用，取名称首字 */
.ph {
  position: relative;
  width: 78%;
  height: 78%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: calc(var(--cell) * 0.42);
  color: #fff;
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 55%), #6a4ca8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.ph.monster { background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 55%), #8a2e3e; }
.ph.npc { background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 55%), #a77a18; }
.ph.item { background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 55%), #2f7a8a; }
.ph.boss { box-shadow: 0 0 0 2px #ffd54a, 0 0 10px rgba(255, 213, 107, 0.7); }

.final-boss {
  position: absolute;
  width: calc(var(--cw) * 2.5);
  height: calc(var(--ch) * 2.2);
  z-index: 2;
  pointer-events: none;
  filter: drop-shadow(0 0 8px #a6174c);
}
.final-boss img { width: 100%; height: 100%; object-fit: contain; }
.hero {
  position: absolute;
  width: var(--cw);
  height: var(--ch);
  padding: calc(var(--cell) * 0.05);
  box-sizing: border-box;
  transition: left 0.18s cubic-bezier(0.3, 0.7, 0.4, 1), top 0.18s cubic-bezier(0.3, 0.7, 0.4, 1);
  z-index: 3;
  pointer-events: none;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6));
  animation: heroIdle 1.8s ease-in-out infinite;
}

.float {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, 0);
  font-weight: 800;
  font-size: calc(var(--cell) * 0.36);
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5), 0 0 12px currentColor;
  pointer-events: none;
  white-space: nowrap;
  animation: floatUp 0.95s ease-out forwards;
}
.float.hurt { color: #ff5d6c; }
.float.heal { color: #5cf08c; }
.float.stat { color: #ffd54a; }
@keyframes floatUp {
  0% { opacity: 0; transform: translate(-50%, 10px) scale(0.7); }
  15% { opacity: 1; transform: translate(-50%, 0) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -34px) scale(1); }
}
@keyframes bob {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.03); }
}
@keyframes pop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes heroIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.dmg {
  position: absolute;
  top: 1px;
  right: 1px;
  z-index: 3;
  min-width: calc(var(--cell) * 0.46);
  padding: 0 calc(var(--cell) * 0.08);
  border-radius: 6px;
  text-align: center;
  font-family: var(--font-display);
  font-size: calc(var(--cell) * 0.3);
  line-height: 1.5;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
.dmg.ok { background: rgba(35, 150, 80, 0.92); }
.dmg.bad { background: rgba(190, 40, 60, 0.92); }
</style>
