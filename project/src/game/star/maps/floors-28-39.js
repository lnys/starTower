// 《星穹塔》第 28–39 层地图（草稿，待校验）。
// 字符：. 空地  # 墙  % 裂墙  w 假墙  ~ 熔岩  * 虚空  y/b/r 门  a 机关门  ^ 上楼梯  v 下楼梯
// 其余字符按本层 legend 查实体。
export default [
  {
    index: 28,
    entry: { x: 5, y: 1 },
    legend: { j: 'mirrorShade', l: 'twinShade', m: 'glassGolem', Y: 'yellowKey', L: 'blueKey', Q: 'bluePotion', K: 'mirrorSword' },
    grid: [
      '#####v#####',
      '#####.#####',
      '#####.j...^',
      '#####.###%#',
      '#####.###K#',
      '..yY...b...',
      '#.###y###y#',
      'Ym.#.m.#.l.',
      '...#Y..#l.Q',
      'Lm.#.j.#...',
      '###########',
    ],
    events: [],
  },
]
