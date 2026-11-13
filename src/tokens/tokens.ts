// Mirrors tokens/theme.css for places that need raw values (charts, inline SVG, Figma export).
export const color = {
  canvas: '#F7F6F0',
  surface: '#FFFFFF',
  muted: '#F2F0EA',
  sunken: '#EBE7DF',
  line: '#E5E0D9',
  lineStrong: '#D6CFC5',
  ink: '#141413',
  ink2: '#3D3B37',
  ink3: '#6B6862',
  ink4: '#9A958D',
  taupe900: '#4A423C',
  taupe700: '#8C7F74',
  taupe500: '#BDAFA3',
  taupe300: '#E5E0D9',
  taupe100: '#F1EDE7',
  waiting: '#2F6F8A',
  progress: '#D99A3E',
  done: '#141413',
  danger: '#B0533F',
  success: '#4D7A5D',
  ai: '#3E5F8C',
  aiSoft: '#E9EDF2',
  advisor: '#8F5170',
  advisorSoft: '#F2E7EA',
} as const

export const chartScale = [color.ink, color.taupe900, color.taupe700, color.taupe500, color.taupe300, '#D9CFC2', '#A89A8D', '#6E635A']

/**
 * Nested corners must be concentric: a container's radius is always its child's radius plus the
 * padding between them. Pills (fully rounded) nest inside pills with the same rule by construction.
 */
export const radius = {
  /** Inputs, select triggers, menu items, small tiles. */
  control: 10,
  /** Checkbox box. */
  check: 6,
  /** Dropdown menus: control (10) + 4px padding. */
  menu: 14,
  /** Tooltips: text only, 8px padding. */
  tooltip: 8,
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const

export const concentric = (inner: number, padding: number) => inner + padding
