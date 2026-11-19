export const languages = Object.freeze([
  { id: 'zh-CN', name: '简体中文' },
  { id: 'en', name: 'English' },
  { id: 'ja', name: '日本語' },
])

export function resolveLanguage(value) {
  return languages.some(({ id }) => id === value) ? value : 'zh-CN'
}
