// 素材索引：自动收集 images/ 目录下的所有 SVG，并由构建工具生成可访问的 URL
const modules = import.meta.glob('../../images/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const urls = {}
for (const [path, url] of Object.entries(modules)) {
  // ../../images/tiles/wall_stone.svg -> tiles/wall_stone
  const key = path.replace(/^.*images\//, '').replace(/\.svg$/, '')
  urls[key] = url
}

/** 通过相对键名获取素材地址，例如 img('monsters/mon_1') */
export function img(key) {
  return urls[key] || ''
}
