/**
 * Warm Kitchen color tokens — keep in sync with frontend/tailwind.config.js
 * and frontend/design-system/lardermind/MASTER.md
 */
export const colors = {
  ink: '#1F2420',
  muted: '#5E675F',
  linen: '#F3F0E8',
  surface: '#FAF8F3',
  herb: '#4F6B4A',
  herbDeep: '#3A5238',
  sage: '#D8E0D0',
  line: '#DDD8CC',
  danger: '#B42318',
  onHerb: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
