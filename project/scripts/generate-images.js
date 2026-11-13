// 素材生成脚本：用代码批量生成 SVG 素材，输出到 images/ 目录
// 运行：npm run images
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'images')

const THEMES = {
  stone: { floorA: '#3d3f54', floorB: '#34364a', line: '#2a2c3d', wallA: '#72758f', wallB: '#5a5d76', mortar: '#2a2c3d', accent: '#a9b3dc' },
  moss: { floorA: '#2f4f3e', floorB: '#274535', line: '#1f3a2b', wallA: '#55845f', wallB: '#41684a', mortar: '#1b2e22', accent: '#9fe0ae' },
  lava: { floorA: '#4d2c25', floorB: '#41251f', line: '#341c17', wallA: '#94512f', wallB: '#743c25', mortar: '#2a1410', accent: '#ffb06a' },
  abyss: { floorA: '#2b2243', floorB: '#251c3a', line: '#1e1631', wallA: '#524080', wallB: '#3f3166', mortar: '#170f2b', accent: '#d0a0ff' },
}

const wrap = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`

const write = (rel, content) => {
  const file = join(ROOT, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content, 'utf8')
}

// ---------- 地面 & 墙 ----------
// 小型伪随机数，保证每次生成的素材一致
function rng(seed) {
  let v = seed
  return () => ((v = (v * 16807) % 2147483647) / 2147483647)
}

// 地面：不再画网格线，改用柔和的明暗斑块，消除条纹感
function floorTile(t) {
  const r = rng(11)
  let body = `<rect width="64" height="64" fill="${t.floorA}"/>`
  for (let i = 0; i < 22; i++) {
    const x = r() * 64
    const y = r() * 64
    const rad = 5 + r() * 9
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="${r() > 0.5 ? t.floorB : t.floorA}" opacity="${(0.2 + r() * 0.3).toFixed(2)}"/>`
  }
  body += `<circle cx="20" cy="46" r="1.2" fill="${t.accent}" opacity="0.2"/><circle cx="44" cy="18" r="1" fill="${t.accent}" opacity="0.15"/>`
  return wrap(body)
}

// 墙：每块砖明暗略有不同，打破整行一致的横向条纹
function wallTile(t) {
  const r = rng(29)
  const defs = `<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.wallA}"/><stop offset="1" stop-color="${t.wallB}"/></linearGradient>`
  let body = `<rect width="64" height="64" fill="${t.mortar}"/>`
  for (let row = 0; row < 4; row++) {
    const y = row * 16 + 1
    const off = row % 2 ? 0 : 8
    for (let c = -1; c < 4; c++) {
      const x = c * 16 + off + 1
      body += `<rect x="${x}" y="${y}" width="14" height="14" rx="2" fill="url(#wg)"/>`
      body += `<rect x="${x}" y="${y}" width="14" height="14" rx="2" fill="${r() > 0.5 ? '#ffffff' : '#000000'}" opacity="${(0.03 + r() * 0.06).toFixed(2)}"/>`
      body += `<rect x="${x + 1}" y="${y + 1}" width="12" height="3" rx="1.5" fill="#ffffff" opacity="0.05"/>`
    }
  }
  body += `<path d="M10 40 L16 36 L14 44" stroke="${t.accent}" stroke-width="0.8" fill="none" opacity="0.3"/>`
  return wrap(body, defs)
}

// ---------- 楼梯 / 商店 ----------
function stair(up) {
  const defs = `<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1b26"/><stop offset="1" stop-color="#0c0c12"/></linearGradient>`
  let body = `<rect width="64" height="64" fill="#2c2c3a"/><rect x="6" y="6" width="52" height="52" rx="6" fill="url(#sg)"/>`
  for (let i = 0; i < 5; i++) {
    const w = 40 - i * 6
    const y = up ? 46 - i * 7 : 16 + i * 7
    body += `<rect x="${32 - w / 2}" y="${y}" width="${w}" height="5" rx="1.5" fill="${up ? '#e8d7a0' : '#8fa0c8'}" opacity="${0.45 + i * 0.12}"/>`
  }
  body += up
    ? `<path d="M32 10 L40 20 L24 20 Z" fill="#ffd66b"/>`
    : `<path d="M32 54 L40 44 L24 44 Z" fill="#8fd3ff"/>`
  return wrap(body, defs)
}

function shop() {
  const defs = `<linearGradient id="aw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c0392b"/><stop offset="1" stop-color="#e67e22"/></linearGradient>`
  let body = `<rect width="64" height="64" fill="#3a2a1e"/>`
  body += `<rect x="10" y="26" width="44" height="28" rx="3" fill="#7a4e2c"/><rect x="14" y="34" width="36" height="16" fill="#3b2415"/>`
  body += `<path d="M6 26 L10 14 L54 14 L58 26 Z" fill="url(#aw)"/>`
  for (let i = 0; i < 6; i++) body += `<path d="M${6 + i * 8.6} 26 q4.3 6 8.6 0" fill="${i % 2 ? '#fff3d0' : '#c0392b'}" opacity="0.9"/>`
  body += `<circle cx="22" cy="42" r="3" fill="#ffd54a"/><circle cx="32" cy="42" r="3" fill="#8fd3ff"/><circle cx="42" cy="42" r="3" fill="#ff6b6b"/>`
  return wrap(body, defs)
}

// ---------- 门 ----------
function door(color, dark, light) {
  const defs = `<linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`
  let body = `<rect width="64" height="64" fill="#2c2c3a"/>`
  body += `<rect x="6" y="4" width="52" height="56" rx="4" fill="url(#dg)" stroke="#1a1a22" stroke-width="2"/>`
  for (let i = 0; i < 4; i++) body += `<rect x="${12 + i * 10}" y="10" width="3" height="44" rx="1.5" fill="#000" opacity="0.25"/>`
  body += `<rect x="10" y="8" width="44" height="3" fill="#ffffff" opacity="0.25"/>`
  body += `<circle cx="32" cy="32" r="7" fill="${dark}" stroke="#fff" stroke-opacity="0.5" stroke-width="1.5"/>`
  body += `<circle cx="32" cy="32" r="2.5" fill="${light}"/>`
  body += `<path d="M14 52 h36" stroke="${color}" stroke-width="2" opacity="0.8"/>`
  return wrap(body, defs)
}

// ---------- 道具 ----------
function key(color, dark, light) {
  const defs = `<linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`
  let body = `<circle cx="22" cy="26" r="11" fill="url(#kg)" stroke="#1a1a22" stroke-width="1.5"/><circle cx="22" cy="26" r="4.5" fill="#1a1a22" opacity="0.7"/>`
  body += `<rect x="31" y="23" width="22" height="6" rx="2" fill="url(#kg)" stroke="#1a1a22" stroke-width="1"/>`
  body += `<rect x="45" y="29" width="4" height="7" fill="url(#kg)"/><rect x="51" y="29" width="4" height="10" fill="url(#kg)"/>`
  body += `<ellipse cx="19" cy="21" rx="4" ry="2" fill="#fff" opacity="0.5"/>`
  return wrap(body, defs)
}

function potion(small) {
  const c = small ? '#ff5d7a' : '#ff2f5f'
  const defs = `<linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0.5"/><stop offset="0.5" stop-color="${c}"/><stop offset="1" stop-color="#7a0e2a"/></linearGradient>`
  const s = small ? 0.8 : 1
  const tx = small ? 12 : 6
  const ty = small ? 14 : 4
  let body = `<g transform="translate(${tx} ${ty}) scale(${s})">`
  body += `<rect x="24" y="2" width="16" height="8" rx="2" fill="#c9a86a"/>`
  body += `<path d="M26 10 h12 v6 q12 6 12 18 q0 14 -18 14 q-18 0 -18 -14 q0 -12 12 -18 z" fill="url(#pg)" stroke="#2a0a14" stroke-width="1.5"/>`
  body += `<ellipse cx="22" cy="38" rx="3" ry="6" fill="#fff" opacity="0.35"/>`
  body += `</g>`
  return wrap(body, defs)
}

function gem(color, light, dark) {
  const defs = `<linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`
  let body = `<ellipse cx="32" cy="56" rx="16" ry="3" fill="#000" opacity="0.3"/>`
  body += `<path d="M18 22 L46 22 L56 32 L32 56 L8 32 Z" fill="url(#gg)" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>`
  body += `<path d="M8 32 L56 32 M18 22 L32 32 L46 22 M32 32 L32 56" stroke="#fff" stroke-opacity="0.35" stroke-width="1" fill="none"/>`
  body += `<path d="M22 24 L30 24 L24 30 Z" fill="#fff" opacity="0.6"/>`
  return wrap(body, defs)
}

function sword() {
  const defs = `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9fb3d6"/></linearGradient>`
  let body = `<g transform="rotate(35 32 32)">`
  body += `<path d="M32 4 L37 10 L37 40 L32 44 L27 40 L27 10 Z" fill="url(#sw)" stroke="#1a2030" stroke-width="1.2"/>`
  body += `<rect x="20" y="40" width="24" height="5" rx="2" fill="#d4a54a" stroke="#4a3010" stroke-width="1"/>`
  body += `<rect x="29" y="45" width="6" height="11" rx="2" fill="#7a4a22"/><circle cx="32" cy="58" r="3" fill="#d4a54a"/>`
  body += `<path d="M31 8 L31 38" stroke="#fff" stroke-width="1" opacity="0.7"/></g>`
  return wrap(body, defs)
}

function shield() {
  const defs = `<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb4ff"/><stop offset="1" stop-color="#2a4a86"/></linearGradient>`
  let body = `<path d="M32 6 L54 12 L52 34 Q50 50 32 58 Q14 50 12 34 L10 12 Z" fill="url(#sh)" stroke="#0e1a33" stroke-width="2"/>`
  body += `<path d="M32 12 L46 16 L44 32 Q42 42 32 48 Q22 42 20 32 L18 16 Z" fill="none" stroke="#ffd966" stroke-width="2"/>`
  body += `<path d="M32 18 L32 44 M22 30 L42 30" stroke="#ffd966" stroke-width="2.5" opacity="0.9"/>`
  return wrap(body, defs)
}

function scroll() {
  const defs = `<linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#e2c27a"/></linearGradient>`
  let body = `<rect x="14" y="10" width="36" height="44" rx="3" fill="url(#sc)" stroke="#8a6a2a" stroke-width="1.5"/>`
  body += `<circle cx="14" cy="32" r="4" fill="#c9a050"/><circle cx="50" cy="32" r="4" fill="#c9a050"/>`
  body += `<path d="M22 22 h20 M22 30 h20 M22 38 h14" stroke="#7a5a20" stroke-width="2" stroke-linecap="round"/>`
  body += `<path d="M32 40 l3 6 l-3 -2 l-3 2 z" fill="#c0392b"/>`
  return wrap(body, defs)
}

function star() {
  const defs = `<radialGradient id="st" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#ffe066"/><stop offset="1" stop-color="#d08a10"/></radialGradient>`
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 12 : 26
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(32 + r * Math.cos(a)).toFixed(1)},${(34 + r * Math.sin(a)).toFixed(1)}`)
  }
  let body = `<circle cx="32" cy="32" r="30" fill="#ffe066" opacity="0.12"/>`
  body += `<polygon points="${pts.join(' ')}" fill="url(#st)" stroke="#8a5a00" stroke-width="1.5" stroke-linejoin="round"/>`
  return wrap(body, defs)
}

// ---------- 勇士 ----------
function hero() {
  const defs = `<linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa8ff"/><stop offset="1" stop-color="#2452a0"/></linearGradient>
  <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e2e3e"/><stop offset="1" stop-color="#4d1520"/></linearGradient>
  <radialGradient id="hglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>`
  let body = `<circle cx="32" cy="32" r="30" fill="url(#hglow)"/>`
  body += `<ellipse cx="32" cy="59" rx="16" ry="3.5" fill="#000" opacity="0.35"/>`
  body += `<path d="M18 36 Q18 60 32 60 Q46 60 46 36 Z" fill="url(#hc)"/>`
  body += `<rect x="22" y="30" width="20" height="22" rx="5" fill="url(#hb)" stroke="#0d1d40" stroke-width="1.2"/>`
  body += `<path d="M32 30 L32 50" stroke="#ffd966" stroke-width="2"/>`
  body += `<circle cx="32" cy="22" r="10" fill="#f2c9a0" stroke="#5a3a20" stroke-width="1"/>`
  body += `<path d="M21 20 Q21 8 32 8 Q43 8 43 20 L43 22 L21 22 Z" fill="#b8c4dc" stroke="#2a3248" stroke-width="1.2"/>`
  body += `<path d="M28 4 L32 0 L36 4 L34 9 L30 9 Z" fill="#ff5d7a"/>`
  body += `<rect x="26" y="18" width="12" height="3" rx="1.5" fill="#1a2030"/><circle cx="28.5" cy="19.5" r="1.1" fill="#8fd3ff"/><circle cx="35.5" cy="19.5" r="1.1" fill="#8fd3ff"/>`
  body += `<path d="M46 34 L56 26 L58 30 L49 40 Z" fill="#dfe6f5" stroke="#2a3248" stroke-width="1"/>`
  body += `<rect x="45" y="38" width="7" height="3" rx="1" fill="#d4a54a"/>`
  return wrap(body, defs)
}

// ---------- 怪物 ----------
const eyes = (y, dx = 9, color = '#fff', pupil = '#111') =>
  `<circle cx="${32 - dx}" cy="${y}" r="3.6" fill="${color}"/><circle cx="${32 + dx}" cy="${y}" r="3.6" fill="${color}"/><circle cx="${32 - dx + 0.8}" cy="${y + 0.5}" r="1.8" fill="${pupil}"/><circle cx="${32 + dx + 0.8}" cy="${y + 0.5}" r="1.8" fill="${pupil}"/>`

function slime(base, light, dark) {
  const defs = `<radialGradient id="sl" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="${light}"/><stop offset="0.6" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`
  let body = `<ellipse cx="32" cy="58" rx="22" ry="4" fill="#000" opacity="0.3"/>`
  body += `<path d="M10 52 Q8 26 32 18 Q56 26 54 52 Q54 58 32 58 Q10 58 10 52 Z" fill="url(#sl)" stroke="${dark}" stroke-width="1.5"/>`
  body += `<ellipse cx="22" cy="28" rx="6" ry="3" fill="#fff" opacity="0.5"/>`
  body += eyes(40, 8)
  body += `<path d="M28 48 Q32 52 36 48" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round"/>`
  return wrap(body, defs)
}

function bat() {
  const defs = `<linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6cff"/><stop offset="1" stop-color="#3a2a7a"/></linearGradient>`
  let body = `<path d="M32 26 Q18 10 4 18 Q10 26 6 34 Q16 36 22 44 Q28 40 32 44 Q36 40 42 44 Q48 36 58 34 Q54 26 60 18 Q46 10 32 26 Z" fill="url(#bt)" stroke="#1a1040" stroke-width="1.5"/>`
  body += `<path d="M14 24 L22 34 M50 24 L42 34" stroke="#1a1040" stroke-width="1.5" opacity="0.6"/>`
  body += `<path d="M26 26 L24 14 L30 22 Z M38 26 L40 14 L34 22 Z" fill="#e8e0ff"/>`
  body += `<ellipse cx="32" cy="36" rx="9" ry="10" fill="#4a3a8a" stroke="#1a1040" stroke-width="1.2"/>`
  body += eyes(33, 4, '#ff7a9a', '#2a0010')
  return wrap(body, defs)
}

function skeleton(crown = false, helm = false, scale = 1) {
  const defs = `<radialGradient id="sk" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9b3a2"/></radialGradient>`
  let body = `<ellipse cx="32" cy="60" rx="18" ry="3.5" fill="#000" opacity="0.35"/>`
  body += `<g transform="translate(32 32) scale(${scale}) translate(-32 -32)">`
  body += `<path d="M20 60 L24 40 L40 40 L44 60 Z" fill="#8c867a" stroke="#2a2620" stroke-width="1"/>`
  body += `<path d="M24 44 h16 M24 49 h16 M24 54 h16" stroke="#e8e0cc" stroke-width="2"/>`
  body += `<path d="M22 10 Q22 4 32 4 Q42 4 42 10 L42 26 Q42 34 32 36 Q22 34 22 26 Z" fill="url(#sk)" stroke="#3a362e" stroke-width="1.2"/>`
  body += eyes(20, 6, '#120d05', '#ff6a3a')
  body += `<path d="M28 30 L32 33 L36 30 M28 33 h8" stroke="#3a362e" stroke-width="1.2" fill="none"/>`
  if (helm) body += `<path d="M20 12 Q32 -2 44 12 L44 16 L20 16 Z" fill="#6b6f7e" stroke="#20222c" stroke-width="1.2"/><rect x="28" y="0" width="8" height="5" fill="#c0392b"/>`
  if (crown) body += `<path d="M20 12 L24 2 L28 9 L32 0 L36 9 L40 2 L44 12 Z" fill="#ffd54a" stroke="#7a5a00" stroke-width="1.2"/><circle cx="32" cy="7" r="2" fill="#ff4a6a"/>`
  body += `</g>`
  // 手中武器
  body += `<path d="M50 16 L58 6 L56 14 L52 22 Z" fill="#dfe6f5" stroke="#2a3248" stroke-width="1"/>`
  return wrap(body, defs)
}

function golem() {
  const defs = `<linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa0b4"/><stop offset="1" stop-color="#4a4f62"/></linearGradient>`
  let body = `<ellipse cx="32" cy="60" rx="22" ry="4" fill="#000" opacity="0.35"/>`
  body += `<rect x="12" y="20" width="40" height="38" rx="10" fill="url(#gm)" stroke="#1a1d28" stroke-width="2"/>`
  body += `<path d="M24 26 L30 38 L26 44 M40 30 L36 40 L42 50" stroke="#2a2e3c" stroke-width="2" fill="none"/>`
  body += `<circle cx="32" cy="12" r="10" fill="url(#gm)" stroke="#1a1d28" stroke-width="2"/>`
  body += `<circle cx="28" cy="12" r="2.5" fill="#ffb347"/><circle cx="36" cy="12" r="2.5" fill="#ffb347"/>`
  body += `<circle cx="28" cy="12" r="5" fill="#ffb347" opacity="0.25"/><circle cx="36" cy="12" r="5" fill="#ffb347" opacity="0.25"/>`
  body += `<rect x="6" y="28" width="8" height="18" rx="4" fill="#5a6076" stroke="#1a1d28" stroke-width="1.5"/><rect x="50" y="28" width="8" height="18" rx="4" fill="#5a6076" stroke="#1a1d28" stroke-width="1.5"/>`
  return wrap(body, defs)
}

function demon() {
  const defs = `<radialGradient id="dm" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#ff8a3a"/><stop offset="0.7" stop-color="#b8321e"/><stop offset="1" stop-color="#4a0f0a"/></radialGradient>`
  let body = `<ellipse cx="32" cy="60" rx="20" ry="3.5" fill="#000" opacity="0.35"/>`
  body += `<path d="M14 24 L8 6 L20 14 Z M50 24 L56 6 L44 14 Z" fill="#3a0a06" stroke="#1a0302" stroke-width="1.2"/>`
  body += `<path d="M32 4 Q42 20 46 34 Q52 56 32 60 Q12 56 18 34 Q22 20 32 4 Z" fill="url(#dm)" stroke="#2a0503" stroke-width="1.5"/>`
  body += `<path d="M26 4 Q30 10 32 4 Q34 10 38 4" stroke="#ffcc66" stroke-width="2" fill="none"/>`
  body += eyes(30, 8, '#ffe066', '#2a0503')
  body += `<path d="M24 44 Q32 50 40 44" stroke="#2a0503" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  body += `<path d="M24 44 l2 4 M32 46 l0 4 M40 44 l-2 4" stroke="#fff" stroke-width="1.5"/>`
  return wrap(body, defs)
}

function abyssLord() {
  const defs = `<radialGradient id="al" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#6a3aa0"/><stop offset="0.7" stop-color="#2a1450"/><stop offset="1" stop-color="#0c0418"/></radialGradient>
  <radialGradient id="aglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c58bff" stop-opacity="0.6"/><stop offset="1" stop-color="#c58bff" stop-opacity="0"/></radialGradient>`
  let body = `<circle cx="32" cy="34" r="30" fill="url(#aglow)"/>`
  body += `<ellipse cx="32" cy="60" rx="22" ry="3.5" fill="#000" opacity="0.5"/>`
  body += `<path d="M10 60 Q6 30 22 18 L32 8 L42 18 Q58 30 54 60 Z" fill="url(#al)" stroke="#c58bff" stroke-width="1.5"/>`
  body += `<path d="M20 20 L24 4 L30 14 L32 0 L34 14 L40 4 L44 20 Z" fill="#ffd66b" stroke="#7a5a00" stroke-width="1.2"/>`
  body += `<circle cx="32" cy="8" r="2.5" fill="#ff4a8a"/>`
  body += eyes(28, 8, '#ff8ad8', '#2a0a30')
  body += `<path d="M22 44 Q32 50 42 44 M26 52 l2 -4 l2 4 M34 52 l2 -4 l2 4" stroke="#c58bff" stroke-width="1.6" fill="none"/>`
  body += `<path d="M14 60 L10 40 M50 60 L54 40" stroke="#8a5ad0" stroke-width="2" opacity="0.6"/>`
  return wrap(body, defs)
}

// ---------- UI 图标 ----------
function icon(kind) {
  const map = {
    hp: `<path d="M32 54 L12 34 Q4 24 12 16 Q22 10 32 22 Q42 10 52 16 Q60 24 52 34 Z" fill="#ff4d6d" stroke="#5a0a1a" stroke-width="2"/><ellipse cx="22" cy="24" rx="4" ry="2.5" fill="#fff" opacity="0.6"/>`,
    atk: `<path d="M32 4 L38 12 L38 42 L32 48 L26 42 L26 12 Z" fill="#dfe6f5" stroke="#2a3248" stroke-width="2"/><rect x="20" y="42" width="24" height="5" rx="2" fill="#d4a54a"/><rect x="29" y="47" width="6" height="11" rx="2" fill="#7a4a22"/>`,
    def: `<path d="M32 6 L54 12 L52 34 Q50 50 32 58 Q14 50 12 34 L10 12 Z" fill="#6aa8ff" stroke="#0e1a33" stroke-width="2.5"/><path d="M32 18 L32 44" stroke="#ffd966" stroke-width="3"/>`,
    gold: `<circle cx="32" cy="32" r="24" fill="#ffd54a" stroke="#7a5a00" stroke-width="3"/><circle cx="32" cy="32" r="16" fill="none" stroke="#c9961a" stroke-width="2"/><text x="32" y="41" text-anchor="middle" font-size="22" font-weight="700" fill="#7a5a00" font-family="serif">¥</text>`,
    exp: `<polygon points="32,4 40,24 60,24 44,36 50,56 32,44 14,56 20,36 4,24 24,24" fill="#8fd3ff" stroke="#124a6a" stroke-width="2"/>`,
    floor: `<path d="M8 52 L56 52 L56 40 L44 40 L44 28 L32 28 L32 16 L20 16 L20 6 L8 6 Z" fill="#c9b07a" stroke="#4a3a1a" stroke-width="2"/>`,
    crown: `<path d="M8 46 L12 18 L24 32 L32 12 L40 32 L52 18 L56 46 Z" fill="#ffd54a" stroke="#7a5a00" stroke-width="2.5"/>`,
    skull: `<path d="M32 6 Q52 6 52 26 Q52 36 46 40 L46 52 L18 52 L18 40 Q12 36 12 26 Q12 6 32 6 Z" fill="#f2efe6" stroke="#3a362e" stroke-width="2"/><circle cx="24" cy="28" r="6" fill="#120d05"/><circle cx="40" cy="28" r="6" fill="#120d05"/>`,
  }
  return wrap(map[kind])
}

// ---------- 背景 ----------
function menuBg() {
  const defs = `<radialGradient id="mb" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#2a2060"/><stop offset="0.6" stop-color="#120c30"/><stop offset="1" stop-color="#05040f"/></radialGradient>`
  let stars = ''
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 120; i++) {
    const x = rnd() * 1600, y = rnd() * 900, r = rnd() * 1.8 + 0.4
    stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(0.3 + rnd() * 0.7).toFixed(2)}"/>`
  }
  const body = `<rect width="1600" height="900" fill="url(#mb)"/>${stars}
  <path d="M700 900 L700 360 L740 300 L780 360 L780 900 Z M820 900 L820 240 L860 180 L900 240 L900 900 Z" fill="#0a0820" opacity="0.85"/>
  <path d="M0 900 L0 600 L220 600 L220 480 L420 480 L420 600 L1600 600 L1600 900 Z" fill="#0a0820" opacity="0.7"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900"><defs>${defs}</defs>${body}</svg>`
}

// ================= 写出 =================
for (const [name, t] of Object.entries(THEMES)) {
  write(`tiles/floor_${name}.svg`, floorTile(t))
  write(`tiles/wall_${name}.svg`, wallTile(t))
}
write('tiles/stair_up.svg', stair(true))
write('tiles/stair_down.svg', stair(false))
write('tiles/shop.svg', shop())
write('tiles/door_y.svg', door('#ffd54a', '#8a6200', '#ffe89a'))
write('tiles/door_b.svg', door('#6fb6ff', '#1a4a8a', '#a8d4ff'))
write('tiles/door_r.svg', door('#ff7a7a', '#7a1a1a', '#ffb0b0'))

write('items/key_y.svg', key('#ffd54a', '#8a6200', '#fff0a0'))
write('items/key_b.svg', key('#6fb6ff', '#1a4a8a', '#c4e4ff'))
write('items/key_r.svg', key('#ff7a7a', '#7a1a1a', '#ffc4c4'))
write('items/potion_s.svg', potion(true))
write('items/potion_h.svg', potion(false))
write('items/gem_a.svg', gem('#ff5d5d', '#ffb0b0', '#8a1020'))
write('items/gem_p.svg', gem('#5d9dff', '#b0d4ff', '#14408a'))
write('items/sword.svg', sword())
write('items/shield.svg', shield())
write('items/scroll.svg', scroll())
write('items/star.svg', star())

write('hero/hero.svg', hero())

write('monsters/mon_1.svg', slime('#5fd16f', '#c4ffcf', '#1d6b2e'))
write('monsters/mon_2.svg', slime('#ff6464', '#ffc4c4', '#7a1212'))
write('monsters/mon_3.svg', bat())
write('monsters/mon_4.svg', skeleton())
write('monsters/mon_5.svg', skeleton(false, true, 1.05))
write('monsters/mon_6.svg', golem())
write('monsters/mon_7.svg', demon())
write('monsters/mon_8.svg', abyssLord())
write('monsters/mon_9.svg', skeleton(true, false, 1.1))

for (const k of ['hp', 'atk', 'def', 'gold', 'exp', 'floor', 'crown', 'skull']) write(`ui/icon_${k}.svg`, icon(k))
write('bg/menu.svg', menuBg())

// ---------- 新增：冰封 / 虚空 主题与新怪物（由已有素材换色或新画的简单形体） ----------
const recolor = (svg, map) => {
  let s = svg
  for (const [from, to] of Object.entries(map)) s = s.split(from).join(to)
  return s
}

function wolf() {
  const defs = `<linearGradient id="wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#7fa6c8"/></linearGradient>`
  let body = `<ellipse cx="32" cy="58" rx="22" ry="4" fill="#000" opacity="0.3"/>`
  body += `<path d="M10 46 Q14 30 30 32 L46 30 Q56 30 56 42 L56 52 L48 52 L46 44 L22 44 L20 52 L12 52 Z" fill="url(#wf)" stroke="#2a4a66" stroke-width="1.5"/>`
  body += `<path d="M30 32 Q24 18 36 16 Q46 16 46 30 Z" fill="url(#wf)" stroke="#2a4a66" stroke-width="1.5"/>`
  body += `<path d="M38 18 L36 6 L44 15 Z M44 16 L50 6 L51 20 Z" fill="url(#wf)" stroke="#2a4a66" stroke-width="1.2"/>`
  body += `<circle cx="40" cy="24" r="2.2" fill="#8fe9ff"/><circle cx="46" cy="25" r="2" fill="#8fe9ff"/>`
  body += `<path d="M12 40 Q2 30 6 22" stroke="#7fa6c8" stroke-width="3" fill="none" stroke-linecap="round"/>`
  return wrap(body, defs)
}

function mage(robe = '#4a2d8a', trim = '#c9b3ff') {
  const defs = `<linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${robe}"/><stop offset="1" stop-color="#1a0e33"/></linearGradient>`
  let body = `<ellipse cx="32" cy="60" rx="18" ry="3.5" fill="#000" opacity="0.35"/>`
  body += `<path d="M14 60 L22 26 Q32 18 42 26 L50 60 Z" fill="url(#mg)" stroke="${trim}" stroke-width="1.2"/>`
  body += `<path d="M22 26 Q32 4 42 26 Z" fill="url(#mg)" stroke="${trim}" stroke-width="1.2"/>`
  body += `<ellipse cx="32" cy="24" rx="5" ry="6" fill="#0a0614"/>`
  body += `<circle cx="30" cy="24" r="1.2" fill="${trim}"/><circle cx="34" cy="24" r="1.2" fill="${trim}"/>`
  body += `<path d="M52 60 L52 14" stroke="#8a6a3a" stroke-width="2.2"/><circle cx="52" cy="12" r="4" fill="${trim}" opacity="0.9"/>`
  return wrap(body, defs)
}

THEMES.ice = { floorA: '#2a4a66', floorB: '#22405a', line: '#1a3146', wallA: '#8fb8d8', wallB: '#5f88aa', mortar: '#1a3146', accent: '#bfe9ff' }
THEMES.void = { floorA: '#2b1846', floorB: '#24143d', line: '#1b0e2e', wallA: '#6f4fa8', wallB: '#4f3480', mortar: '#170c2a', accent: '#e0a8ff' }
THEMES.dusk = { floorA: '#3a3026', floorB: '#33291f', line: '#261e16', wallA: '#8c7457', wallB: '#6e5a43', mortar: '#241c14', accent: '#e6c48a' }
for (const name of ['ice', 'void', 'dusk']) {
  write(`tiles/floor_${name}.svg`, floorTile(THEMES[name]))
  write(`tiles/wall_${name}.svg`, wallTile(THEMES[name]))
}

// 新怪物素材：C 霜狼 D 冰霜巨人 E 寒霜术士 Q 霜魔王 F 虚空触手 I 暗影骑士 J 裂隙术者 L 虚空巨像 V 虚空之主
write('monsters/mon_C.svg', wolf())
write('monsters/mon_D.svg', recolor(golem(), { '#9aa0b4': '#cfe9ff', '#4a4f62': '#2d5b8a', '#5a6076': '#4f7aa8', '#ffb347': '#8fe9ff' }))
write('monsters/mon_E.svg', mage('#2a5a8a', '#bfe9ff'))
write('monsters/mon_Q.svg', recolor(abyssLord(), { '#6a3aa0': '#5aa8e6', '#2a1450': '#1d3a66', '#0c0418': '#081a33', '#c58bff': '#9fe3ff', '#ffd66b': '#e8fbff', '#ff8ad8': '#bff4ff', '#ff4a8a': '#6fd8ff', '#8a5ad0': '#4a90d0' }))
write('monsters/mon_F.svg', recolor(demon(), { '#ff8a3a': '#c05cff', '#b8321e': '#6a1fa8', '#4a0f0a': '#22063f', '#3a0a06': '#1c0630', '#1a0302': '#0d0218', '#ffe066': '#ff7af0', '#ffcc66': '#ffb3ff', '#2a0503': '#12041f' }))
write('monsters/mon_I.svg', recolor(skeleton(false, true, 1.05), { '#ffffff': '#8a8fa8', '#b9b3a2': '#3a3d52', '#6b6f7e': '#22243a', '#c0392b': '#7a1fa8', '#8c867a': '#2a2c3a', '#e8e0cc': '#5a5f7a', '#120d05': '#05050c', '#ff6a3a': '#c77dff', '#dfe6f5': '#6e7aa6' }))
write('monsters/mon_J.svg', mage('#5a2a7a', '#ff9af0'))
write('monsters/mon_L.svg', recolor(golem(), { '#9aa0b4': '#b08cff', '#4a4f62': '#2a1452', '#5a6076': '#4a2a80', '#ffb347': '#ff7af0' }))
write('monsters/mon_V.svg', recolor(abyssLord(), { '#6a3aa0': '#8a1a2a', '#2a1450': '#3a0810', '#0c0418': '#0a0205', '#c58bff': '#ff5a6a', '#ffd66b': '#ffe08a', '#ff8ad8': '#ffb0b0', '#ff4a8a': '#ff2a2a', '#8a5ad0': '#c02a3a' }))

console.log('素材已生成到 images/ 目录')
