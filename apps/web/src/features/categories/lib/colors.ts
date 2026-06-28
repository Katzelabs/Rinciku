export const PRESET_COLORS = [
  '#7a8d6a',
  '#a3a86b',
  '#c4a86b',
  '#b07a6b',
  '#a36b6b',
  '#a36b8d',
  '#8d6ba3',
  '#6b8da3',
  '#6ba38d',
  '#8d8d8d',
] as const;

export type PresetColor = (typeof PRESET_COLORS)[number];
