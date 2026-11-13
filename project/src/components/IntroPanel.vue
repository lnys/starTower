<script setup>
// 电脑端右侧：大标题、游戏介绍、玩法与攻略，底部为扫码二维码（整体一屏）
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

// 扫码地址固定为游戏的公开地址（不随打开的网址变化）
const QR_URL = 'https://www.fastmini.cn/gameMt/'
const qr = ref('')
const pageUrl = QR_URL

onMounted(async () => {
  try {
    qr.value = await QRCode.toDataURL(QR_URL, {
      width: 240,
      margin: 1,
      color: { dark: '#14142e', light: '#ffffff' },
    })
  } catch {
    qr.value = ''
  }
})

const route = [
  { f: '1–10 层', t: '苔藓地窖 · 地窖看守长' },
  { f: '11–20 层', t: '潮汐机关城 · 潮汐司钟' },
  { f: '21–30 层', t: '镜廊 · 镜廊之主' },
  { f: '31–40 层', t: '熔炉深处 · 熔炉督主' },
  { f: '41–50 层', t: '星穹 · 终焉之主' },
]
</script>

<template>
  <aside class="intro" aria-label="游戏介绍">
    <header class="intro-head">
      <h1 class="brand-cn">星穹塔</h1>
      <div class="brand-en">STAR DOME TOWER · 50 层</div>
      <p class="tagline">一座从地底矿窖修到星空里的观星塔。守塔人把星图锁进了塔顶，你要一路上去，把星幕关掉。</p>
    </header>

    <section class="block intro-story">
      <h3>游戏简介</h3>
      <p class="plain">
        每一层都是 11×11 的固定地图，全塔分五个区。没有经验、没有随机数：战斗结果在开打前就能算清楚，
        变强只靠晶石、剑盾与祭坛。钥匙永远比门少，要取舍这扇门值不值得开。
      </p>
    </section>

    <section class="block route-block">
      <h3>五个区</h3>
      <ol class="route">
        <li v-for="r in route" :key="r.f"><b>{{ r.f }}</b><span>{{ r.t }}</span></li>
      </ol>
    </section>

    <section class="block">
      <h3>核心玩法</h3>
      <ul class="cards">
        <li><b>战斗预判</b><span>与怪物相邻时，下方卡片显示损失、回合数与需要的生命。会死亡或无法破防的怪，游戏拒绝你走进去。</span></li>
        <li><b>钥匙与门</b><span>黄、蓝、红钥匙开对应颜色的门，用完即消失。钥匙比门少，每层都要放弃几扇门。</span></li>
        <li><b>祭坛与商人</b><span>祭坛用金币换生命、攻击或防御，价格随全塔购买次数上涨。商人只卖一次性的补给。</span></li>
        <li><b>撤销与存档</b><span>撤销最多 50 步，换层时自动存档，也可以随时手动存档。</span></li>
        <li><b>灼域</b><span>第 41 层之后，灼域怪会在你走完一步后灼伤相邻的勇者。星穹盾可以免疫。</span></li>
        <li><b>引路人</b><span>她会在关键的层给你提示与检查点，也会赠送传送罗盘。</span></li>
      </ul>
    </section>

    <div class="trio">
      <section class="block">
        <h3>攻略小贴士</h3>
        <ul class="tips">
          <li>先看卡片：「会死亡」与「无法破防」的怪先绕开。</li>
          <li>祭坛优先买防御，攻击只要够越过数值门即可。</li>
          <li>门、假墙、怪物都不会让你移动；走进去之前先看清楚。</li>
        </ul>
      </section>

      <section class="block">
        <h3>操作</h3>
        <div class="keys">
          <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 或 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动，按住连续移动</span>
          <span><kbd>Z</kbd> 撤销　<kbd>Esc</kbd> 菜单　<kbd>M</kbd> 静音</span>
          <span>手机请使用屏幕上的方向键。</span>
        </div>
      </section>

      <section class="block">
        <h3>结局</h3>
        <p class="plain">击败第 50 层的终焉之主即为通关。它的防御随第 49 层的星柱守卫减少。</p>
      </section>
    </div>

    <footer class="qr-block">
      <div class="qr-box">
        <img v-if="qr" :src="qr" alt="扫码打开游戏的二维码" />
        <span v-else class="qr-placeholder">正在生成<br />二维码</span>
      </div>
      <div class="qr-text">
        <b>扫码下载 · 手机游玩</b>
        <span>用手机相机扫一扫，即可在手机上打开游戏。</span>
        <small>{{ pageUrl }}</small>
      </div>
    </footer>
  </aside>
</template>

<style scoped>
.intro {
  width: 100%;
  max-height: min(94vh, 980px);
  overflow: hidden;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.intro-head { display: flex; flex-direction: column; gap: 4px; }
.brand-cn {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(64px, 9vh, 96px);
  line-height: 1;
  letter-spacing: 18px;
  padding-left: 18px;
  background: linear-gradient(180deg, #fff6c8 0%, #ffd54a 50%, #c98a12 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 6px 18px rgba(255, 180, 60, 0.3));
}
.brand-en { font-size: 11px; letter-spacing: 6px; color: var(--gold-soft); opacity: 0.85; }
.tagline { margin: 10px 0 0; font-size: 15px; line-height: 1.7; color: var(--muted); }

.block h3 {
  margin: 0 0 7px;
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 3px;
  color: var(--gold);
}
.plain { margin: 0; font-size: 13px; line-height: 1.7; color: var(--muted); }
.plain b { color: var(--gold-soft); }

.route {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.route li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 12px;
  text-align: center;
  background: rgba(255, 213, 107, 0.06);
  border: 1px solid var(--line-gold);
}
.route b { font-size: 12px; color: var(--gold); font-family: var(--font-display); letter-spacing: 1px; }
.route span { font-size: 11.5px; color: var(--muted); }

.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.cards li {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
}
.cards b { font-size: 13px; color: var(--gold-soft); }
.cards span { font-size: 12px; line-height: 1.5; color: var(--muted); }

.trio {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.trio .block h3 { font-size: 13px; }
.tips { margin: 0; padding-left: 16px; font-size: 12px; line-height: 1.6; color: var(--muted); }
.tips li::marker { color: var(--gold); }
.keys { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); line-height: 1.55; }
kbd {
  display: inline-block;
  min-width: 20px;
  padding: 1px 5px;
  margin: 0 1px;
  text-align: center;
  font-family: inherit;
  font-size: 11px;
  color: var(--gold-soft);
  border-radius: 6px;
  border: 1px solid var(--line-gold);
  background: rgba(255, 213, 107, 0.06);
}

.qr-box {
  flex: none;
  width: 104px;
  height: 104px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.qr-block {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line-gold);
}
.qr-box img { width: 100%; height: 100%; display: block; }
.qr-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.qr-text b { font-size: 15px; color: var(--gold); font-family: var(--font-display); letter-spacing: 1px; }
.qr-text span { font-size: 12.5px; line-height: 1.5; color: var(--muted); }
.qr-text small { font-size: 11px; color: var(--muted); opacity: 0.7; word-break: break-all; }
.qr-placeholder { font-size: 11px; line-height: 1.5; color: #6b6b85; text-align: center; }

/* 屏幕较矮时压缩排版，保证仍然只显示一屏 */
@media (max-height: 760px) {
  .intro-story, .route-block, .tagline { display: none; }
}
@media (max-height: 960px) {
  .intro { gap: 9px; }
  .brand-cn { font-size: 56px; letter-spacing: 12px; padding-left: 12px; }
  .tagline { font-size: 13px; line-height: 1.55; margin-top: 6px; }
  .block h3 { margin-bottom: 4px; font-size: 13px; }
  .plain { font-size: 12px; line-height: 1.55; }
  .route li { padding: 6px 3px; }
  .cards { gap: 5px; }
  .cards li { padding: 6px 8px; }
  .cards b { font-size: 12px; }
  .cards span { font-size: 11px; line-height: 1.4; }
  .qr-box { width: 84px; height: 84px; }
  .qr-block { padding: 8px 12px; }
  .brand-cn { font-size: 52px; }
}
</style>
