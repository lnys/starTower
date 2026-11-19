import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { store, actions, DEFS } from '../src/stores/star.js'
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
