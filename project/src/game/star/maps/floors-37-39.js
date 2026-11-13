// 《星穹塔》第 37–39 层地图（草稿，待校验）。
// 字符：. 空地  # 墙  % 裂墙  w 假墙  ~ 熔岩  * 虚空  y/b/r 门  a 机关门  ^ 上楼梯  v 下楼梯
// 其余字符按本层 legend 查实体。
export default [
  {
    index: 37,
    entry: { x: 9, y: 10 },
    legend: { s: 'ironKnight', t: 'hammerLord', u: 'coreGolem', R: 'redCrystal', U: 'blueCrystal', P: 'redPotion', Q: 'bluePotion', Y: 'yellowKey', L: 'blueKey' },
    grid: [
      '^##########',
      '.##########',
      '.#R.#######',
      '.#RR#u#UUU#',
      '.##%#.#%###',
      '..YPyYytRU#',
      't##%#y#%###',
      '.#QQ#s#YYYY',
      '.#QQ#P#YYLL',
      '.##########',
      '.......s..v',
    ],
    events: [
      { id: 'f37-dragon', floor: 37, trigger: { op: 'defeated', at: { x: 5, y: 3 } }, effects: [{ op: 'spawnItem', x: 5, y: 3, id: 'dragonFang' }] },
    ],
  },
  {
    index: 38,
    entry: { x: 0, y: 1 },
    legend: { s: 'ironKnight', t: 'hammerLord', q: 'forgeMage', u: 'coreGolem', P: 'redPotion', Q: 'bluePotion', R: 'redCrystal', U: 'blueCrystal', Y: 'yellowKey', L: 'blueKey', W: 'meltSword', N: 'merchant' },
    grid: [
      'v####^#####',
      '.#P##.##W##',
      'Y#R##.##b##',
      's#t##s##P##',
      'y#y##.##b##',
      '.q..q.yt.LN',
      '###y####y##',
      '###u####s##',
      '##YU####Y##',
      '###Q#######',
      '###########',
    ],
    events: [],
  },
  {
    index: 39,
    entry: { x: 5, y: 1 },
    legend: { t: 'hammerLord', s: 'ironKnight', u: 'coreGolem', p: 'magmaHound', P: 'redPotion', Q: 'bluePotion', R: 'redCrystal', U: 'blueCrystal', Y: 'yellowKey', E: 'redKey' },
    grid: [
      '#####v#####',
      '#..s..yp~Q#',
      '#Y##Yy###Q#',
      '#.yt#sY##Q#',
      '#.#P#######',
      '#t###E####^',
      '#.#R#a##U#.',
      '#y#t#u##s#.',
      '#.#y#u##b#.',
      '#.P.Y.P.pQ.',
      '###########',
    ],
    events: [
      { id: 'f39-gate', floor: 39, trigger: { op: 'allDefeated', at: [{ x: 5, y: 8 }, { x: 5, y: 7 }] }, effects: [{ op: 'setTerrain', x: 5, y: 6, terrain: '.' }] },
    ],
  },
]
