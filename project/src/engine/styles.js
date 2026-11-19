import catalog from '../../design/styles.json' with { type: 'json' }

export const styles = catalog
export const defaultStyle = styles[0].id
export const resolveStyle = (id) => styles.find((style) => style.id === id) ?? styles[0]

export function styleVariables(id) {
  const { bg, panel, button, accent, muted, trim, radius } = resolveStyle(id)
  return {
    '--skin-bg': `#${bg}`,
    '--skin-panel': `#${panel}`,
    '--skin-button': `#${button}`,
    '--skin-accent': `#${accent}`,
    '--skin-muted': `#${muted}`,
    '--skin-trim': `#${trim}`,
    '--skin-radius': `${radius}px`,
  }
}
