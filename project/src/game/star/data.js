// 《星穹塔》数据：怪物（§6）、道具（§4.2、§7）、商人（§5.2）。
// 原创数值与名称，依据 魔塔50层新玩法.md。不包含 reference 中的任何地图、名称或对白。

/** 怪物表（38 种）。traits 的 type 取值见 rules.js 的 T */
export const MONSTERS = {
  // 1 区 · 苔藓地窖
  mossBlob: { name: '苔团', hp: 30, atk: 16, def: 0, gold: 1, traits: [] },
  caveBat: { name: '洞蝠', hp: 30, atk: 22, def: 2, gold: 2, traits: [] },
  boneSoldier: { name: '朽骨兵', hp: 50, atk: 30, def: 5, gold: 4, traits: [] },
  sporeMage: { name: '蚀菌师', hp: 40, atk: 12, def: 4, gold: 5, traits: [{ type: 'magic' }] },
  stoneBeetle: { name: '石甲虫', hp: 20, atk: 35, def: 24, gold: 8, traits: [] },
  boneGuard: { name: '朽骨卫士', hp: 90, atk: 45, def: 12, gold: 10, traits: [] },
  jailer: { name: '持钥狱卒', hp: 80, atk: 50, def: 15, gold: 15, traits: [{ type: 'firstStrike' }] },
  wardenBoss: { name: '地窖看守长', hp: 300, atk: 70, def: 20, gold: 100, boss: true, traits: [] },
  // 2 区 · 潮汐机关城
  tideCrab: { name: '潮蟹', hp: 120, atk: 62, def: 10, gold: 8, traits: [] },
  cogPuppet: { name: '齿轮傀', hp: 70, atk: 75, def: 28, gold: 12, traits: [] },
  tideWitch: { name: '咒潮巫', hp: 90, atk: 30, def: 20, gold: 15, traits: [{ type: 'magic' }] },
  sharkGuard: { name: '鲛卫', hp: 280, atk: 90, def: 12, gold: 20, traits: [{ type: 'sea' }] },
  deepWarrior: { name: '深鳞武士', hp: 350, atk: 125, def: 25, gold: 30, traits: [{ type: 'sea' }] },
  ironClam: { name: '铁壳蚌', hp: 30, atk: 95, def: 70, gold: 28, traits: [] },
  twinBlade: { name: '双刃机偶', hp: 150, atk: 100, def: 35, gold: 25, traits: [{ type: 'doubleHit' }] },
  clawFiend: { name: '巨钳海魔', hp: 1000, atk: 150, def: 20, gold: 100, boss: true, traits: [{ type: 'sea' }] },
  tideBoss: { name: '潮汐司钟', hp: 900, atk: 180, def: 50, gold: 200, boss: true, traits: [{ type: 'sea' }] },
  // 3 区 · 镜廊
  mirrorShade: { name: '镜影', hp: 300, atk: 170, def: 40, gold: 30, traits: [] },
  echoMage: { name: '回声术士', hp: 160, atk: 50, def: 60, gold: 35, traits: [{ type: 'magic' }] },
  twinShade: { name: '双生影', hp: 250, atk: 175, def: 50, gold: 45, traits: [{ type: 'doubleHit' }] },
  glassGolem: { name: '琉璃傀', hp: 60, atk: 170, def: 100, gold: 40, traits: [] },
  mirrorBoss: { name: '镜廊之主', hp: 1200, atk: 260, def: 90, gold: 500, boss: true, traits: [{ type: 'firstStrike' }] },
  // 4 区 · 熔炉深处
  slagSoldier: { name: '炉渣兵', hp: 400, atk: 215, def: 80, gold: 45, traits: [] },
  magmaHound: { name: '熔火犬', hp: 250, atk: 235, def: 60, gold: 50, traits: [{ type: 'firstStrike' }] },
  forgeMage: { name: '锻魂师', hp: 240, atk: 70, def: 100, gold: 55, traits: [{ type: 'magic' }] },
  ironKnight: { name: '黑铁骑士', hp: 300, atk: 285, def: 140, gold: 70, traits: [] },
  hammerLord: { name: '重锤督军', hp: 450, atk: 255, def: 120, gold: 90, traits: [{ type: 'doubleHit' }] },
  coreGolem: { name: '熔核傀儡', hp: 100, atk: 350, def: 230, gold: 120, traits: [] },
  lavaDrake: { name: '熔岩巨龙', hp: 3000, atk: 500, def: 150, gold: 600, boss: true, traits: [{ type: 'dragon' }] },
  forgeBoss: { name: '熔炉督主', hp: 2200, atk: 420, def: 150, gold: 800, boss: true, traits: [] },
  // 5 区 · 星穹
  stardustWraith: { name: '星尘游魂', hp: 500, atk: 380, def: 120, gold: 80, traits: [] },
  auraPriest: { name: '灼域祭司', hp: 400, atk: 400, def: 180, gold: 90, traits: [{ type: 'aura', damage: 100 }] },
  voidBlade: { name: '虚空利刃', hp: 350, atk: 420, def: 150, gold: 100, traits: [{ type: 'doubleHit' }] },
  highAuraPriest: {
    name: '大灼域祭司', hp: 450, atk: 430, def: 200, gold: 110,
    traits: [{ type: 'aura', damage: 200 }, { type: 'firstStrike' }],
  },
  astralMage: { name: '星辉法皇', hp: 500, atk: 160, def: 220, gold: 120, traits: [{ type: 'magic' }] },
  domeGuard: { name: '穹顶铁卫', hp: 200, atk: 480, def: 360, gold: 200, traits: [] },
  pillarGuard: { name: '星柱守卫', hp: 600, atk: 520, def: 250, gold: 200, traits: [] },
  endLord: { name: '终焉之主', hp: 4000, atk: 720, def: 280, gold: 2000, boss: true, traits: [{ type: 'starVeil' }] },
}

/** 晶石与药水：效果随区变化，见 rules.js consumableEffect() */
export const CONSUMABLES = {
  redCrystal: { name: '红晶', kind: 'pickup' },
  blueCrystal: { name: '蓝晶', kind: 'pickup' },
  redPotion: { name: '红药水', kind: 'pickup' },
  bluePotion: { name: '蓝药水', kind: 'pickup' },
}

/** 钥匙 */
export const KEYS = {
  yellowKey: { name: '黄钥匙', kind: 'pickup', color: 'y' },
  blueKey: { name: '蓝钥匙', kind: 'pickup', color: 'b' },
  redKey: { name: '红钥匙', kind: 'pickup', color: 'r' },
}

/** 剑与盾（拾取即用，加到攻击或防御上，可叠加） */
export const GEAR = {
  oldIronSword: { name: '旧铁剑', kind: 'pickup', atk: 10 },
  woodShield: { name: '木纹圆盾', kind: 'pickup', def: 10 },
  tideShield: { name: '潮纹盾', kind: 'pickup', def: 20 },
  tideSword: { name: '潮钢剑', kind: 'pickup', atk: 20 },
  mirrorShield: { name: '镜银盾', kind: 'pickup', def: 35 },
  mirrorSword: { name: '镜锋剑', kind: 'pickup', atk: 35 },
  furnaceShield: { name: '炉铸盾', kind: 'pickup', def: 50 },
  meltSword: { name: '熔心剑', kind: 'pickup', atk: 50 },
  starShield: { name: '星穹盾', kind: 'pickup', def: 80, immuneAura: true },
  starSword: { name: '星陨剑', kind: 'pickup', atk: 80 },
}

/** 持有生效的特殊道具 */
export const HOLD = {
  tideSpear: { name: '逐潮枪', kind: 'hold', flag: 'tideSpear' },
  charm: { name: '聚财符', kind: 'hold', flag: 'charm' },
  dragonFang: { name: '龙牙匕', kind: 'hold', flag: 'dragonFang' },
}

/** 主动使用的道具（进背包） */
export const ACTIVE = {
  compass: { name: '传送罗盘', kind: 'active', uses: Infinity },
  pickaxe: { name: '矿镐', kind: 'active', uses: Infinity },
  flask: { name: '蓄能瓶', kind: 'active', uses: 1 },
  mirrorJump: { name: '镜面跃迁器', kind: 'active', uses: Infinity },
  frostCore: { name: '霜核', kind: 'active', uses: Infinity },
  bomb: { name: '炸药', kind: 'active', uses: 1 },
}

/** 商人（§5.2）。每件只卖一次，除非标注不限次 */
export const MERCHANTS = {
  6: [{ id: 'm6a', items: { yellowKey: 3 }, price: 30 }],
  12: [{ id: 'm12a', items: { redKey: 1 }, price: 800 }],
  15: [{ id: 'm15a', items: { blueKey: 1 }, price: 150 }],
  27: [
    { id: 'm27a', items: { blueKey: 1 }, price: 300 },
    { id: 'm27b', recycle: 'yellowKey', gold: 80, unlimited: true },
  ],
  31: [{ id: 'm31a', items: { yellowKey: 4, blueKey: 1 }, price: 800 }],
  38: [{ id: 'm38a', items: { yellowKey: 3 }, price: 400 }],
  45: [{ id: 'm45a', hp: 2000, price: 1000 }],
  47: [{ id: 'm47a', items: { bomb: 1 }, price: 1500 }],
}

/** 引路人出现的层（§10） */
export const GUIDE_FLOORS = [1, 3, 5, 7, 11, 21, 27, 31, 41]

/** 层的数量：50 层，第 50 层为终焉王座 */
export const LAST_FLOOR = 50
