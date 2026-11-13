export default [
  {
    "index": 40,
    "entry": {
      "x": 9,
      "y": 5
    },
    "legend": {
      "t": "hammerLord",
      "s": "ironKnight",
      "z": "forgeBoss",
      "Q": "bluePotion"
    },
    "grid": [
      "###########",
      "##.......##",
      "##.......##",
      "##.......##",
      "##.......##",
      "#####z###.v",
      "#####r.t..#",
      "##.#.s.s..#",
      "#..#.s...Q#",
      "#s....#.Q.#",
      "###.#t#.###"
    ],
    "events": [
      {
        "id": "f40-boss-down",
        "floor": 40,
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
            "y": 4,
            "id": "blueCrystal"
          },
          {
            "op": "say",
            "text": "熔炉督主倒下，王座深处升起通往 41 层的阶梯。"
          }
        ]
      }
    ]
  },
  {
    "index": 41,
    "entry": {
      "x": 5,
      "y": 3
    },
    "legend": {
      "!": "stardustWraith",
      "?": "auraPriest",
      "&": "voidBlade",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "L": "blueKey",
      "G": "guide"
    },
    "grid": [
      "##G###P#L##",
      "##P###Y#P##",
      "^#y###y#y##",
      "...!Y..!.yQ",
      "##y?#v#?b#Y",
      "##!#####!##",
      "##R#####U##",
      "##&########",
      "###########",
      "###########",
      "###########"
    ],
    "events": [
      {
        "id": "f41-guide",
        "floor": 41,
        "trigger": {
          "op": "talked",
          "npc": "guide"
        },
        "effects": [
          {
            "op": "say",
            "text": "五区检查点：祭司身边每走一步都会被灼伤，绕着它走。43 层有一面墙不对劲。"
          }
        ]
      }
    ]
  },
  {
    "index": 42,
    "entry": {
      "x": 0,
      "y": 3
    },
    "legend": {
      "!": "stardustWraith",
      "?": "auraPriest",
      "&": "voidBlade",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "A": "altar"
    },
    "grid": [
      "#####U#####",
      "#YP.#.#Y#.#",
      "v#..#b#.!.#",
      ".#!.#.#.yY#",
      ".##y#.Ay##?",
      "..!........",
      "###y?.?y##.",
      "#.&.#.#&.#.",
      "#.R.#b#.P#^",
      "#####.#####",
      "#####Q#####"
    ],
    "events": []
  },
  {
    "index": 43,
    "entry": {
      "x": 9,
      "y": 8
    },
    "legend": {
      "?": "auraPriest",
      "+": "highAuraPriest",
      "&": "voidBlade",
      "!": "stardustWraith",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "L": "blueKey"
    },
    "grid": [
      "###########",
      "#L.......?#",
      "#.###.###.#",
      "#PyP#w#Yy.#",
      "#.##.^.##.#",
      "#&byQ.&##P#",
      "#.##&U+##.#",
      "#YyY###Ry.#",
      "^.#######.v",
      "#?...!.!.?#",
      "###########"
    ],
    "events": [],
    "stairTo": {
      "0,8": 45
    }
  },
  {
    "index": 44,
    "entry": {
      "x": 5,
      "y": 3
    },
    "legend": {
      "=": "domeGuard",
      "P": "redPotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "X": "starShield"
    },
    "grid": [
      "###########",
      "#P.......P#",
      "#.........#",
      "#.........#",
      "#....v....#",
      "#.........#",
      "#......=.=#",
      "########a##",
      "######PP.%X",
      "######RU.##",
      "###########"
    ],
    "events": [
      {
        "id": "f44-domeguards",
        "floor": 44,
        "trigger": {
          "op": "allDefeated",
          "at": [
            {
              "x": 7,
              "y": 6
            },
            {
              "x": 9,
              "y": 6
            }
          ]
        },
        "effects": [
          {
            "op": "setTerrain",
            "x": 8,
            "y": 7,
            "terrain": "."
          },
          {
            "op": "say",
            "text": "两名穹顶铁卫倒下，机关门缓缓升起。"
          }
        ]
      }
    ]
  },
  {
    "index": 45,
    "entry": {
      "x": 1,
      "y": 8
    },
    "legend": {
      "+": "highAuraPriest",
      "?": "auraPriest",
      "&": "voidBlade",
      "$": "astralMage",
      "N": "merchant",
      "C": "bomb",
      "R": "redCrystal",
      "U": "blueCrystal",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey"
    },
    "grid": [
      "###########",
      "###########",
      "#&N.#.#.U$#",
      "#P.Ry.b&.Q#",
      "#.?.#.#####",
      "#####.y?y.^",
      "#####.#####",
      "##+Py&b+y.#",
      "v.###.#.#C#",
      "#.YYY.#####",
      "###########"
    ],
    "events": [],
    "stairTo": {
      "0,8": 43
    }
  },
  {
    "index": 46,
    "entry": {
      "x": 9,
      "y": 5
    },
    "legend": {
      "!": "stardustWraith",
      "$": "astralMage",
      "+": "highAuraPriest",
      "&": "voidBlade",
      "A": "altar",
      "P": "redPotion",
      "Q": "bluePotion",
      "R": "redCrystal",
      "U": "blueCrystal",
      "Y": "yellowKey",
      "Z": "starSword"
    },
    "grid": [
      "###########",
      "#PAR###PU.#",
      "#.!.%Z#..P#",
      "#.$$###+..#",
      "##y#####b##",
      "#...&.YY..v",
      "##y##y##y##",
      "#!.Y#.#...#",
      "#.&.#y#.+Q#",
      "#####.#####",
      "#####^#####"
    ],
    "events": []
  },
  {
    "index": 47,
    "entry": {
      "x": 5,
      "y": 9
    },
    "legend": {
      "$": "astralMage",
      "+": "highAuraPriest",
      "&": "voidBlade",
      "N": "merchant",
      "P": "redPotion",
      "Q": "bluePotion",
      "Y": "yellowKey",
      "U": "blueCrystal",
      "R": "redCrystal"
    },
    "grid": [
      "^##########",
      ".##########",
      "+##########",
      ".##########",
      "Y##########",
      "Q#P#U#R#P##",
      "+#y#b#$#y##",
      ".#Y#&#+#Y##",
      ".#y#b#y#y##",
      ".&.$...$.N#",
      "#####v#####"
    ],
    "events": []
  },
  {
    "index": 48,
    "entry": {
      "x": 1,
      "y": 0
    },
    "legend": {
      "$": "astralMage",
      "+": "highAuraPriest",
      "&": "voidBlade",
      "!": "stardustWraith",
      "P": "redPotion",
      "Q": "bluePotion",
      "L": "blueKey",
      "E": "redKey",
      "Y": "yellowKey",
      "R": "redCrystal",
      "U": "blueCrystal"
    },
    "grid": [
      "v.#########",
      "#...!...P+#",
      "Q#y####b#.#",
      "L%P##Y#U#.#",
      "Q####y###.#",
      "#+&.Y.$.&.#",
      "#.#y###y###",
      "#.#R#P#Y#E#",
      "#.###y###b#",
      "#$.$...!.&.",
      "##########^"
    ],
    "events": []
  },
  {
    "index": 49,
    "entry": {
      "x": 9,
      "y": 10
    },
    "legend": {
      "<": "pillarGuard",
      "+": "highAuraPriest",
      "Q": "bluePotion",
      "r": "redDoor"
    },
    "grid": [
      "***********",
      "***********",
      "**Q.....Q**",
      "**.<...<.**",
      "**.......**",
      "**+..^..+**",
      "**.......**",
      "**.<...<.**",
      "**.......r*",
      "*********.*",
      "*********.v"
    ],
    "events": [
      {
        "id": "f49-pillars",
        "floor": 49,
        "trigger": {
          "op": "enterTile",
          "at": {
            "x": 9,
            "y": 9
          }
        },
        "effects": [
          {
            "op": "say",
            "text": "四根星柱支撑着星幕。每击破一根，终焉之主的防御就减少 125。"
          }
        ]
      }
    ]
  },
  {
    "index": 50,
    "entry": {
      "x": 5,
      "y": 4
    },
    "legend": {
      "@": "endLord"
    },
    "grid": [
      "***********",
      "***********",
      "**.......**",
      "**...@...**",
      "**.......**",
      "**...v...**",
      "**.......**",
      "**.......**",
      "**.......**",
      "***********",
      "***********"
    ],
    "events": []
  }
]
