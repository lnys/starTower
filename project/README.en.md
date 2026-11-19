# Star Dome Tower · A 50-Floor RPG

[简体中文](README.md)

A deterministic tower RPG built with Vue 3 and Vite. The active 50-floor game lives in `src/game/star/`. There are no experience points or levels: grow stronger with crystals, equipment, and altars, then defeat the Banshee of Ruin on floor 50.

```bash
npm install
npm run dev
npm run build              # Standalone page; open directly
npm test                   # Rules, maps, and verified route replay
npm run test:simulate      # Search for a full route; slower
npm run test:no-altar      # No-altars test; expected to stall before floor 20
npm run test:double-keys   # Control test with double map keys
```

Move with the arrow keys or WASD. Walking into a monster starts combat unless the preview shows that you would die or cannot deal damage. Opening doors, revealing false walls, and fighting do not move the hero; take another step to enter the tile. Use the inventory for the compass, pickaxe, Vital Flask, Mirror Jumper, Frost Core, and explosives. You can save and undo up to 50 steps. Click a monster for a full preview, or click the one-line hint below the board to expand dialogue and feedback. Vue and Flutter Web share maps, balance, and story content, with the same hint and shop interactions as mobile. See the [Flutter guide](flutter/README.md) for web builds.

The verified route clears the game in 3,779 steps with 378 attack, 501 defense, and 1,241 HP remaining. It uses neither hidden mode nor edited stats. The default tests replay the route in the real engine, checking that every action succeeds and HP stays above zero. See the [verification report](docs/通关验证.md).

Key directories: `src/game/star/` (engine and maps), `src/stores/star.js` (application state), `src/components/` (UI), `tests/` (automated checks), and `images/` (art). `src/game/original/` and `reference/` are historical references, not the basis for the current clear route.

## 60-Second Trailer

From the underground mines to the starry summit, tour all five regions in one minute. Gameplay footage shows combat previews, choices about spending keys, items, and undo as the hero climbs 50 floors to rescue the goddess.

https://github.com/user-attachments/assets/ee59ad69-22ea-4ac1-bb5e-8aaae13b1f35

[Download Original (MP4 · 16:9 · 1920 × 1080)](video/cl/星穹塔-主宣传片-60s-16x9.mp4)

## Electron Desktop

```bash
npm run desktop        # Build and launch
npm run desktop:test   # Desktop smoke test
npm run dist:mac       # Mac Universal DMG / ZIP
npm run dist:win       # Windows x64 installer / portable
```

Mac packages are built into `release/` and require macOS 13 or newer. See the [desktop packaging guide](docs/桌面版打包.md). Desktop saves live in the fixed `StarDomeTower` user-data directory, separate from browser saves.

## Updates

**v1.0.5:** Aligns the UI across iOS, Android, Vue Web, and Flutter Web; adds an animated title screen and five optional themes; raises music and effect volume. Maps, combat rules, and save formats are unchanged. The update also adds in-game language switching and removes the download QR promo from Vue without removing touch controls. See the [changelog](游戏更新说明.md).

[Flutter v1.0.5 downloads](https://github.com/lnys/starTower/releases/tag/v1.0.5): Windows, macOS, Android test APK, and iOS simulator ZIP.

## Language

Open **Settings → Language** from the title screen or in-game to switch instantly between **简体中文 / English / 日本語**. Simplified Chinese is the default. Your choice is saved in the app or browser and does not affect game saves. Menus, combat and shop feedback, item and monster names, dialogue, and endings all follow the selected language.

Vue and Flutter share `design/translations.json`, with English and Japanese entries for the Chinese source text. After editing it, run `node flutter/tool/sync_translations.mjs`. If you add Japanese characters, follow the [Flutter guide](flutter/README.md) to update the offline font subset.

## Themes

Open **Settings → Visual Style** at the title screen or in the game menu to choose from Star Dome Classic, Warcraft, World of Warcraft, League of Legends, Retro Chinese, and Pixel Art. All platforms offer the same themes. The preference stays in the app or browser, outside your game save. Themes use original UI artwork, not third-party game assets.

Theme colors live in `design/styles.json`; after editing, run `node flutter/tool/generate_styles.mjs` to sync Flutter. Pixel art is generated from the existing sprites; run `python3 scripts/generate-pixel-art.py` to update both clients.
