export default [
  {
    "index": 1,
    "entry": {
      "x": 5,
      "y": 10
    },
    "legend": {
      "1": "mossBlob",
      "2": "caveBat",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Y": "yellowKey",
      "G": "guide"
    },
    "grid": [
      "^##########",
      ".##########",
      "....#######",
      "2.1P#######",
      ".#2........",
      "y##########",
      ".#YR.######",
      "Yy..1######",
      ".#PYU######",
      ".##########",
      "...1....1.G"
    ],
    "events": [
      {
        "id": "f1-guide",
        "floor": 1,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "say",
            "text": "这里的怪物会先伤你的血，先算清楚损失再打。打不动的怪先绕开，以后回来。"
          }
        ]
      }
    ]
  },
  {
    "index": 2,
    "entry": {
      "x": 1,
      "y": 0
    },
    "legend": {
      "1": "mossBlob",
      "2": "caveBat",
      "3": "boneSoldier",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey"
    },
    "grid": [
      "v.Y..3.y..^",
      "####y###y##",
      "###1.P#1.R#",
      "###Y2.#P2.#",
      "###12Y#.UQ#",
      "###########",
      "###########",
      "###########",
      "###########",
      "###########",
      "###########"
    ],
    "events": []
  },
  {
    "index": 3,
    "entry": {
      "x": 10,
      "y": 1
    },
    "legend": {
      "2": "caveBat",
      "3": "boneSoldier",
      "4": "sporeMage",
      "5": "stoneBeetle",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Y": "yellowKey",
      "L": "blueKey",
      "G": "guide"
    },
    "grid": [
      "##########v",
      "######GP.#.",
      "######Y3.y.",
      "######R2.#.",
      "##########.",
      "##########2",
      "##########Y",
      "###P..5.3#y",
      "##2...LY.yY",
      "#####y..U#.",
      "^.....4...."
    ],
    "events": [
      {
        "id": "f3-guide",
        "floor": 3,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "grantItem",
            "id": "compass"
          },
          {
            "op": "say",
            "text": "这是传送罗盘，可以回到去过的楼层。石甲虫守着蓝钥匙，等拿到剑再回来。"
          }
        ]
      }
    ]
  },
  {
    "index": 4,
    "entry": {
      "x": 0,
      "y": 9
    },
    "altar": true,
    "legend": {
      "1": "mossBlob",
      "3": "boneSoldier",
      "4": "sporeMage",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "A": "altar"
    },
    "grid": [
      "^#..R######",
      ".y.4.######",
      ".##########",
      ".#YPQ######",
      ".b.3.######",
      "3#1UY######",
      ".##########",
      "y#41.######",
      "Yy..A######",
      ".#P.3######",
      "v##########"
    ],
    "events": []
  }
]
