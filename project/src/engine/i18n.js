import catalog from '../../design/translations.json' with { type: 'json' }

// Chinese is both the source text and the fallback for unknown messages.
export function translate(language, source, ...args) {
  const message = (language === 'zh-CN' ? source : catalog[source]?.[language === 'en' ? 0 : 1]) ?? source
  return message.replace(/\{(\d+)\}/g, (match, i) => args[i] ?? match)
}

const placeholder = /\{\d+\}/g
const specificity = (key) => key.replace(placeholder, '').length
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = Object.keys(catalog)
  .filter(key => /\{\d+\}/.test(key))
  .sort((a, b) => specificity(b) - specificity(a))
  .map(key => [
    key,
    new RegExp('^' + key.split(placeholder).map(escapeRegExp).join('((?:(?! · ).)+?)') + '$'),
  ])

// Engines return Chinese messages independently of the display language.
export function translateMessage(language, source) {
  if (!source || language === 'zh-CN') return source
  const localize = text => translateMessage(language, text)
  if (Object.hasOwn(catalog, source)) return translate(language, source)
  for (const [key, pattern] of patterns) {
    const match = pattern.exec(source)
    if (match) return translate(language, key, ...match.slice(1).map(localize))
  }
  if (source.includes('\n')) return source.split('\n').map(localize).join('\n')
  if (source.includes(' · ')) return source.split(' · ').map(localize).join(' · ')
  return source
}
