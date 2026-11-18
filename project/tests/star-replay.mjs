// 回放由真实逐步模拟生成的普通路线，不修改属性、钥匙或地图。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createGame, moveHero, buyAltar, merchantBuy, useItem } from '../src/game/star/engine.js'
const files = ['01-04', '05-15', '16-27', '28-39', '29-32', '33-36', '37-39', '40-50']
const defs = {}
for (const file of files) for (const d of (await import(`../src/game/star/maps/floors-${file}.js`)).default) defs[d.index] = d
const route = JSON.parse(readFileSync(new URL('./fixtures/star-route.json', import.meta.url)))
const s = createGame(defs)
const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
for (const [i, a] of route.entries()) {
  let r
  if (a.altar) r = buyAltar(s, defs, a.altar)
  else if (a.shop) r = merchantBuy(s, defs, a.shop)
  else if (a.item) r = useItem(s, defs, a.item)
  else if (a.talk) {
    const dir = Object.keys(delta).find((d) => {
      const [dx, dy] = delta[d]
      return s.world[s.floor].ents[`${s.hero.x + dx},${s.hero.y + dy}`]?.id === 'guide'
    })
    r = moveHero(s, defs, dir)
  } else if (a.step === 'compass') r = useItem(s, defs, 'compass', a.to)
  else if (a.step === 'mirror') r = useItem(s, defs, 'mirrorJump')
  else {
    const [dx, dy] = delta[a.dir]
    const t = s.world[s.floor].terr[s.hero.y + dy]?.[s.hero.x + dx]
    r = t === '%' ? useItem(s, defs, 'pickaxe') : t === '~' ? useItem(s, defs, 'frostCore') : moveHero(s, defs, a.dir)
  }
  assert.ok(Array.isArray(r) ? !['blocked', 'nofight', 'locked'].includes(r[0].type) : r.ok, `第 ${i + 1} 步失败：${JSON.stringify(r)}`)
  assert.ok(s.hero.hp > 0)
}
assert.equal(s.floor, 50)
assert.equal(s.ended, true)
assert.deepEqual([s.hero.hp, s.hero.atk, s.hero.def], [1241, 378, 501])
console.log(`真实引擎回放通关：${route.length} 步，生命 ${s.hero.hp}，攻击 ${s.hero.atk}，防御 ${s.hero.def}`)
