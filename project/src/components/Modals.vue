<script setup>
import { languages } from '../engine/locale.js'
// 弹窗集合：对话（引路人与事件）、祭坛、商人、罗盘、背包、存档、设置、菜单、结局
import { computed, ref, watch } from 'vue'
import { store, actions, compassTargets, itemName, zoneName, tr, localizeMessage } from '../stores/star.js'
import { styles, styleVariables } from '../engine/styles.js'
import { img } from '../engine/images.js'
import { ITEM_ART } from '../engine/star-art.js'
import RescueEnding from './RescueEnding.vue'
import { MANUAL_SLOTS, AUTO_SLOT } from '../engine/storage.js'
import { MERCHANTS, KEYS, ACTIVE } from '../game/star/data.js'
import { ALTAR_TIER, altarPrice, altarGain } from '../game/star/rules.js'

const modal = computed(() => store.modal)
const closable = computed(() => !!modal.value && modal.value.type !== 'ending')
const g = computed(() => store.game)

const OPENING_HELP = [
  '移动：方向键、WASD，或触屏方向键；也可以点击相邻的格子，或在棋盘上滑动。',
  '走向怪物即开战；点击怪物可查看预计损失、回合数与需要的生命。',
  '打不动（无法破防）或会死亡的怪物，游戏会拒绝你走进去，不会扣血。',
  '门需要对应颜色的钥匙，没有钥匙时不会打开；假墙撞一次就变成空地；这两种情况、以及打怪，都不会让你移动。',
  '灼域：走完一步后，与灼域怪相邻会扣生命。星穹盾可以免疫。',
  '撤销最多 50 步。每次操作自动保存，也可以在菜单中手动存读档。',
]

const TRAIT_NAMES = { magic: '魔攻', firstStrike: '先攻', doubleHit: '连击', aura: '灼域', sea: '海兽', dragon: '龙', starVeil: '星幕' }

/* ---------- 祭坛 ---------- */
const altarTier = computed(() => ALTAR_TIER[g.value?.floor] ?? 0)
const altarNext = computed(() => altarPrice((g.value?.altarBuys ?? 0) + 1))
const altarRows = computed(() => {
  const tier = altarTier.value
  return [
    { choice: 'hp', name: tr('生命'), gain: altarGain(tier, 'hp') },
    { choice: 'atk', name: tr('攻击'), gain: altarGain(tier, 'atk') },
    { choice: 'def', name: tr('防御'), gain: altarGain(tier, 'def') },
  ].map((r) => ({ ...r, text: tr('每次 +{0}', r.gain?.hp ?? r.gain?.atk ?? r.gain?.def ?? 0) }))
})

/* ---------- 商人 ---------- */
function merchantDesc(item) {
  if (item.recycle) return tr('回收{0}：每把 {1} 金币（不限次）', tr(KEYS[item.recycle].name), item.gold)
  const parts = []
  for (const [k, n] of Object.entries(item.items ?? {})) parts.push(`${itemName(k)} ×${n}`)
  if (item.hp) parts.push(tr('生命 +{0}', item.hp))
  return parts.join('、')
}
const merchantRows = computed(() => {
  const list = MERCHANTS[g.value?.floor] ?? []
  return list.map((item) => {
    const sold = !item.unlimited && (g.value?.soldOut ?? []).includes(item.id)
    return {
      id: item.id,
      desc: merchantDesc(item),
      price: item.recycle ? null : item.price,
      recycle: !!item.recycle,
      sold,
      can: !sold && (item.recycle ? (g.value?.hero.keys[item.recycle] ?? 0) > 0 : (g.value?.hero.gold ?? 0) >= item.price),
    }
  })
})

/* ---------- 罗盘 ---------- */
const targets = computed(() => compassTargets(g.value))
function travel(floor) {
  actions.closeModal()
  actions.useItem('compass', floor)
}

/* ---------- 背包 ---------- */
const ACTIVE_DESC = {
  compass: '传送到任意已到过的楼层（第 44、50 层除外），落在该层入口。',
  pickaxe: '凿开身边的一面裂墙。',
  flask: '当前生命翻倍，只能用一次。',
  mirrorJump: '传送到本层中心对称的格子，目标必须是没有任何东西的空地。',
  frostCore: '清除本层全部熔岩，永久变成空地。',
  bomb: '炸掉身边所有非 BOSS 怪物（不给金币，算作已击败）。只能用一次。',
}
const bagRows = computed(() =>
  Object.keys(ACTIVE)
    .filter((k) => (g.value?.items[k] ?? 0) > 0)
    .map((k) => ({ id: k, name: tr(ACTIVE[k].name), count: g.value.items[k], desc: tr(ACTIVE_DESC[k] ?? '') })),
)
function useBag(id) {
  if (id === 'compass') {
    actions.openModal({ type: 'compass' })
    return
  }
  // 使用道具前先关掉背包（引擎与动作在有弹窗时拒绝执行）
  actions.closeModal()
  actions.useItem(id)
}

/* ---------- 存档 ---------- */
const saveMode = computed(() => modal.value?.mode === 'save')
function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleString(store.meta.language, { hour12: false })
  } catch {
    return ''
  }
}
const slotRows = computed(() =>
  store.slots.map((s) => ({
    name: s.name,
    label: s.name === AUTO_SLOT ? tr('自动存档') : tr('存档 {0}', Number(s.name) + 1),
    entry: s.entry,
    summary: s.entry ? tr('第 {0} 层 · {1}', s.entry.floor, fmtTime(s.entry.savedAt)) : tr('空'),
    manual: s.name !== AUTO_SLOT && MANUAL_SLOTS.includes(s.name),
  })),
)

/* ---------- 设置 ---------- */
function onVolume(e) {
  actions.setVolume(Number(e.target.value))
}

/* ---------- 菜单 ---------- */
function goTitle() {
  actions.backToTitle()
}

const TITLE = computed(() => {
  const m = modal.value
  if (!m) return ''
  switch (m.type) {
    case 'notice': return m.title
    case 'battle': return m.preview.monster.name
    case 'altar': return '祭坛'
    case 'merchant': return '商人'
    case 'compass': return '传送罗盘'
    case 'items': return '背包'
    case 'saves': return m.mode === 'save' ? '存档' : '读档'
    case 'settings': return '设置'
    case 'help': return '操作说明'
    case 'pause': return '菜单'
    case 'ending': return '通关'
    default: return ''
  }
})

const closeWithBackdrop = () => {
  if (closable.value) actions.closeModal()
}

// 对话框出现时滚回顶部
const scroller = ref(null)
watch(modal, () => {
  if (scroller.value) scroller.value.scrollTop = 0
})
</script>

<template>
  <Transition name="modal">
    <div v-if="modal" class="backdrop" @click.self="closeWithBackdrop">
      <div class="modal" :class="`m-${modal.type}`" role="dialog" :aria-label="localizeMessage(TITLE)">
        <button v-if="closable" class="close" :aria-label="tr('关闭')" @click="actions.closeModal()">✕</button>

        <div ref="scroller" class="modal-scroll">
          <h2 class="modal-title">{{ localizeMessage(TITLE) }}</h2>

          <p v-if="modal.type === 'notice'" class="notice-detail">{{ localizeMessage(modal.text) }}</p>

          <template v-else-if="modal.type === 'battle'">
            <p>{{ tr('生命 {0} · 攻击 {1} · 防御 {2}', modal.preview.monster.hp, modal.preview.monster.atk, modal.preview.def) }}</p>
            <p :class="modal.preview.canFight ? 'battle-ok' : 'battle-bad'">{{ tr(modal.preview.canFight ? '可以击败' : modal.preview.reason === 'unpierceable' ? '无法破防' : '会死亡') }}</p>
            <p>{{ tr('预计损失 {0} · 回合数 {1}', Number.isFinite(modal.preview.loss) ? modal.preview.loss : '—', modal.preview.rounds ?? '—') }}</p>
            <p>{{ tr('我方每回合 {0} · 怪物每回合 {1}', modal.preview.perHit, modal.preview.perRound ?? '—') }}</p>
            <p v-if="Number.isFinite(modal.preview.loss)">{{ tr('至少需要 {0} 生命（当前 {1}）', modal.preview.loss + 1, g.hero.hp) }}</p>
            <p v-if="modal.preview.monster.traits.length">{{ tr('特性：{0}', modal.preview.monster.traits.map(t => tr(TRAIT_NAMES[t.type] ?? t.type)).join(tr('、'))) }}</p>
          </template>

          <!-- 祭坛：三选一，价格全塔共享计次 -->
          <template v-else-if="modal.type === 'altar'">
            <p class="note">
              {{ tr('本座祭坛档位 {0} · 全塔已购买 {1} 次 · 下一次花费 {2} 金币', altarTier, g.altarBuys, altarNext) }}
            </p>
            <p class="note small">{{ tr("你的金币：") }}<b class="gold-t">{{ g.hero.gold }}</b></p>
            <div class="rows">
              <div v-for="r in altarRows" :key="r.choice" class="row">
                <div class="row-main">
                  <b>{{ r.name }}</b>
                  <span class="sub">{{ r.text }}</span>
                </div>
                <button class="buy" :disabled="g.hero.gold < altarNext" @click="actions.buyAltar(r.choice)">
                  {{ tr('{0} 金', altarNext) }}
                </button>
              </div>
            </div>
            <p class="note small">{{ tr("买防御通常比攻击划算；攻击只在需要越过数值门时购买。") }}</p>
          </template>

          <!-- 商人：每件只卖一次；回收钥匙不限次 -->
          <template v-else-if="modal.type === 'merchant'">
            <p class="note small">{{ tr("你的金币：") }}<b class="gold-t">{{ g.hero.gold }}</b></p>
            <div v-if="!merchantRows.length" class="note">{{ tr("这一层的商人已经没有可交易的东西了。") }}</div>
            <div class="rows">
              <div v-for="r in merchantRows" :key="r.id" class="row" :class="{ sold: r.sold }">
                <div class="row-main">
                  <b>{{ r.desc }}</b>
                  <span class="sub">
                    <template v-if="r.sold">{{ tr("已售完") }}</template>
                    <template v-else-if="r.recycle">{{ tr("回收：每把 +金币（不限次）") }}</template>
                    <template v-else>{{ tr('价格 {0} 金币', r.price) }}</template>
                  </span>
                </div>
                <button
                  class="buy"
                  :disabled="r.sold || !r.can"
                  @click="actions.merchantBuy(r.id)"
                >
                  {{ r.recycle ? tr('回收') : r.sold ? tr('售完') : tr('{0} 金', r.price) }}
                </button>
              </div>
            </div>
          </template>

          <!-- 传送罗盘：只列出到过的楼层 -->
          <template v-else-if="modal.type === 'compass'">
            <p class="note">{{ tr(g.hiddenMode ? '隐藏测试模式：可传送至任意楼层，包括第 44、50 层。' : '选择一层，传送到它的入口。第 44、50 层不能作为目标。') }}</p>
            <div v-if="!targets.length" class="note">{{ tr("还没有其他可以去的楼层。") }}</div>
            <div class="rows">
              <button v-for="f in targets" :key="f" class="row-btn" @click="travel(f)">
                {{ tr('第 {0} 层', f) }}
                <small>{{ zoneName(f) }}</small>
              </button>
            </div>
          </template>

          <!-- 背包：主动道具 -->
          <template v-else-if="modal.type === 'items'">
            <div v-if="!bagRows.length" class="note">{{ tr("背包是空的。") }}</div>
            <div class="rows">
              <div v-for="r in bagRows" :key="r.id" class="row">
                <div class="row-main">
                  <b class="bag-item-label"><img :src="img(ITEM_ART[r.id])" alt="" width="24" height="24" />{{ r.name }} ×{{ r.count === Infinity ? '∞' : r.count }}</b>
                  <span class="sub">{{ r.desc }}</span>
                </div>
                <button class="buy" @click="useBag(r.id)">{{ tr(r.id === 'compass' ? '前往' : '使用') }}</button>
              </div>
            </div>
          </template>

          <!-- 存档 / 读档 -->
          <template v-else-if="modal.type === 'saves'">
            <div class="rows">
              <div v-for="s in slotRows" :key="s.name" class="row">
                <div class="row-main">
                  <b>{{ s.label }}</b>
                  <span class="sub">{{ s.summary }}</span>
                </div>
                <div class="row-btns">
                  <button
                    v-if="saveMode"
                    class="buy"
                    :disabled="!s.manual || !g"
                    @click="actions.saveSlot(s.name)"
                  >{{ tr("存入") }}</button>
                  <button v-else class="buy" :disabled="!s.entry" @click="actions.loadSlot(s.name)">{{ tr("读取") }}</button>
                  <button v-if="s.manual && s.entry" class="buy ghost" @click="actions.deleteSlot(s.name)">{{ tr("删除") }}</button>
                </div>
              </div>
            </div>
            <p class="note small">{{ tr("自动存档在换层时写入，只能读取。") }}</p>
          </template>

          <!-- 设置 -->
          <template v-else-if="modal.type === 'settings'">
            <label class="language-picker field">
              {{ tr('语言') }}
              <select :value="store.meta.language" @change="actions.setLanguage($event.target.value)">
                <option v-for="language in languages" :key="language.id" :value="language.id" :lang="language.id">{{ language.name }}</option>
              </select>
            </label>
            <fieldset class="style-picker">
              <legend>{{ tr("界面风格") }}</legend>
              <div class="style-options">
                <label v-for="style in styles" :key="style.id" class="style-option"
                       :style="styleVariables(style.id)">
                  <input type="radio" name="tower-style" :value="style.id"
                         :checked="store.meta.style === style.id" @change="actions.setStyle(style.id)" />
                  <span class="style-swatch" aria-hidden="true"></span>
                  <span>{{ tr(style.name) }}</span>
                </label>
              </div>
            </fieldset>
            <label class="field">
              {{ tr("音量") }}
              <input type="range" min="0" max="1" step="0.05" :value="store.meta.volume" @input="onVolume" />
            </label>
            <button class="menu-row" @click="actions.setMuted(!store.meta.muted)">
              {{ tr(store.meta.muted ? '取消静音' : '静音') }}
            </button>
          </template>

          <!-- 操作说明 -->
          <template v-else-if="modal.type === 'help'">
            <ul class="help">
              <li v-for="(t, i) in OPENING_HELP" :key="i">{{ tr(t) }}</li>
            </ul>
          </template>

          <!-- 菜单 -->
          <template v-else-if="modal.type === 'pause'">
            <div class="menu-list">
              <button class="menu-row primary" @click="actions.closeModal()">{{ tr("继续") }}</button>
              <button class="menu-row" :disabled="!g || g.history.length === 0" @click="actions.undo()">{{ tr("撤销一步") }}</button>
              <button class="menu-row" :disabled="!g" @click="actions.openModal({ type: 'saves', mode: 'save' })">{{ tr("存档") }}</button>
              <button class="menu-row" @click="actions.openModal({ type: 'saves', mode: 'load' })">{{ tr("读档") }}</button>
              <button class="menu-row" @click="actions.openModal({ type: 'settings' })">{{ tr("设置") }}</button>
              <button class="menu-row" @click="actions.openModal({ type: 'help' })">{{ tr("操作说明") }}</button>
              <button class="menu-row danger back-home" @click="goTitle">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 11 12 3l9 8M5.5 9v12h4v-6h5v6h4V9" />
                </svg>
                <span>{{ tr("返回游戏主界面") }}</span>
              </button>
            </div>
          </template>

          <!-- 结局 -->
          <template v-else-if="modal.type === 'ending'">
            <RescueEnding :hero="g.hero" />
            <button class="menu-row primary" @click="goTitle">{{ tr("返回标题") }}</button>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.language-picker select { width: 100%; min-height: 44px; margin-top: 6px; padding: 0 10px; border: 1px solid var(--line-gold); border-radius: 8px; background: var(--panel, #191633); color: var(--text, #fff); font: inherit; }
.bag-item-label { display: flex; align-items: center; gap: 6px; }

.backdrop {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(4, 4, 14, 0.7);
  backdrop-filter: blur(3px);
}
.modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  max-height: 88%;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: linear-gradient(180deg, #1b1a3e, #100f26);
  border: 1px solid var(--line-gold);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}
.notice-detail { white-space: pre-wrap; line-height: 1.65; overflow-wrap: anywhere; }
.battle-ok { color: #6ee7a0; }
.battle-bad { color: #ff7a85; }
.modal-scroll {
  padding: 18px 18px 20px;
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-scroll::-webkit-scrollbar { display: none; }
.modal-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 22px;
  letter-spacing: 3px;
  color: var(--gold);
}
.close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
}
.note { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted); }
.note.small { font-size: 12px; }
.gold-t { color: var(--gold); }
.rows { display: flex; flex-direction: column; gap: 8px; }
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
}
.row.sold { opacity: 0.5; }
.row-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.row-main b { font-size: 15px; font-weight: 700; }
.sub { font-size: 12px; color: var(--muted); line-height: 1.4; }
.row-btns { display: flex; gap: 6px; flex: none; }
.buy {
  flex: none;
  min-width: 74px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--line-gold);
  background: linear-gradient(135deg, #ffe58a, #e6a817);
  color: #2a1a00;
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.buy.ghost {
  background: transparent;
  color: #ff9a9a;
  border-color: rgba(255, 122, 122, 0.4);
  min-width: 0;
}
.buy:disabled { opacity: 0.4; cursor: not-allowed; }
.row-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}
.row-btn small { font-size: 12px; color: var(--muted); }
.row-btn:active { transform: scale(0.98); }

.style-picker { margin: 0; min-width: 0; border: 0; padding: 0; }
.style-picker legend { padding: 0 0 8px; color: var(--text); font-size: 14px; }
.style-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.style-option {
  display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 5px;
  position: relative; cursor: pointer; border: 1px solid var(--line);
  background: var(--skin-panel); border-radius: var(--skin-radius); color: #fff;
  font-size: 12px; line-height: 1.22;
}
.style-option:has(input:checked) { border-color: var(--skin-accent); box-shadow: inset 0 0 0 1px var(--skin-accent); }
.style-option:has(input:focus-visible) { outline: 2px solid var(--gold); outline-offset: 1px; }
.style-option input { position: absolute; opacity: 0; pointer-events: none; width: 1px; }
.style-swatch { width: 11px; height: 11px; flex: none; background: var(--skin-accent); border-radius: 2px; }
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}
.menu-list, .menu-row-list { display: flex; flex-direction: column; gap: 8px; }
.menu-row {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
  text-align: center;
}
.menu-row:disabled { opacity: 0.4; cursor: not-allowed; }
.menu-row.primary {
  border: none;
  color: #2a1a00;
  font-weight: 700;
  background: linear-gradient(135deg, #ffe58a, #e6a817);
}
.menu-row.danger { color: #ff9a9a; }
.back-home { display: flex; align-items: center; justify-content: center; gap: 6px; }
.back-home svg { flex: none; }

.help { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; font-size: 14px; line-height: 1.7; color: var(--text); }

.ending-tag {
  text-align: center;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 4px;
  color: var(--gold);
}
.ending-lines p { margin: 6px 0; text-align: center; font-size: 14px; line-height: 1.8; color: var(--text); }
.ending-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ending-stats div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
}
.ending-stats b { font-family: var(--font-display); font-size: 16px; font-weight: 400; color: var(--text); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
