export const colors = {
  bg: '#F4F2EE',
  surface: '#FFFFFF',
  ink: '#1C2B29',
  inkSoft: '#3E4A47',
  muted: '#56645F',
  line: '#E4E0D8',
  lineSoft: '#EEEBE5',
  neutralBg: '#E9E6DF',
  handle: '#CFCAC0',

  primary: '#2F5D52',
  primaryDeep: '#3F6E62',
  primaryBorder: '#7FA79B',
  primarySoft: '#DCEAE4',
  primaryInk: '#24493F',
  onPrimaryMuted: '#CFE3DB',
  progressTrack: '#477A6D',
  forecast: '#BFD3CB',

  warnBg: '#FBEFD9',
  warnInk: '#7A4F0E',
  dangerBg: '#F7E1DC',
  dangerInk: '#8E3426',

  toastIcon: '#9FD0BF',
  overlay: 'rgba(28,43,41,0.45)',
  white: '#FFFFFF',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type FontWeight = keyof typeof fonts;

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const spacing = {
  screen: 20,
} as const;
