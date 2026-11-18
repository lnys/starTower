// Run from any directory: node flutter/tool/export-vue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const data=await import(path.join(root,'src/game/star/data.js'));
const art=await import(path.join(root,'src/engine/star-art.js'));
const defs={};
for(const f of ['01-04','05-15','16-27','28-39','29-32','33-36','37-39','40-50']) {
  for(const d of (await import(path.join(root,`src/game/star/maps/floors-${f}.js`))).default) defs[d.index]=d;
}
fs.writeFileSync(path.join(root,'flutter/assets/data/game.json'),JSON.stringify({defs,...data,art},(_,v)=>v===Infinity?'unlimited':v,2));
fs.cpSync(path.join(root,'images'),path.join(root,'flutter/assets/images'),{recursive:true});
fs.copyFileSync(path.join(root,'tests/fixtures/star-route.json'),path.join(root,'flutter/test/route.json'));
console.log('已同步 50 层地图、数值、素材和通关路线。请重新运行 flutter test。');
