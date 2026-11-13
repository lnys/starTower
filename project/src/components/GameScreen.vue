<script setup>
// 游戏界面：顶栏（层号与区名）、属性与钥匙、棋盘、战斗预判卡片、操作区
import { computed, ref, watch } from 'vue'
import GameBoard from './GameBoard.vue'
import TouchPad from './TouchPad.vue'
import { store, actions, adjacentFights, nearNpc, zoneName } from '../stores/star.js'
import { img } from '../engine/images.js'
import { UI_ICON, ITEM_ART } from '../engine/star-art.js'
import { ACTIVE } from '../game/star/data.js'
import { zoneOf } from '../game/star/rules.js'

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

// 与勇者相邻的怪物 + 引擎给出的战斗预判（界面只展示，不重算）
const fights = computed(() => adjacentFights(store.game))
// 停靠在棋盘右侧；勇者在右半边（x>=5）时改停靠左侧，始终不挡住勇者自己
const dock = computed(() => (hero.value.x >= 5 ? 'left' : 'right'))
const shownFights = computed(() => fights.value.slice(0, 3))
const hiddenFights = computed(() => Math.max(0, fights.value.length - 3))

const altarNear = computed(() => nearNpc(store.game, 'altar'))
const merchantNear = computed(() => nearNpc(store.game, 'merchant'))
const npcNear = computed(() => (altarNear.value ? 'altar' : merchantNear.value ? 'merchant' : null))
const npcLabel = computed(() => (npcNear.value === 'altar' ? '祭坛' : npcNear.value === 'merchant' ? '商人' : '商店'))

const hasCompass = computed(() => (store.game.items.compass ?? 0) > 0)
const bagCount = computed(() => Object.keys(ACTIVE).filter((k) => (store.game.items[k] ?? 0) > 0).length)
const undoCount = computed(() => store.game.history.length)


const KEY_NAMES = [
  ['yellowKey', '黄钥匙', 'y'],
  ['blueKey', '蓝钥匙', 'b'],
  ['redKey', '红钥匙', 'r'],
]

function verdictOf(pv) {
  if (pv.canFight) return '可以击败'
  return pv.reason === 'unpierceable' ? '无法破防' : '会死亡'
}

function needOf(pv) {
  if (pv.reason === 'unpierceable') return `攻击需大于 ${pv.monster.def}`
  return `${pv.loss + 1}`
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
    <!-- 顶部：楼层在最左，旁边是 logo 与标题，背包在最右 -->
    <header class="topbar">
      <div class="floor-chip">
        <span class="tag">第</span><b>{{ g.floor }}</b><span class="tag">层</span>
        <em>{{ zone }}</em>
      </div>
      <div class="brand">
        <span class="logo-ring">星</span>
        <span class="brand-name">星穹塔</span>
      </div>
      <span></span>
    </header>

    <!-- 勇士面板：头像、生命、攻防；右侧为持有的特殊道具 -->
    <section class="panel">
      <div class="avatar"><img :src="img(UI_ICON.hero)" alt="勇士" /></div>
      <div class="status">
        <div class="hp-row">
          <span class="hp-lbl">生命</span>
          <div class="hp-bar" :class="{ low: hpPct <= 25 }">
            <div class="hp-fill" :style="{ width: hpPct + '%' }"></div>
            <span class="hp-text">{{ hero.hp }}<small v-if="hpPeak > hero.hp"> / {{ hpPeak }}</small></span>
          </div>
        </div>
        <div class="stats">
          <span class="chip atk"><img :src="img(UI_ICON.atk)" alt="" />攻击 <b>{{ hero.atk }}</b></span>
          <span class="chip def"><img :src="img(UI_ICON.def)" alt="" />防御 <b>{{ hero.def }}</b></span>
          <span class="chip undo">撤销 {{ undoCount }}/50</span>
        </div>
      </div>
    </section>

    <!-- 钥匙：在勇士面板下面，三色一行 -->
    <div class="keys-row">
      <span class="res gold"><img :src="img(UI_ICON.gold)" alt="" />金币<b>{{ hero.gold }}</b></span>
      <span v-for="[k, name, c] in KEY_NAMES" :key="k" class="res key" :class="c">
        <img :src="img(ITEM_ART[k])" alt="" />{{ name }}<b>{{ hero.keys[k] }}</b>
      </span>
    </div>

    <!-- 棋盘：占满宽度；战斗预判叠在棋盘右侧或左侧 -->
    <main class="board-slot" :class="zoneClass">
      <GameBoard />

      <div v-if="fights.length" class="fight-overlay" :class="dock">
        <div
          v-for="f in shownFights"
          :key="`${f.x},${f.y}`"
          class="fight-card"
          :class="f.pv.canFight ? 'ok' : 'bad'"
        >
          <div class="fc-top">
            <b class="fc-name">{{ f.pv.monster.name }}<em v-if="f.pv.monster.boss">BOSS</em></b>
            <span class="fc-verdict">{{ verdictOf(f.pv) }}</span>
          </div>
          <div class="fc-stat">生命 {{ f.pv.monster.hp }} · 攻击 {{ f.pv.monster.atk }} · 防御 {{ f.pv.monster.def }}</div>
          <div class="fc-row">
            <span>我方每回合 <b>{{ f.pv.perHit ?? '—' }}</b></span>
            <span>怪物每回合 <b>{{ f.pv.perRound ?? '—' }}</b></span>
            <span>回合数 <b>{{ f.pv.rounds ?? '—' }}</b></span>
          </div>
          <div class="fc-row">
            <span>预计损失 <b class="loss">{{ f.pv.reason === 'unpierceable' ? '—' : f.pv.loss }}</b></span>
            <span class="fc-need">需要血量至少 <b>{{ needOf(f.pv) }}</b>（当前 {{ hero.hp }}）</span>
          </div>
        </div>
        <div v-if="hiddenFights" class="fc-more">还有 {{ hiddenFights }} 只怪物</div>
      </div>
    </main>

    <!-- 底部操作区：左（存档、菜单）· 中（方向盘）· 右（罗盘、NPC、背包） -->
    <footer class="ctrl">
      <div class="side">
        <button class="btn" :disabled="!!store.modal" @click="actions.openModal({ type: 'saves', mode: 'save' })">快速存档</button>
        <button class="btn" :disabled="!!store.modal" @click="actions.openModal({ type: 'pause' })">菜单</button>
      </div>
      <TouchPad />
      <div class="side">
        <button class="btn alt" :disabled="!hasCompass || !!store.modal" @click="actions.openModal({ type: 'compass' })">罗盘</button>
        <button class="btn alt" :disabled="!npcNear || !!store.modal" @click="openNpc">{{ npcLabel }}</button>
        <button class="btn alt" :disabled="bagCount === 0 || !!store.modal" @click="openBag">背包</button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.game {
  position: relative;
  z-index: 1;
  height: 100dvh;
  min-height: 0;
  container-type: size;
  padding: calc(6px + env(safe-area-inset-top, 0px)) 3px calc(8px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

/* 顶部行：楼层 · logo 与标题 · 背包 */
.topbar {
  flex: none;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
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
.brand { display: flex; align-items: center; gap: 6px; }
.logo-ring {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 213, 107, 0.6);
  box-shadow: 0 0 10px rgba(255, 213, 107, 0.25), inset 0 0 8px rgba(255, 213, 107, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--gold);
  background: radial-gradient(circle, rgba(255, 213, 107, 0.2), transparent 70%);
}
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
.bag {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  font: inherit;
  cursor: pointer;
}
.bag:disabled { opacity: 0.4; }
.bag-ico { font-size: 13px; color: #8a8fa6; }
.bag-txt { font-size: 11px; color: #8a8fa6; letter-spacing: 1px; }

/* 资源栏（金币）与钥匙行（勇士面板下面） */
.strip { flex: none; display: flex; align-items: center; gap: 6px; }
.keys-row { flex: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
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
  grid-template-columns: 62px 1fr;
  gap: 8px;
  padding: 8px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015)), var(--panel);
  border: 1px solid var(--line);
}
.avatar {
  width: 62px;
  height: 62px;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 40%, rgba(255, 213, 107, 0.2), rgba(0, 0, 0, 0.4));
  border: 1px solid var(--line-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar img { width: 52px; height: 52px; image-rendering: pixelated; }
.status { display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 0; }
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
  padding: 3px 8px;
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
  flex: 1 1 auto;
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
/* 暗角：让棋盘边缘略暗，中间更亮，形成景深 */
.board-slot::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 17px;
  background: radial-gradient(ellipse at 50% 45%, transparent 58%, rgba(0, 0, 0, 0.38) 100%);
  pointer-events: none;
}
.board-slot.zone-1 { --glow: rgba(214, 160, 90, 0.28); --tint: rgba(214, 160, 90, 0.22); }
.board-slot.zone-2 { --glow: rgba(90, 120, 170, 0.35); --tint: rgba(90, 120, 170, 0.28); }
.board-slot.zone-3 { --glow: rgba(120, 90, 200, 0.35); --tint: rgba(120, 90, 200, 0.28); }
.board-slot.zone-4 { --glow: rgba(230, 110, 40, 0.4); --tint: rgba(230, 110, 40, 0.24); }
.board-slot.zone-5 { --glow: rgba(90, 80, 200, 0.4); --tint: rgba(90, 80, 200, 0.28); }

.fight-overlay {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50%;
  max-height: calc(100% - 10px);
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(8, 8, 20, 0.5);
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}
.fight-overlay.right { right: 6px; }
.fight-overlay.left { left: 6px; }
.fc-more { font-size: 10px; color: var(--muted); text-align: center; }
.fight-card {
  flex: none;
  padding: 5px 7px 6px;
  border-radius: 10px;
  background: rgba(10, 10, 24, 0.88);
  backdrop-filter: blur(4px);
  border: 1.5px solid;
  font-size: 10.5px;
  line-height: 1.4;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
}
.fight-card.ok { border-color: #6ee7a0; }
.fight-card.bad { border-color: #ff5d6c; }
.fc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.fc-name { font-family: var(--font-display); font-size: 13px; font-weight: 400; letter-spacing: 1px; color: var(--gold); white-space: nowrap; }
.fc-name em {
  margin-left: 6px;
  font-style: normal;
  font-size: 10px;
  letter-spacing: 1px;
  padding: 1px 5px;
  border-radius: 4px;
  color: #2a1a00;
  background: #ffd54a;
  vertical-align: middle;
}
.fc-verdict { font-size: 11px; font-weight: 800; white-space: nowrap; }
.fight-card.ok .fc-verdict { color: #6ee7a0; }
.fight-card.bad .fc-verdict { color: #ff7a85; }
.fc-stat { color: var(--muted); font-size: 10px; }
.fc-row { display: flex; flex-wrap: wrap; gap: 2px 8px; color: var(--text); opacity: 0.92; }
.fc-row b { font-weight: 700; }
.fc-row .loss { color: #ff7a8a; }
.fc-need { color: #ffd54a; }
.fc-need b { font-size: 11px; }

/* 底部操作区：左右两列按钮，中间圆形方向盘 */
.ctrl {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 150px;
  gap: 6px;
}
.side { display: flex; flex-direction: column; gap: 8px; width: 92px; }
.btn {
  height: 42px;
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
</style>
