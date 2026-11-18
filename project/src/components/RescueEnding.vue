<script setup>
import { ref } from 'vue'
import { img } from '../engine/images.js'
defineProps({ hero: { type: Object, required: true } })
const opened = ref(false)
</script>
<template>
  <section class="rescue">
    <div class="stars" aria-hidden="true"><i v-for="i in 28" :key="i" :style="{ left: `${i * 37 % 100}%`, top: `${i * 19 % 100}%`, animationDelay: `${i / 7}s` }">✦</i></div>
    <div class="rescue-content">
      <p class="eyebrow">第五十层 · 重逢</p>
      <h2>终于，等到你</h2>
      <img class="goddess" :src="img('hero/goddess')" alt="获救的女神捧着一颗心，向你微笑" />
      <p class="reunion">星幕散去，她从星光里走向你。<br />“我就知道，你一定会来。”</p>
      <div class="letter" aria-live="polite">
        <template v-if="opened"><div class="heart">♥</div><h3>致我的勇者</h3><p>你走过的每一层，都有一颗星替我记着。<br />谢谢你没有放弃。<br />这次，换我陪你看遍塔外的星空。</p><strong>纪念称号 · 她的唯一勇者</strong></template>
        <template v-else><span class="heart">✉</span><p>她为你留了一封信</p><button @click="opened = true">拆开这份惊喜</button></template>
      </div>
      <p class="stats">通关纪念 · 50 / 50<br />生命 {{ hero.hp }} · 攻击 {{ hero.atk }} · 防御 {{ hero.def }}</p>
    </div>
  </section>
</template>
<style scoped>
.rescue { position: relative; text-align: center; color: #f1e1ed; overflow: hidden; background: radial-gradient(ellipse at 50% 30%, #48315780, transparent 65%); border-radius: 20px; padding: 12px 8px; }
.rescue-content { position: relative; z-index: 1; }
.eyebrow { color: #ffdaa1; letter-spacing: 4px; font-size: 11px; }
h2 { font-size: 30px; color: #ffe9d5; margin: 12px 0; }
.goddess { width: 180px; height: 220px; filter: drop-shadow(0 0 24px #b38ddc66); }
.reunion, .letter p, .stats { line-height: 1.9; font-size: 13px; }
.letter { background: #2c203b; border: 1px solid #8c6385; border-radius: 18px; padding: 18px 12px; margin-top: 20px; }
.heart { font-size: 30px; color: #f3a6c7; }
h3 { color: #ffdebd; margin: 8px; }
.letter strong { display: block; color: #ffd56b; font-size: 12px; margin-top: 12px; }
.letter button { border: 1px solid #c48da9; color: #ffdbe9; background: #57334b; padding: 10px 20px; border-radius: 24px; cursor: pointer; }
.stats { color: #bfb0ce; margin: 20px 0 0; }
.stars { position: absolute; inset: 0; pointer-events: none; }
.stars i { position: absolute; color: #ffe6ac; font-size: 9px; animation: twinkle 3s ease-in-out infinite alternate; }
@keyframes twinkle { from { opacity: .15; transform: translateY(0); } to { opacity: .8; transform: translateY(-12px); } }
@media (prefers-reduced-motion: reduce) { .stars i { animation: none; opacity: .4; } }
</style>
