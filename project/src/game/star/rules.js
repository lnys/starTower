// 《星穹塔》数值规则（纯函数，与 Vue 解耦）。依据：魔塔50层新玩法.md §3、§4。
// 全部使用整数，没有随机数。预判界面与实战结算必须调用同一个 combat()。

/** 特性类型（与 §12.2 对应） */
export const T = {
  MAGIC: 'magic', // 魔攻：伤害无视勇者防御
  FIRST: 'firstStrike', // 先攻：怪物先出手，出手次数 = rounds
  DOUBLE: 'doubleHit', // 连击：perRound × 2
  AURA: 'aura', // 灼域：不参与战斗，移动后相邻扣血
  SEA: 'sea', // 海兽：持逐潮枪攻击 ×2
  DRAGON: 'dragon', // 龙：持龙牙匕攻击 ×2
  STAR: 'starVeil', // 星幕：防御随星柱守卫存活数变化
}

const has = (m, type) => (m.traits ?? []).some((t) => t.type === type)
const traitOf = (m, type) => (m.traits ?? []).find((t) => t.type === type)

/** 星幕：终焉之主的实际防御 = 280 + 125 × 存活星柱守卫数（0–4） */
export function effectiveDef(m, pillarsAlive = 0) {
  if (has(m, T.STAR)) return 280 + 125 * pillarsAlive
  return m.def
}

/** 勇者对该怪的有效攻击：特攻道具把「勇者攻击力」翻倍（先翻倍，再减防御） */
export function heroAtkVs(hero, m) {
  let atk = hero.atk
  if (has(m, T.SEA) && hero.flags?.tideSpear) atk *= 2
  if (has(m, T.DRAGON) && hero.flags?.dragonFang) atk *= 2
  return atk
}

/**
 * 战斗预判与结算（唯一的公式实现）：
 *   perHit   = 有效攻击 − 有效防御           ≤ 0 时打不动
 *   rounds   = ceil(怪物生命 / perHit)
 *   perRound = 魔攻 ? 怪物攻击 : max(0, 怪物攻击 − 勇者防御)；连击再 ×2
 *   hits     = 先攻 ? rounds : rounds − 1     （勇者先手，最后一击后怪物不还手）
 *   loss     = hits × perRound
 * 禁止战斗的情形：打不动（unpierceable）、或 loss ≥ 当前生命（不允许同归于尽）。
 */
export function combat(hero, m, { pillarsAlive = 0 } = {}) {
  const mdef = effectiveDef(m, pillarsAlive)
  const perHit = heroAtkVs(hero, m) - mdef
  if (perHit <= 0) {
    return { canFight: false, reason: 'unpierceable', perHit, rounds: null, perRound: null, loss: Infinity }
  }
  const rounds = Math.ceil(m.hp / perHit)
  let perRound = has(m, T.MAGIC) ? m.atk : Math.max(0, m.atk - hero.def)
  if (has(m, T.DOUBLE)) perRound *= 2
  const hits = has(m, T.FIRST) ? rounds : rounds - 1
  const loss = hits * perRound
  const canFight = loss < hero.hp
  return {
    canFight,
    reason: canFight ? null : 'lethal',
    perHit,
    rounds,
    perRound,
    loss,
  }
}

/** 灼域伤害（只在勇者发生位移后结算）：相邻的灼域怪伤害累加；持星穹盾为 0 */
export function auraDamage(hero, adjacentMonsters) {
  if (hero.flags?.starShield) return 0
  let sum = 0
  for (const m of adjacentMonsters) {
    const a = traitOf(m, T.AURA)
    if (a) sum += a.damage
  }
  return sum
}

/** 区号：第 n 层所在的区（1–5） */
export function zoneOf(floor) {
  return Math.ceil(floor / 10)
}

/** 晶石与药水在 z 区的效果（§4.1） */
export function consumableEffect(id, floor) {
  const z = zoneOf(floor)
  switch (id) {
    case 'redCrystal':
      return { atk: z + 1 }
    case 'blueCrystal':
      return { def: z + 1 }
    case 'redPotion':
      return { hp: 50 * z }
    case 'bluePotion':
      return { hp: 150 * z }
    default:
      return null
  }
}

/** 祭坛所在层的档位 t（§4.4）；非祭坛层返回 0 */
export const ALTAR_TIER = { 4: 1, 12: 2, 21: 3, 32: 4, 42: 5, 46: 5 }

/** 第 k 次购买（全塔累计，k 从 1 开始）的价格 */
export function altarPrice(k) {
  return 20 * k * k
}

/** 在档位 t 的祭坛买一次的收益 */
export function altarGain(t, choice) {
  if (choice === 'hp') return { hp: 150 * t }
  if (choice === 'atk') return { atk: 2 * t }
  if (choice === 'def') return { def: 3 * t }
  return null
}

/** 星幕：第 49 层的星柱守卫存活数决定终焉之主的防御（§3.3） */
export const STAR_PILLARS = 4
