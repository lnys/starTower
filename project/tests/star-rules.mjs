// 《星穹塔》数值规则测试（node tests/star-rules.mjs）。逐条对照 魔塔50层新玩法.md。
import assert from 'node:assert/strict'
import { combat, auraDamage, effectiveDef, consumableEffect, altarPrice, altarGain, zoneOf, ALTAR_TIER } from '../src/game/star/rules.js'

const cases = []
const t = (name, fn) => cases.push([name, fn])
const mon = (hp, atk, def, traits = [], extra = {}) => ({ hp, atk, def, traits, ...extra })
const hero = (atk, def, flags = {}) => ({ hp: 100000, atk, def, flags })

// §3.2 核对用例：每一条都必须相等
t('§3.2 洞蝠：10/10 打 30/22/2 → 损失 36', () => {
  const r = combat(hero(10, 10), mon(30, 22, 2))
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [8, 4, 12, 36])
})
t('§3.2 蚀菌师（魔攻）：14/14 打 40/12/4 → 损失 36', () => {
  const r = combat(hero(14, 14), mon(40, 12, 4, [{ type: 'magic' }]))
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [10, 4, 12, 36])
})
t('§3.2 持钥狱卒（先攻）：34/24 打 80/50/15 → 损失 130', () => {
  const r = combat(hero(34, 24), mon(80, 50, 15, [{ type: 'firstStrike' }]))
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [19, 5, 26, 130])
})
t('§3.2 双刃机偶（连击）：55/75 打 150/100/35 → 损失 350', () => {
  const r = combat(hero(55, 75), mon(150, 100, 35, [{ type: 'doubleHit' }]))
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [20, 8, 50, 350])
})
t('§3.2 石甲虫：14/14 打 20/35/24 → 打不动', () => {
  const r = combat(hero(14, 14), mon(20, 35, 24))
  assert.equal(r.canFight, false)
  assert.equal(r.reason, 'unpierceable')
})
t('§3.2 潮汐司钟（持逐潮枪）：87/87 打 900/180/50 海兽 → 损失 651', () => {
  const r = combat(hero(87, 87, { tideSpear: true }), mon(900, 180, 50, [{ type: 'sea' }]))
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [124, 8, 93, 651])
})
t('§3.2 潮汐司钟（无逐潮枪）：87/87 → 损失 2232', () => {
  const r = combat(hero(87, 87), mon(900, 180, 50, [{ type: 'sea' }]))
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [37, 25, 93, 2232])
})
t('§3.2 终焉之主（星幕已解，防御 280）：396/507 → 损失 7242', () => {
  const m = mon(4000, 720, 280, [{ type: 'starVeil' }])
  const r = combat(hero(396, 507), m, { pillarsAlive: 0 })
  assert.deepEqual([r.perHit, r.rounds, r.perRound, r.loss], [116, 35, 213, 7242])
})

// 正常规则
t('损失 ≥ 当前生命时禁止战斗（不允许同归于尽）', () => {
  const r = combat({ hp: 36, atk: 10, def: 10, flags: {} }, mon(30, 22, 2))
  assert.equal(r.canFight, false)
  assert.equal(r.reason, 'lethal')
  assert.equal(combat({ hp: 37, atk: 10, def: 10, flags: {} }, mon(30, 22, 2)).canFight, true)
})
t('特攻：龙牙匕对龙翻倍的是勇者攻击力，之后再减防御', () => {
  const r = combat(hero(20, 0, { dragonFang: true }), mon(100, 10, 5, [{ type: 'dragon' }]))
  assert.equal(r.perHit, 40 - 5)
})
t('特攻不影响非特攻目标', () => {
  const r = combat(hero(20, 0, { dragonFang: true, tideSpear: true }), mon(100, 10, 5, [{ type: 'magic' }]))
  assert.equal(r.perHit, 15)
})

// 星幕
t('§7 星幕：存活 4/3/2/1/0 名星柱守卫时防御为 780/655/530/405/280', () => {
  const m = mon(4000, 720, 280, [{ type: 'starVeil' }])
  assert.deepEqual([4, 3, 2, 1, 0].map((n) => effectiveDef(m, n)), [780, 655, 530, 405, 280])
})

// 灼域
t('灼域：多只累加，持星穹盾为 0', () => {
  const a = mon(400, 400, 180, [{ type: 'aura', damage: 100 }])
  const b = mon(450, 430, 200, [{ type: 'aura', damage: 200 }, { type: 'firstStrike' }])
  assert.equal(auraDamage({ flags: {} }, [a, b]), 300)
  assert.equal(auraDamage({ flags: { starShield: true } }, [a, b]), 0)
})

// 祭坛与晶石
t('§4.4 祭坛价格序列：第 k 次 = 20·k²', () => {
  const expect = [20, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000, 2420, 2880, 3380, 3920, 4500, 5120, 5780]
  expect.forEach((p, i) => assert.equal(altarPrice(i + 1), p))
})
t('§4.4 祭坛收益按档位：生命 150t、攻击 2t、防御 3t', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((t) => altarGain(t, 'hp').hp), [150, 300, 450, 600, 750])
  assert.deepEqual([1, 2, 3, 4, 5].map((t) => altarGain(t, 'atk').atk), [2, 4, 6, 8, 10])
  assert.deepEqual([1, 2, 3, 4, 5].map((t) => altarGain(t, 'def').def), [3, 6, 9, 12, 15])
})
t('§4.4 祭坛所在层：4、12、21、32、42、46', () => {
  assert.deepEqual(Object.keys(ALTAR_TIER).map(Number), [4, 12, 21, 32, 42, 46])
  assert.equal(ALTAR_TIER[46], 5)
})
t('§4.1 晶石与药水随区变化（第 1 层与第 50 层）', () => {
  assert.deepEqual(consumableEffect('redCrystal', 1), { atk: 2 })
  assert.deepEqual(consumableEffect('blueCrystal', 50), { def: 6 })
  assert.deepEqual(consumableEffect('redPotion', 1), { hp: 50 })
  assert.deepEqual(consumableEffect('bluePotion', 50), { hp: 750 })
  assert.equal(zoneOf(10), 1)
  assert.equal(zoneOf(11), 2)
})

let pass = 0
for (const [name, fn] of cases) {
  try {
    fn()
    pass++
    console.log(`  ✔ ${name}`)
  } catch (e) {
    console.log(`  ✘ ${name}\n      ${e.message.split('\n').join('\n      ')}`)
  }
}
console.log(`\n星穹塔规则：通过 ${pass}/${cases.length}`)
if (pass !== cases.length) process.exit(1)
