<script setup>
// 弹窗集合：对话（引路人与事件）、祭坛、商人、罗盘、背包、存档、设置、菜单、结局
import { computed, ref, watch } from 'vue'
import { store, actions, compassTargets, itemName, zoneName } from '../stores/star.js'
import StoryBox from './StoryBox.vue'
import { MANUAL_SLOTS, AUTO_SLOT } from '../engine/storage.js'
import { MERCHANTS, KEYS, ACTIVE } from '../game/star/data.js'
import { ALTAR_TIER, altarPrice, altarGain } from '../game/star/rules.js'

const modal = computed(() => store.modal)
const closable = computed(() => !!modal.value && !['story', 'ending'].includes(modal.value.type))
const g = computed(() => store.game)

const OPENING_HELP = [
  '移动：方向键、WASD，或触屏方向键；也可以点击相邻的格子，或在棋盘上滑动。',
  '走进怪物即开战。战斗在开打前就算清楚：走进去之前，身边的卡片已经告诉你损失与需要的生命。',
  '打不动（无法破防）或会死亡的怪物，游戏会拒绝你走进去，不会扣血。',
  '门需要对应颜色的钥匙，没有钥匙时不会打开；假墙撞一次就变成空地；这两种情况、以及打怪，都不会让你移动。',
  '灼域：走完一步后，与灼域怪相邻会扣生命。星穹盾可以免疫。',
  '撤销最多 50 步。存档可以随时手动保存；换层时会自动存档。',
]

const ENDING_LINES = [
  '星幕随着最后一道防线的倒下而熄灭。',
  '星图重新落回天穹，塔顶的风第一次吹进地底的矿窖。',
  '你把塔修好了，也把星空还给了它。',
]

/* ---------- 对话 ---------- */
function onStoryDone() {
  actions.closeModal()
}

/* ---------- 祭坛 ---------- */
const altarTier = computed(() => ALTAR_TIER[g.value?.floor] ?? 0)
const altarNext = computed(() => altarPrice((g.value?.altarBuys ?? 0) + 1))
const altarRows = computed(() => {
  const t = altarTier.value
  return [
    { choice: 'hp', name: '生命', gain: altarGain(t, 'hp') },
    { choice: 'atk', name: '攻击', gain: altarGain(t, 'atk') },
    { choice: 'def', name: '防御', gain: altarGain(t, 'def') },
  ].map((r) => ({ ...r, text: `每次 +${r.gain?.hp ?? r.gain?.atk ?? r.gain?.def ?? 0}` }))
})

/* ---------- 商人 ---------- */
function merchantDesc(item) {
  if (item.recycle) return `回收${KEYS[item.recycle].name}：每把 ${item.gold} 金币（不限次）`
  const parts = []
  for (const [k, n] of Object.entries(item.items ?? {})) parts.push(`${itemName(k)} ×${n}`)
  if (item.hp) parts.push(`生命 +${item.hp}`)
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
    .map((k) => ({ id: k, name: ACTIVE[k].name, count: g.value.items[k], desc: ACTIVE_DESC[k] ?? '' })),
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
    return new Date(ts).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return ''
  }
}
const slotRows = computed(() =>
  store.slots.map((s) => ({
    name: s.name,
    label: s.name === AUTO_SLOT ? '自动存档' : `存档 ${Number(s.name) + 1}`,
    entry: s.entry,
    summary: s.entry ? `第 ${s.entry.floor} 层 · ${fmtTime(s.entry.savedAt)}` : '空',
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
      <div class="modal" :class="`m-${modal.type}`" role="dialog" :aria-label="TITLE">
        <button v-if="closable" class="close" aria-label="关闭" @click="actions.closeModal()">✕</button>

        <!-- 对话：引路人与事件的文字，逐字显示 -->
        <template v-if="modal.type === 'story'">
          <StoryBox :title="modal.title" :lines="modal.lines" @done="onStoryDone" @skip="actions.closeModal()" />
        </template>

        <template v-else>
          <div ref="scroller" class="modal-scroll">
            <h2 class="modal-title">{{ TITLE }}</h2>

            <!-- 祭坛：三选一，价格全塔共享计次 -->
            <template v-if="modal.type === 'altar'">
              <p class="note">
                本座祭坛档位 {{ altarTier }} · 全塔已购买 {{ g.altarBuys }} 次 · 下一次花费 <b class="gold-t">{{ altarNext }}</b> 金币
              </p>
              <p class="note small">你的金币：<b class="gold-t">{{ g.hero.gold }}</b></p>
              <div class="rows">
                <div v-for="r in altarRows" :key="r.choice" class="row">
                  <div class="row-main">
                    <b>{{ r.name }}</b>
                    <span class="sub">{{ r.text }}</span>
                  </div>
                  <button class="buy" :disabled="g.hero.gold < altarNext" @click="actions.buyAltar(r.choice)">
                    {{ altarNext }} 金
                  </button>
                </div>
              </div>
              <p class="note small">买防御通常比攻击划算；攻击只在需要越过数值门时购买。</p>
            </template>

            <!-- 商人：每件只卖一次；回收钥匙不限次 -->
            <template v-else-if="modal.type === 'merchant'">
              <p class="note small">你的金币：<b class="gold-t">{{ g.hero.gold }}</b></p>
              <div v-if="!merchantRows.length" class="note">这一层的商人已经没有可交易的东西了。</div>
              <div class="rows">
                <div v-for="r in merchantRows" :key="r.id" class="row" :class="{ sold: r.sold }">
                  <div class="row-main">
                    <b>{{ r.desc }}</b>
                    <span class="sub">
                      <template v-if="r.sold">已售完</template>
                      <template v-else-if="r.recycle">回收：每把 +金币（不限次）</template>
                      <template v-else>价格 {{ r.price }} 金币</template>
                    </span>
                  </div>
                  <button
                    class="buy"
                    :disabled="r.sold || !r.can"
                    @click="actions.merchantBuy(r.id)"
                  >
                    {{ r.recycle ? '回收' : r.sold ? '售完' : `${r.price} 金` }}
                  </button>
                </div>
              </div>
            </template>

            <!-- 传送罗盘：只列出到过的楼层 -->
            <template v-else-if="modal.type === 'compass'">
              <p class="note">选择一层，传送到它的入口。第 44、50 层不能作为目标。</p>
              <div v-if="!targets.length" class="note">还没有其他可以去的楼层。</div>
              <div class="rows">
                <button v-for="f in targets" :key="f" class="row-btn" @click="travel(f)">
                  第 {{ f }} 层
                  <small>{{ zoneName(f) }}</small>
                </button>
              </div>
            </template>

            <!-- 背包：主动道具 -->
            <template v-else-if="modal.type === 'items'">
              <div v-if="!bagRows.length" class="note">背包是空的。</div>
              <div class="rows">
                <div v-for="r in bagRows" :key="r.id" class="row">
                  <div class="row-main">
                    <b>{{ r.name }} ×{{ r.count === Infinity ? '∞' : r.count }}</b>
                    <span class="sub">{{ r.desc }}</span>
                  </div>
                  <button class="buy" @click="useBag(r.id)">{{ r.id === 'compass' ? '前往' : '使用' }}</button>
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
                    >存入</button>
                    <button v-else class="buy" :disabled="!s.entry" @click="actions.loadSlot(s.name)">读取</button>
                    <button v-if="s.manual && s.entry" class="buy ghost" @click="actions.deleteSlot(s.name)">删除</button>
                  </div>
                </div>
              </div>
              <p class="note small">自动存档在换层时写入，只能读取。</p>
            </template>

            <!-- 设置 -->
            <template v-else-if="modal.type === 'settings'">
              <label class="field">
                音量
                <input type="range" min="0" max="1" step="0.05" :value="store.meta.volume" @input="onVolume" />
              </label>
              <button class="menu-row" @click="actions.setMuted(!store.meta.muted)">
                {{ store.meta.muted ? '取消静音' : '静音' }}
              </button>
            </template>

            <!-- 操作说明 -->
            <template v-else-if="modal.type === 'help'">
              <ul class="help">
                <li v-for="(t, i) in OPENING_HELP" :key="i">{{ t }}</li>
              </ul>
            </template>

            <!-- 菜单 -->
            <template v-else-if="modal.type === 'pause'">
              <div class="menu-list">
                <button class="menu-row primary" @click="actions.closeModal()">继续</button>
                <button class="menu-row" :disabled="!g || g.history.length === 0" @click="actions.undo()">撤销一步</button>
                <button class="menu-row" :disabled="!g" @click="actions.openModal({ type: 'saves', mode: 'save' })">存档</button>
                <button class="menu-row" @click="actions.openModal({ type: 'saves', mode: 'load' })">读档</button>
                <button class="menu-row" @click="actions.openModal({ type: 'settings' })">设置</button>
                <button class="menu-row" @click="actions.openModal({ type: 'help' })">操作说明</button>
                <button class="menu-row danger" @click="goTitle">返回标题</button>
              </div>
            </template>

            <!-- 结局 -->
            <template v-else-if="modal.type === 'ending'">
              <div class="ending-tag">星幕已关闭</div>
              <div class="ending-lines">
                <p v-for="(t, i) in ENDING_LINES" :key="i">{{ t }}</p>
              </div>
              <div class="ending-stats">
                <div><span>层数</span><b>50 / 50</b></div>
                <div><span>攻击</span><b>{{ g.hero.atk }}</b></div>
                <div><span>防御</span><b>{{ g.hero.def }}</b></div>
                <div><span>金币</span><b>{{ g.hero.gold }}</b></div>
                <div><span>祭坛购买</span><b>{{ g.altarBuys }} 次</b></div>
              </div>
              <button class="menu-row primary" @click="goTitle">返回标题</button>
            </template>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
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
.modal.m-story { background: transparent; border: none; box-shadow: none; }
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
