// Romie is a commercial typeface and is not bundled. Drop licensed files into src/tokens/fonts/romie/
// (e.g. Romie-Regular.woff2, Romie-Medium.woff2, Romie-Italic.woff2) and they register automatically;
// without them the serif stack falls back to Instrument Serif.
const files = import.meta.glob('./fonts/romie/*.{woff2,woff,otf,ttf}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const weightFor = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('light')) return '300'
  if (n.includes('medium')) return '500'
  if (n.includes('semibold')) return '600'
  if (n.includes('bold')) return '700'
  return '400'
}

export function registerRomie() {
  const entries = Object.entries(files)
  if (!entries.length) return false
  const hasRegular = entries.some(([p]) => weightFor(p) === '400' && !p.toLowerCase().includes('italic'))
  for (const [path, url] of entries) {
    const name = path.split('/').pop() ?? ''
    const style = name.toLowerCase().includes('italic') ? 'italic' : 'normal'
    let weight = weightFor(name)
    // Nevis ships only Medium; let it cover the regular weight too.
    if (!hasRegular && weight === '500') weight = '400 500'
    const face = new FontFace('Romie', `url(${url})`, { weight, style, display: 'swap' })
    document.fonts.add(face)
    void face.load()
  }
  return true
}
