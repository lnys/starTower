// 《星穹塔》素材对照表：星穹的实体 id -> images/ 下已有的 SVG 键名。
// NPC 与全部怪物均有图标；部分怪物使用现有造型的配色变体。
// 图标仅影响展示，怪物属性和战斗规则不变。

/** 地形主题：按区（1–5）选择地面与墙面。潮汐机关城暂无专用图，借用石面。 */
export const ZONE_TILES = {
  1: { floor: 'tiles/floor_dusk', wall: 'tiles/wall_dusk' }, // 苔藓地窖改为暖棕石砖（不用绿色）
  2: { floor: 'tiles/floor_stone', wall: 'tiles/wall_stone' }, // 占位：缺潮汐专用图
  3: { floor: 'tiles/floor_ice', wall: 'tiles/wall_ice' },
  4: { floor: 'tiles/floor_lava', wall: 'tiles/wall_lava' },
  5: { floor: 'tiles/floor_abyss', wall: 'tiles/wall_abyss' },
}

/** 地形覆盖图（画在地面上）。'#'、'w' 用墙面；'%'、'a' 是墙面加文字标记（缺图） */
export const TERRAIN_ART = {
  '*': 'tiles/floor_void',
  '~': 'tiles/floor_lava',
  '^': 'tiles/stair_up',
  v: 'tiles/stair_down',
  y: 'tiles/door_y',
  b: 'tiles/door_b',
  r: 'tiles/door_r',
}

export const NPC_ART = {
  merchant: 'tiles/shop',
  guide: 'tiles/npc_guide',
  altar: 'tiles/npc_altar',
  goddess: 'hero/goddess',
}

export const MONSTER_ART = {
  tideCrab: 'monsters/tideCrab',
  cogPuppet: 'monsters/cogPuppet',
  sharkGuard: 'monsters/sharkGuard',
  deepWarrior: 'monsters/deepWarrior',
  ironClam: 'monsters/ironClam',
  twinBlade: 'monsters/twinBlade',
  clawFiend: 'monsters/clawFiend',
  tideBoss: 'monsters/tideBoss',
  mirrorShade: 'monsters/mirrorShade',
  echoMage: 'monsters/echoMage',
  twinShade: 'monsters/twinShade',
  glassGolem: 'monsters/glassGolem',
  slagSoldier: 'monsters/slagSoldier',
  forgeMage: 'monsters/forgeMage',
  hammerLord: 'monsters/hammerLord',
  stardustWraith: 'monsters/stardustWraith',
  auraPriest: 'monsters/auraPriest',
  voidBlade: 'monsters/voidBlade',
  highAuraPriest: 'monsters/highAuraPriest',
  astralMage: 'monsters/astralMage',
  domeGuard: 'monsters/domeGuard',
  pillarGuard: 'monsters/pillarGuard',

  mossBlob: 'monsters/mon_1',
  caveBat: 'monsters/mon_3',
  boneSoldier: 'monsters/mon_4',
  sporeMage: 'monsters/mon_E',
  stoneBeetle: 'monsters/mon_6',
  boneGuard: 'monsters/mon_5',
  jailer: 'monsters/mon_9',
  wardenBoss: 'monsters/mon_8',
  tideWitch: 'monsters/mon_J',
  magmaHound: 'monsters/mon_C',
  ironKnight: 'monsters/mon_D',
  coreGolem: 'monsters/mon_L',
  mirrorBoss: 'monsters/mon_I',
  lavaDrake: 'monsters/mon_F',
  forgeBoss: 'monsters/mon_V',
  endLord: 'monsters/endLord',
}

export const ITEM_ART = {
  tideSpear: 'items/tideSpear',
  charm: 'items/charm',
  dragonFang: 'items/dragonFang',
  compass: 'items/compass',
  pickaxe: 'items/pickaxe',
  flask: 'items/flask',
  mirrorJump: 'items/mirrorJump',
  frostCore: 'items/frostCore',
  bomb: 'items/bomb',
  redCrystal: 'items/gem_a',
  blueCrystal: 'items/gem_p',
  redPotion: 'items/potion_s',
  bluePotion: 'items/potion_h',
  yellowKey: 'items/key_y',
  blueKey: 'items/key_b',
  redKey: 'items/key_r',
  oldIronSword: 'items/sword',
  tideSword: 'items/sword',
  mirrorSword: 'items/sword',
  meltSword: 'items/sword',
  starSword: 'items/sword',
  woodShield: 'items/shield',
  tideShield: 'items/shield',
  mirrorShield: 'items/shield',
  furnaceShield: 'items/shield',
  starShield: 'items/shield',
}

/** 状态栏与勇者图标。 */
export const UI_ICON = {
  gold: 'ui/icon_gold',
  hp: 'ui/icon_hp',
  atk: 'ui/icon_atk',
  def: 'ui/icon_def',
  hero: 'hero/hero',
}
