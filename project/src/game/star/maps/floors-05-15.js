export default [
  {
    "index": 5,
    "entry": {
      "x": 1,
      "y": 0
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
      "T": "oldIronSword",
      "G": "guide"
    },
    "grid": [
      "v.Y2Yy.....",
      "####y##y##.",
      "Y2G..#..P#.",
      "..5..#.4.#.",
      "U....#R.Y#.",
      "##y#######^",
      ".....######",
      ".3.3.######",
      "P....wT####",
      "..3..######",
      "###########"
    ],
    "events": [
      {
        "id": "f5-guide",
        "floor": 5,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "say",
            "text": "墙不全是实心的。有的墙是空心的，多看几眼它的厚度。"
          }
        ]
      },
      {
        "id": "f5-guide",
        "floor": 5,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "say",
            "text": "有的墙是空心的。留意墙面上不一样的地方。"
          }
        ]
      }
    ]
  },
  {
    "index": 6,
    "entry": {
      "x": 9,
      "y": 5
    },
    "legend": {
      "3": "boneSoldier",
      "4": "sporeMage",
      "5": "stoneBeetle",
      "6": "boneGuard",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "L": "blueKey",
      "N": "merchant"
    },
    "grid": [
      "###########",
      "YN3#..5####",
      "..P#R.L####",
      "4..#Y..####",
      "#y###y#####",
      "^..3.y.YY.v",
      "#y###b##y##",
      ".P.#...#..#",
      "3.4#U.Q#.P#",
      ".5.#.6.#..#",
      "###########"
    ],
    "events": []
  },
  {
    "index": 7,
    "entry": {
      "x": 1,
      "y": 5
    },
    "legend": {
      "3": "boneSoldier",
      "4": "sporeMage",
      "5": "stoneBeetle",
      "6": "boneGuard",
      "P": "redPotion",
      "Q": "bluePotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "Y": "yellowKey",
      "G": "guide"
    },
    "grid": [
      "###########",
      "#Y.4#.#.YR#",
      "#...#.y5..#",
      "#.5.#.#####",
      "##y#G.#P.U#",
      "v..Y..y.6Y#",
      "##y##.#####",
      "#3..#.#..Q#",
      "#.6.#3y.6.#",
      "#..P#.#####",
      "#####.....^"
    ],
    "events": [
      {
        "id": "f7-guide",
        "floor": 7,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "say",
            "text": "祭坛优先买防御。攻击只要够破防就行，别把金币全压在攻击上。"
          }
        ]
      }
    ]
  },
  {
    "index": 8,
    "entry": {
      "x": 9,
      "y": 10
    },
    "legend": {
      "4": "sporeMage",
      "5": "stoneBeetle",
      "6": "boneGuard",
      "7": "jailer",
      "P": "redPotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "Y": "yellowKey",
      "E": "redKey"
    },
    "grid": [
      "###########",
      "R..#...#..P",
      "..4#..P#...",
      "Y..#...#...",
      "#y###y###y#",
      ".5.#...#...",
      "..6#.6.#YEU",
      "Y..#...#...",
      "#y###b###a#",
      "...Y4P.77..",
      "#####^.6..v"
    ],
    "events": [
      {
        "id": "f8-machine",
        "floor": 8,
        "trigger": {
          "op": "allDefeated",
          "at": [
            {
              "x": 7,
              "y": 9
            },
            {
              "x": 8,
              "y": 9
            }
          ]
        },
        "effects": [
          {
            "op": "setTerrain",
            "x": 9,
            "y": 8,
            "terrain": "."
          }
        ]
      }
    ]
  },
  {
    "index": 9,
    "entry": {
      "x": 4,
      "y": 10
    },
    "legend": {
      "3": "boneSoldier",
      "4": "sporeMage",
      "6": "boneGuard",
      "7": "jailer",
      "P": "redPotion",
      "Q": "bluePotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "Y": "yellowKey",
      "L": "blueKey",
      "H": "woodShield"
    },
    "grid": [
      "###########",
      "##..#.6.#.R",
      "^#3.#..Ly..",
      ".#..yY..#..",
      ".#Y.#.4Uw7H",
      ".y..####b..",
      ".#4.y..3#..",
      "6#.P#.6.y6Q",
      ".#..#P..#..",
      ".##########",
      "..YY.v#####"
    ],
    "events": []
  },
  {
    "index": 10,
    "entry": {
      "x": 1,
      "y": 2
    },
    "legend": {
      "6": "boneGuard",
      "7": "jailer",
      "8": "wardenBoss",
      "Q": "bluePotion"
    },
    "grid": [
      "###########",
      "###########",
      "v.#.....###",
      "#.#.....###",
      "#6#.....###",
      "#.#..8..###",
      "#6###r#####",
      "#...7..y7.#",
      "##y#####.6#",
      "#..6.######",
      "#Q...######"
    ],
    "events": [
      {
        "id": "f10-boss",
        "floor": 10,
        "trigger": {
          "op": "defeated",
          "at": {
            "x": 5,
            "y": 5
          }
        },
        "effects": [
          {
            "op": "addStair",
            "x": 5,
            "y": 4,
            "dir": "up"
          },
          {
            "op": "spawnItem",
            "x": 5,
            "y": 5,
            "id": "redCrystal"
          },
          {
            "op": "spawnItem",
            "x": 4,
            "y": 5,
            "id": "blueCrystal"
          }
        ]
      }
    ]
  },
  {
    "index": 11,
    "entry": {
      "x": 6,
      "y": 4
    },
    "legend": {
      "0": "cogPuppet",
      "9": "tideCrab",
      "G": "guide",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "R": "redCrystal",
      "U": "blueCrystal",
      "c": "tideWitch"
    },
    "grid": [
      "#####GP#P#.",
      "#####Y.#Y#R",
      "#####.9#0#c",
      "######y#y#y",
      "#####v.Y9..",
      "######yb##.",
      "######Q9##Y",
      "######09##.",
      "######U9##^",
      "###########",
      "###########"
    ],
    "events": [
      {
        "id": "f11-guide",
        "floor": 11,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "say",
            "text": "二区到此过半。海里来的东西怕一把枪，那把枪藏在 14 层的假墙后面。"
          }
        ]
      }
    ]
  },
  {
    "index": 12,
    "entry": {
      "x": 10,
      "y": 7
    },
    "altar": true,
    "legend": {
      "0": "cogPuppet",
      "9": "tideCrab",
      "c": "tideWitch",
      "Y": "yellowKey",
      "L": "blueKey",
      "P": "redPotion",
      "Q": "bluePotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "A": "altar",
      "N": "merchant"
    },
    "grid": [
      "###########",
      "..P#####R..",
      ".0.#9..#.9.",
      "c..#.A.#Y..",
      ".Y.#N..#..c",
      "...##.##...",
      "#y###y###y#",
      "...Y..Y.9..",
      "^#y#####y#v",
      "#0.L###9.0#",
      "#UP.###.Q.#"
    ],
    "events": []
  },
  {
    "index": 13,
    "entry": {
      "x": 0,
      "y": 7
    },
    "legend": {
      "0": "cogPuppet",
      "9": "tideCrab",
      "c": "tideWitch",
      "d": "sharkGuard",
      "Y": "yellowKey",
      "P": "redPotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "B": "tideShield"
    },
    "grid": [
      "###########",
      "###########",
      ".y9Ydy....^",
      ".##y###b#y#",
      "Y##..#0.#..",
      ".##P.#..#U.",
      "Y##.0#.c#.c",
      ".##..#..#P.",
      "v##9.#9.#0.",
      "###..#..#PR",
      "###..#.B#.."
    ],
    "events": []
  },
  {
    "index": 14,
    "entry": {
      "x": 9,
      "y": 2
    },
    "legend": {
      "0": "cogPuppet",
      "c": "tideWitch",
      "d": "sharkGuard",
      "f": "ironClam",
      "Y": "yellowKey",
      "L": "blueKey",
      "E": "redKey",
      "P": "redPotion",
      "Q": "bluePotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "I": "tideSpear"
    },
    "grid": [
      "###########",
      "#YdcP######",
      "#UR.0y.d..v",
      "##y###.####",
      "#L0PY#Y####",
      "######.####",
      "#.cfEb.wdI#",
      "##y###.y..#",
      "#Q.0.#Y#..#",
      "#####..####",
      "#####^#####"
    ],
    "events": []
  },
  {
    "index": 15,
    "entry": {
      "x": 5,
      "y": 9
    },
    "legend": {
      "0": "cogPuppet",
      "d": "sharkGuard",
      "c": "tideWitch",
      "h": "clawFiend",
      "P": "redPotion",
      "Q": "bluePotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "Y": "yellowKey",
      "M": "pickaxe",
      "N": "merchant"
    },
    "grid": [
      "###########",
      "##P.R#....#",
      "##c0.#...c#",
      "##..Y#.hM.#",
      "##.U.#....#",
      "^.y###.d..#",
      "#.#Pd#..0.#",
      "#.yQN#....#",
      "#.####....#",
      "#.YdY.y####",
      "#####v#####"
    ],
    "events": []
  }
]
