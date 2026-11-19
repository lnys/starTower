import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { store, actions, DEFS, tr, localizeMessage } from '../src/stores/star.js'
import { stopBgm } from '../src/engine/audio.js'
import { createGame } from '../src/game/star/engine.js'
import { writeSlot, readSlot, loadMeta } from '../src/engine/storage.js'

const localData = new Map()
globalThis.window = { localStorage: {
  getItem: (key) => localData.get(key) ?? null,
  setItem: (key, value) => localData.set(key, value),
} }

after(stopBgm)

function loadAt(floor, x, y, gold = 0) {
  const game = createGame(DEFS, { startFloor: floor })
  Object.assign(game.hero, { x, y, gold })
  writeSlot('auto', game)
  assert.equal(actions.continueAuto(), true)
}

test('序章和引路人对白放在提示栏，移动不会被弹窗阻挡', () => {
  actions.newGame()
  assert.equal(store.modal, null)
  assert.equal(store.notice.title, '序章')
  actions.move('left')
  assert.equal(store.notice, null)
  assert.equal(readSlot('auto').state.hero.x, 4)

  loadAt(1, 9, 10)
  assert.equal(actions.move('right'), false)
  assert.match(store.notice.text, /终焉女妖囚禁在第五十层/)
  assert.equal(store.modal, null)
  actions.move('left')
  assert.equal(store.notice, null)
})

test('网页商店走弹窗，购买自动保存', () => {
  loadAt(6, 1, 2, 30)
  assert.equal(actions.move('up'), false)
  assert.equal(store.modal.type, 'merchant')
  assert.equal(actions.merchantBuy('m6a'), true)
  assert.equal(readSlot('auto').state.hero.gold, 0)
  assert.equal(readSlot('auto').state.hero.keys.yellowKey, 3)
  actions.closeModal()
  assert.equal(store.modal, null)
})

test('界面风格选择持久化，不改动存档或其他设置', () => {
  const before = readSlot('auto')
  assert.equal(loadMeta().style, 'classic')
  actions.setVolume(.42)
  actions.setMuted(true)
  for (const id of ['warcraft', 'wow', 'league', 'chinese', 'pixel']) {
    actions.setStyle(id)
    assert.equal(store.meta.style, id)
    assert.equal(loadMeta().style, id)
    assert.equal(loadMeta().volume, .42)
    assert.equal(loadMeta().muted, true)
    assert.deepEqual(readSlot('auto'), before)
  }
  actions.setStyle('obsolete-style')
  assert.equal(loadMeta().style, 'classic')
})

test('语言默认中文、即时切换并持久化，不改动存档或其他设置', () => {
  const before = readSlot('auto')
  const otherSettings = { ...loadMeta() }
  assert.equal(otherSettings.language, 'zh-CN')
  assert.equal(tr('新的冒险'), '新的冒险')
  actions.setLanguage('en')
  assert.equal(tr('设置'), 'Settings')
  assert.equal(localizeMessage('需要蓝钥匙才能打开'), 'You need a Blue Key to open this door.')
  assert.equal(localizeMessage('第 1 次购买，花费 20 · 防御 +4'), 'Purchase #1 cost 20 gold. · DEF +4')
  assert.equal(loadMeta().language, 'en')
  actions.setLanguage('ja')
  assert.equal(tr('第 {0} 层', 50), '50階')
  assert.equal(localizeMessage('第 50 层'), '50階')
  assert.equal(localizeMessage('你的女神被终焉女妖囚禁在第五十层，击破星幕才能救她。先算清楚战斗损失，打不动的怪可以以后回来。').includes('バンシー'), true)
  assert.equal(loadMeta().language, 'ja')
  actions.setLanguage('invalid-language')
  assert.deepEqual(loadMeta(), otherSettings)
  assert.deepEqual(readSlot('auto'), before)
})

test('Flutter 与 Vue 共用翻译表，完整覆盖游戏数据文本', async () => {
  const { readFileSync } = await import('node:fs')
  const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8')
  const source = read('../design/translations.json')
  assert.equal(read('../flutter/assets/data/translations.json'), source)
  const catalog = JSON.parse(source)
  const placeholders = (text) => [...new Set(text.match(/\{\d+\}/g))].sort()
  for (const [key, values] of Object.entries(catalog)) {
    assert.equal(values.length, 2, key)
    for (const value of values) {
      assert.ok(value.trim(), key)
      assert.deepEqual(placeholders(value), placeholders(key), key)
    }
  }
  const visit = (value) => {
    if (typeof value === 'string' && /\p{Script=Han}/u.test(value)) assert.ok(catalog[value], value)
    else if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  visit(JSON.parse(read('../flutter/assets/data/game.json')))
  visit(JSON.parse(read('../design/styles.json')))
})
