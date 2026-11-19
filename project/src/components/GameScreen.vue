<script setup>
// 游戏界面：顶栏（层号与区名）、属性与钥匙、棋盘、旅途提示、操作区
import { computed, ref, watch } from 'vue'
import GameBoard from './GameBoard.vue'
import TouchPad from './TouchPad.vue'
import { store, actions, nearNpc, zoneName, tr, localizeMessage } from '../stores/star.js'
import { img } from '../engine/images.js'
import logo from '../../images/ui/tower-logo.svg?url'
import { UI_ICON, ITEM_ART } from '../engine/star-art.js'
import { zoneOf } from '../game/star/rules.js'

let brandTaps = 0
function tapBrand() {
  if (store.modal || store.game.hiddenMode) return
  if (++brandTaps === 10) actions.unlockHiddenMode()
}
watch(() => store.game, () => { brandTaps = 0 })
const g = computed(() => store.game)
const hero = computed(() => store.game.hero)
// 血量进度条的满格：本局出现过的最高生命（祭坛、药水会抬高它）；读档或新局时重置
const hpPeak = ref(store.game?.hero.hp ?? 0)
watch(() => store.game?.hero.hp, (v) => { if (v !== undefined && v > hpPeak.value) hpPeak.value = v })
watch(() => store.game, (g) => { hpPeak.value = g?.hero.hp ?? 0 })
const hpPct = computed(() => {
  const max = Math.max(hpPeak.value, hero.value.hp, 1)
  return Math.max(0, Math.min(100, (hero.value.hp / max) * 100))
})
const zone = computed(() => zoneName(store.game.floor))
const zoneClass = computed(() => `zone-${zoneOf(store.game.floor)}`)

const altarNear = computed(() => nearNpc(store.game, 'altar'))
const merchantNear = computed(() => nearNpc(store.game, 'merchant'))
const npcNear = computed(() => (altarNear.value ? 'altar' : merchantNear.value ? 'merchant' : null))
const npcLabel = computed(() => tr(npcNear.value === 'altar' ? '祭坛' : '商人'))

const hasCompass = computed(() => (store.game.items.compass ?? 0) > 0)
const undoCount = computed(() => store.game.history.length)


const KEY_NAMES = [
  ['yellowKey', '黄钥匙', 'y'],
  ['blueKey', '蓝钥匙', 'b'],
  ['redKey', '红钥匙', 'r'],
]

const notice = computed(() => store.notice ?? store.toasts.at(-1))
function openNotice() {
  if (notice.value) {
    actions.openModal({ type: 'notice', title: notice.value.title ?? '旅途提示', text: notice.value.text })
  } else {
    actions.openModal({ type: 'help' })
  }
}

function openNpc() {
  if (npcNear.value === 'altar') actions.openModal({ type: 'altar' })
  else if (npcNear.value === 'merchant') actions.openModal({ type: 'merchant' })
}

function openBag() {
  actions.openModal({ type: 'items' })
}
</script>

<template>
  <div class="game" v-if="store.game">
    <div class="hud">
      <!-- 楼层在左，Logo 与标题在右 -->
      <header class="topbar">
        <div class="floor-chip">
          <template v-if="store.meta.language === 'zh-CN'"><span class="tag">第</span><b>{{ g.floor }}</b><span class="tag">层</span></template>
          <b v-else>{{ tr("第 {0} 层", g.floor) }}</b>
          <em>{{ zone }}</em>
        </div>
        <button class="brand" @click="tapBrand" :aria-label="tr('星穹塔')">
          <img class="brand-logo" :src="logo" alt="" width="32" height="32" />
          <span class="brand-name">{{ tr("星穹塔") }}</span>
        </button>
      </header>

      <!-- 勇士面板：头像、生命、攻防；右侧为持有的特殊道具 -->
      <section class="panel">
        <div class="avatar"><img :src="img(UI_ICON.hero, store.meta.style === 'pixel')" :alt="tr('勇士')" /></div>
        <div class="status">
          <div class="hp-row">
            <span class="hp-lbl">{{ tr("生命") }}</span>
            <div class="hp-bar" :class="{ low: hpPct <= 25 }">
              <div class="hp-fill" :style="{ width: hpPct + '%' }"></div>
              <span class="hp-text">{{ hero.hp }}<small v-if="hpPeak > hero.hp"> / {{ hpPeak }}</small></span>
            </div>
          </div>
          <div class="stats">
            <span class="chip atk"><img :src="img(UI_ICON.atk)" alt="" />{{ tr("攻击") }} <b>{{ hero.atk }}</b></span>
            <span class="chip def"><img :src="img(UI_ICON.def)" alt="" />{{ tr("防御") }} <b>{{ hero.def }}</b></span>
            <span class="chip undo">{{ tr("撤销") }} {{ undoCount }}/50</span>
          </div>
        </div>
      </section>

      <!-- 钥匙：在勇士面板下面，三色一行 -->
      <div class="keys-row">
        <span class="res gold"><img :src="img(UI_ICON.gold)" alt="" />{{ tr("金币") }}<b>{{ hero.gold }}</b></span>
        <span v-for="[k, name, c] in KEY_NAMES" :key="k" class="res key" :class="c" :aria-label="`${tr(name)}: ${hero.keys[k]}`" :title="tr(name)">
          <img :src="img(ITEM_ART[k])" alt="" /><span class="key-name">{{ tr(name) }}</span><b>{{ hero.keys[k] }}</b>
        </span>
      </div>
    </div>

    <main class="board-slot" :class="zoneClass">
      <GameBoard />
    </main>

    <button class="travel-notice" type="button" :disabled="!!store.modal" @click="openNotice">
      <span class="notice-icon" aria-hidden="true">{{ store.notice ? '◈' : 'ⓘ' }}</span>
      <span class="notice-text" aria-live="polite">{{ localizeMessage(notice?.text || '旅途提示 · 点击查看操作说明') }}</span>
      <span aria-hidden="true">›</span>
    </button>

    <!-- 底部操作区：左（存档、菜单）· 中（方向盘）· 右（罗盘、NPC、背包） -->
    <footer class="ctrl">
      <div class="side">
        <button class="btn" :disabled="!!store.modal" @click="actions.openModal({ type: 'saves', mode: 'save' })">{{ tr("快速存档") }}</button>
        <button class="btn" :disabled="!!store.modal" @click="actions.openModal({ type: 'pause' })">{{ tr("菜单") }}</button>
      </div>
      <TouchPad />
      <div class="side">
        <button class="btn alt" :disabled="!hasCompass || !!store.modal" @click="actions.openModal({ type: 'compass' })">{{ tr("罗盘") }}</button>
        <button class="btn alt" :disabled="!npcNear || !!store.modal" @click="openNpc">{{ npcLabel }}</button>
        <button class="btn alt" :disabled="!!store.modal" @click="openBag">{{ tr("背包") }}</button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
:global(html:not([lang="zh-CN"])) .floor-chip b { font-size: clamp(13px, 5cqw, 21px); }
:global(html[lang="en"]) .brand-name { font-size: 12px; letter-spacing: .02em; }
:global(html[lang="en"]) .key-name { display: none; }
:global(html:not([lang="zh-CN"])) .btn { font-size: 11px; letter-spacing: 0; white-space: normal; }
.game {
  position: relative;
  z-index: 1;
  height: 100dvh;
  min-height: 0;
  container-type: size;
  padding: calc(6px + env(safe-area-inset-top, 0px)) 3px calc(8px + env(safe-area-inset-bottom, 0px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 40px auto;
  grid-template-areas: 'hud' 'board' 'notice' 'controls';
  gap: 4px;
  overflow: hidden;
}

.hud { grid-area: hud; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0 7px;
}
.floor-chip { display: flex; align-items: baseline; gap: 3px; min-width: 0; white-space: nowrap; }
.floor-chip .tag { font-size: 11px; color: var(--gold-soft); }
.floor-chip b {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1;
  color: var(--gold);
  text-shadow: 0 0 14px rgba(255, 213, 107, 0.4);
}
.floor-chip em { font-style: normal; font-size: 10px; color: var(--muted); margin-left: 4px; overflow: hidden; text-overflow: ellipsis; }
.brand { flex: none; border: 0; background: transparent; padding: 0; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.brand-logo { display: block; object-fit: contain; }
.brand-name {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 3px;
  background: linear-gradient(180deg, #fff6c8 0%, #ffd54a 50%, #c98a12 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
}
.keys-row { flex: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
.keys-row .res { font-size: 10.5px; padding: 4px 6px; gap: 3px; justify-content: space-between; }
.keys-row .res img { width: 14px; height: 14px; }
.keys-row .res.gold { font-family: inherit; font-size: 10.5px; color: var(--gold); }
.keys-row .res.gold b { font-family: var(--font-display); font-weight: 400; font-size: 13px; color: var(--gold); }
.res {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--text);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  white-space: nowrap;
  min-width: 0;
}
.res img { width: 16px; height: 16px; }
.res.gold { color: var(--gold); font-family: var(--font-display); font-size: 14px; }
.res.key { flex: 1; justify-content: space-between; }
.res.key b { font-family: var(--font-display); font-weight: 400; font-size: 13px; }
.res.key img { width: 18px; height: 18px; object-fit: contain; flex: none; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5)); }
.res.y { border-color: rgba(255, 213, 107, 0.3); }
.res.y b { color: #ffd54a; }
.res.b { border-color: rgba(111, 182, 255, 0.3); }
.res.b b { color: #8cc4ff; }
.res.r { border-color: rgba(255, 122, 122, 0.3); }
.res.r b { color: #ff9a9a; }

/* 勇士面板 */
.panel {
  flex: none;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
  padding: 4px 7px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015)), var(--panel);
  border: 1px solid var(--line);
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 40%, rgba(255, 213, 107, 0.2), rgba(0, 0, 0, 0.4));
  border: 1px solid var(--line-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar img { width: 38px; height: 38px; image-rendering: pixelated; }
.status { display: flex; flex-direction: column; justify-content: center; gap: 3px; min-width: 0; }
.hp-row { display: flex; align-items: center; gap: 6px; }
.hp-lbl { flex: none; font-size: 11px; letter-spacing: 1px; color: #ff9aa6; }
.hp-bar {
  position: relative;
  flex: 1;
  height: 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.hp-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #e0243a, #ff5d6c);
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.hp-bar.low .hp-fill { background: linear-gradient(90deg, #ff1f3d, #ff7a85); animation: hpPulse 1s ease-in-out infinite; }
@keyframes hpPulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.35); } }
.hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.hp-text small { font-size: 10px; opacity: 0.75; margin-left: 2px; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.stats .chip { justify-content: center; min-width: 0; overflow: hidden; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.05);
  white-space: nowrap;
}
.chip img { width: 13px; height: 13px; }
.chip b { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text); }
.chip.atk b { color: #ffc2ae; }
.chip.def b { color: #bfe3ff; }
.chip.undo { color: var(--muted); }

/* 棋盘区：占据剩余高度，棋盘按宽高取较小值居中 */
.board-slot {
  /* 棋盘底座：磨砂玻璃托盘。顶部区域色聚光、底部压暗、渐变描边、柔和的外发光 */
  --tint: rgba(60, 70, 140, 0.35);
  position: relative;
  grid-area: board;
  min-width: 0;
  min-height: 0;
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
  border-radius: 22px;
  background:
    radial-gradient(120% 60% at 50% -8%, var(--tint), transparent 62%),
    radial-gradient(90% 50% at 50% 115%, rgba(0, 0, 0, 0.55), transparent 65%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.015));
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 18px 44px rgba(0, 0, 0, 0.5),
    0 0 48px var(--glow, rgba(60, 70, 140, 0.35));
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 渐变描边：左上亮、右下淡金，用遮罩只留边框 */
.board-slot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.05) 42%, rgba(255, 213, 107, 0.32));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.travel-notice {
  grid-area: notice;
  min-width: 0;
  margin-inline: 7px;
  display: flex;
  align-items: center;
  text-align: left;
  gap: 7px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--gold-soft);
  background: #201a29;
  border: 1px solid var(--line-gold);
  border-radius: 8px;
  cursor: pointer;
}
.notice-icon { font-size: 15px; }
.notice-text { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* 底部操作区：左右两列按钮，中间圆形方向盘 */
.ctrl {
  grid-area: controls;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 146px;
  --pad-size: clamp(106px, 35cqw, 146px);
  gap: 6px;
}
.side { display: flex; flex-direction: column; gap: 5px; width: min(85px, 28%); min-width: 0; }
.btn {
  white-space: nowrap;
  padding-inline: 3px;
  height: 38px;
  border-radius: 12px;
  font: inherit;
  font-size: 13px;
  letter-spacing: 1px;
  color: #d7fff0;
  background: linear-gradient(180deg, #2fbf86, #1d8a60);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}
.btn.alt { color: #e8ecff; background: linear-gradient(180deg, #7b7fd6, #4f53a8); }
.btn:disabled { opacity: 0.4; }
.btn:active:not(:disabled) { transform: scale(0.97); }

@media (max-height: 720px) {
  .ctrl { height: 120px; --pad-size: clamp(98px, 35cqw, 114px); }
  .ctrl .btn { height: 34px; }
}
@media (orientation: landscape) and (max-height: 600px) and (pointer: coarse) {
  .game {
    grid-template-columns: minmax(0, 1fr) minmax(232px, 44%);
    grid-template-rows: auto minmax(0, 1fr) 40px;
    grid-template-areas: 'board hud' 'board controls' 'notice controls';
    padding-inline: max(3px, env(safe-area-inset-left)) max(3px, env(safe-area-inset-right));
  }
  .ctrl { align-self: center; --pad-size: clamp(82px, 17cqw, 114px); }
  .side { width: min(85px, calc((100% - var(--pad-size) - 12px) / 2)); }
}
</style>
